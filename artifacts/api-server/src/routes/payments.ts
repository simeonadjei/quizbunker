import { Router } from "express";
import { db, usersTable, paymentsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";

const router = Router();

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

const PLANS = {
  monthly:  { amount: 1000,  months: 1  },
  semester: { amount: 3000,  months: 4  },
  yearly:   { amount: 5000,  months: 12 },
} as const;

type PlanKey = keyof typeof PLANS;

// POST /payments/initialize
router.post("/payments/initialize", requireAuth, async (req, res) => {
  const { plan, semesterStart } = req.body as { plan: string; semesterStart?: string | null };

  if (!(plan in PLANS)) {
    return res.status(400).json({ error: "Invalid plan. Choose: monthly, semester, or yearly" });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return res.status(400).json({ error: "Payment system not yet configured — contact admin." });
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId!))
    .limit(1);

  if (!user) return res.status(401).json({ error: "Not authenticated" });

  const reference = `EXAM_${Date.now()}_${user.id}_${Math.random().toString(36).slice(2, 7)}`;
  const { amount } = PLANS[plan as PlanKey];

  // Save pending payment record
  await db.insert(paymentsTable).values({
    userId: user.id,
    plan,
    amount,
    reference,
    status: "pending",
    semesterStart: semesterStart ? new Date(semesterStart) : null,
  });

  // Detect the callback URL from the request origin
  const origin =
    (req.headers.origin as string) ||
    `https://${process.env.REPLIT_DEV_DOMAIN || "localhost"}`;
  const callbackUrl = `${origin}/subscribe/verify?reference=${reference}`;

  const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user.email,
      amount,
      reference,
      callback_url: callbackUrl,
      currency: "GHS",
      metadata: { plan, semesterStart: semesterStart ?? null },
    }),
  });

  const data = (await paystackRes.json()) as { status: boolean; data?: { authorization_url: string }; message?: string };

  if (!data.status || !data.data) {
    return res.status(400).json({ error: data.message || "Payment initialization failed" });
  }

  return res.json({ authorizationUrl: data.data.authorization_url, reference });
});

// GET /payments/verify/:reference
router.get("/payments/verify/:reference", requireAuth, async (req, res) => {
  const reference = String(req.params.reference);

  // Ensure this reference belongs to the current user
  const [payment] = await db
    .select()
    .from(paymentsTable)
    .where(and(eq(paymentsTable.reference, reference), eq(paymentsTable.userId, req.session.userId!)))
    .limit(1);

  if (!payment) return res.status(404).json({ error: "Payment record not found" });

  const activated = await activatePaymentRecord(reference);

  // Re-fetch to get updated plan info
  const [updated] = await db
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.reference, reference))
    .limit(1);

  return res.json({
    success: activated,
    plan: updated?.plan ?? payment.plan,
    subscriptionEnd: updated?.endDate?.toISOString() ?? null,
  });
});

// ── Shared helper ─────────────────────────────────────────────────────────────
// Returns true if the payment is confirmed as successful (either was already
// marked so, or we just verified it with Paystack and activated it now).
async function activatePaymentRecord(reference: string): Promise<boolean> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) return false;

  // Fetch the pending record only — if it is already 'success' we check the
  // user table directly to handle any prior partial-write.
  const [payment] = await db
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.reference, reference))
    .limit(1);

  if (!payment) return false;

  // If already marked success, confirm user subscription is also set.
  if (payment.status === "success" && payment.endDate) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payment.userId)).limit(1);
    const repairNeeded = !user || user.subscriptionPlan === "none" || !user.subscriptionEnd;
    if (!repairNeeded) return true;
    // Repair partial write: payment succeeded but user row wasn't updated
    await db
      .update(usersTable)
      .set({
        subscriptionPlan: payment.plan,
        subscriptionEnd: payment.endDate,
        ...(payment.plan === "semester" && payment.semesterStart ? { semesterStart: payment.semesterStart } : {}),
      })
      .where(eq(usersTable.id, payment.userId));
    return true;
  }

  // Verify with Paystack
  const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  const data = (await verifyRes.json()) as { status: boolean; data?: { status: string } };

  if (!data.status || data.data?.status !== "success") return false;

  const planKey = payment.plan as PlanKey;
  const planConfig = PLANS[planKey] ?? PLANS.monthly;

  let startDate = new Date();
  if (payment.plan === "semester" && payment.semesterStart) {
    startDate = new Date(payment.semesterStart);
  }
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + planConfig.months);

  // Atomic update: payment + user in a single transaction.
  // Conditional transition (status='pending') prevents double-activation races.
  await db.transaction(async (tx) => {
    const updated = await tx
      .update(paymentsTable)
      .set({ status: "success", startDate, endDate })
      .where(and(eq(paymentsTable.reference, reference), eq(paymentsTable.status, "pending")))
      .returning({ id: paymentsTable.id });

    // Only update user if we actually transitioned from pending → success
    if (updated.length > 0) {
      await tx
        .update(usersTable)
        .set({
          subscriptionPlan: payment.plan,
          subscriptionEnd: endDate,
          ...(payment.plan === "semester" ? { semesterStart: startDate } : {}),
        })
        .where(eq(usersTable.id, payment.userId));
    }
  });

  return true;
}

// POST /payments/webhook  – Paystack sends charge.success events here
router.post("/payments/webhook", async (req, res) => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) return res.status(400).end();

  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  if (!rawBody) return res.status(400).end();

  const signature = req.headers["x-paystack-signature"] as string | undefined;
  if (!signature) return res.status(401).end();

  // Compute HMAC and compare with timing-safe equality to prevent timing attacks
  const hashBuf = Buffer.from(
    crypto.createHmac("sha512", secretKey).update(rawBody).digest("hex"),
    "hex",
  );
  const sigBuf = Buffer.from(signature, "hex");

  if (hashBuf.length !== sigBuf.length || !crypto.timingSafeEqual(hashBuf, sigBuf)) {
    return res.status(401).end();
  }

  const event = JSON.parse(rawBody.toString()) as { event: string; data?: { reference?: string } };

  if (event.event === "charge.success" && event.data?.reference) {
    await activatePaymentRecord(event.data.reference).catch(() => null);
  }

  return res.status(200).end();
});

// GET /payments/check-pending  – lets a logged-in user re-verify their latest pending payment
// Useful when the browser redirect from Paystack failed (e.g. session expired mid-flow)
router.get("/payments/check-pending", requireAuth, async (req, res) => {
  const [pending] = await db
    .select()
    .from(paymentsTable)
    .where(and(eq(paymentsTable.userId, req.session.userId!), eq(paymentsTable.status, "pending")))
    .orderBy(desc(paymentsTable.createdAt))
    .limit(1);

  if (!pending) return res.json({ found: false });

  const activated = await activatePaymentRecord(pending.reference);
  return res.json({ found: true, activated, reference: pending.reference });
});

// GET /payments/status
router.get("/payments/status", requireAuth, async (req, res) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId!))
    .limit(1);

  if (!user) return res.status(401).json({ error: "Not authenticated" });

  const now = new Date();
  const isActive =
    user.subscriptionPlan !== "none" &&
    user.subscriptionEnd !== null &&
    user.subscriptionEnd > now;

  let daysRemaining: number | null = null;
  if (isActive && user.subscriptionEnd) {
    daysRemaining = Math.ceil(
      (user.subscriptionEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  return res.json({
    plan: user.subscriptionPlan,
    isActive,
    subscriptionEnd: user.subscriptionEnd?.toISOString() ?? null,
    daysRemaining,
  });
});

export default router;
