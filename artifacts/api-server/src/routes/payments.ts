import { Router } from "express";
import { db, usersTable, paymentsTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
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
  const callbackUrl = `${origin}/subscribe?reference=${reference}`;

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

  const [payment] = await db
    .select()
    .from(paymentsTable)
    .where(and(eq(paymentsTable.reference, reference), eq(paymentsTable.userId, req.session.userId!)))
    .limit(1);

  if (!payment) return res.status(404).json({ error: "Payment record not found" });

  if (payment.status === "success") {
    return res.json({ success: true, plan: payment.plan, subscriptionEnd: payment.endDate?.toISOString() ?? null });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return res.json({ success: false, plan: payment.plan, subscriptionEnd: null });
  }

  const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });

  const data = (await verifyRes.json()) as {
    status: boolean;
    data?: { status: string };
  };

  if (!data.status || data.data?.status !== "success") {
    return res.json({ success: false, plan: payment.plan, subscriptionEnd: null });
  }

  // Calculate subscription period
  const planKey = payment.plan as PlanKey;
  const planConfig = PLANS[planKey] ?? PLANS.monthly;

  let startDate = new Date();
  if (payment.plan === "semester" && payment.semesterStart) {
    startDate = new Date(payment.semesterStart);
  }

  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + planConfig.months);

  // Mark payment as successful
  await db
    .update(paymentsTable)
    .set({ status: "success", startDate, endDate })
    .where(eq(paymentsTable.reference, reference));

  // Update user's subscription
  await db
    .update(usersTable)
    .set({
      subscriptionPlan: payment.plan,
      subscriptionEnd: endDate,
      ...(payment.plan === "semester" ? { semesterStart: startDate } : {}),
    })
    .where(eq(usersTable.id, payment.userId));

  return res.json({ success: true, plan: payment.plan, subscriptionEnd: endDate.toISOString() });
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
