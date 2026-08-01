import { Router } from "express";
import { db, usersTable, paymentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";
import { logActivity } from "../lib/activity";
import { sendEmail } from "../lib/email";

const router = Router();

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

const PLANS = {
  monthly:  { amount: 1000,  label: "Monthly (GHS 10)",  months: 1  },
  semester: { amount: 3000,  label: "Semester (GHS 30)", months: 4  },
  yearly:   { amount: 5000,  label: "Yearly (GHS 50)",   months: 12 },
} as const;

type PlanKey = keyof typeof PLANS;

// POST /payments/submit — user submits MoMo payment with their transaction ID
router.post("/payments/submit", requireAuth, async (req, res) => {
  const { plan, txId, semesterStart } = req.body as {
    plan: string;
    txId: string;
    semesterStart?: string | null;
  };

  if (!(plan in PLANS)) {
    return res.status(400).json({ error: "Invalid plan. Choose: monthly, semester, or yearly" });
  }

  const txIdClean = (txId ?? "").trim();
  if (!txIdClean) {
    return res.status(400).json({ error: "Transaction ID is required" });
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId!))
    .limit(1);

  if (!user) return res.status(401).json({ error: "Not authenticated" });

  const reference = `MOMO_${Date.now()}_${user.id}_${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const { amount } = PLANS[plan as PlanKey];

  await db.insert(paymentsTable).values({
    userId: user.id,
    plan,
    amount,
    reference,
    status: "pending",
    userTxId: txIdClean,
    semesterStart: semesterStart ? new Date(semesterStart) : null,
  });

  // Notify admin by email
  const adminEmail = (process.env.GMAIL_USER || process.env.ADMIN_EMAIL || "").trim();
  if (adminEmail) {
    const planInfo = PLANS[plan as PlanKey];
    sendEmail({
      to: adminEmail,
      subject: `💰 New MoMo Payment — ${user.name} (${planInfo.label})`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#0f0f1a;color:#fff;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#ff6b00,#e03000);padding:20px 28px;">
            <h1 style="margin:0;font-size:22px;letter-spacing:1px;">🎮 QUIZ BUNKER — New Payment</h1>
          </div>
          <div style="padding:28px;">
            <p style="color:#aaa;font-size:13px;margin-top:0;">A user has submitted a MoMo payment and is waiting for your verification.</p>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr><td style="color:#888;padding:6px 0;width:140px;">User Name</td><td style="color:#fff;font-weight:bold;">${user.name}</td></tr>
              <tr><td style="color:#888;padding:6px 0;">User Email</td><td style="color:#fff;">${user.email}</td></tr>
              <tr><td style="color:#888;padding:6px 0;">Plan</td><td style="color:#ffaa00;font-weight:bold;text-transform:uppercase;">${plan} — GHS ${(amount / 100).toFixed(2)}</td></tr>
              <tr><td style="color:#888;padding:6px 0;">Transaction ID</td><td style="color:#00ffcc;font-weight:bold;font-size:16px;letter-spacing:1px;">${txIdClean}</td></tr>
              <tr><td style="color:#888;padding:6px 0;">Reference</td><td style="color:#666;font-size:12px;">${reference}</td></tr>
            </table>
            <div style="margin:20px 0;padding:14px;background:#1a1a2e;border-left:4px solid #ff6b00;border-radius:4px;">
              <p style="margin:0;color:#ccc;font-size:13px;">
                <strong style="color:#ff6b00;">Action required:</strong> Log into the Admin page, find this pending payment, and enter the transaction ID you received on your MoMo to verify it. If it matches, the user will be automatically subscribed.
              </p>
            </div>
          </div>
        </div>
      `,
    }).catch(() => {});
  }

  logActivity({
    type: "payment_init",
    req,
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    metadata: { plan, reference, amount, txId: txIdClean },
  }).catch(() => {});

  return res.json({
    message: "Payment submitted successfully! We'll verify your transaction and activate your account shortly.",
    reference,
  });
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
