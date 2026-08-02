import { Router } from "express";
import { db, usersTable, paymentsTable, referralEarningsTable, activityLogsTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
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

// Updated prices: monthly GHS 15, semester GHS 30, yearly GHS 60
const PLANS = {
  monthly:  { amount: 1500,  label: "Monthly (GHS 15)",  months: 1  },
  semester: { amount: 3000,  label: "Semester (GHS 30)", months: 4  },
  yearly:   { amount: 6000,  label: "Yearly (GHS 60)",   months: 12 },
} as const;

type PlanKey = keyof typeof PLANS;

// Referral cashback: 20% of payment amount
const REFERRAL_PERCENT = 0.20;

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
                <strong style="color:#ff6b00;">Action required:</strong> Log into the Admin page, find this pending payment, and enter the transaction ID you received on your MoMo to verify it.
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

  // ── Expiry lapsed email ───────────────────────────────────────────────────
  // When a subscription has just ended, send one "access expired" email.
  // Only fires when the plan was not "none" and the end date is in the past.
  if (!isActive && user.subscriptionPlan !== "none" && user.subscriptionEnd && user.subscriptionEnd <= now) {
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentLapsed = await db
      .select({ id: activityLogsTable.id })
      .from(activityLogsTable)
      .where(
        and(
          eq(activityLogsTable.userId, user.id),
          eq(activityLogsTable.type, "expiry_lapsed"),
          gt(activityLogsTable.createdAt, oneDayAgo),
        ),
      )
      .limit(1);

    if (recentLapsed.length === 0) {
      sendEmail({
        to: user.email,
        subject: `🔒 Your Quiz Bunker subscription has ended`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0f0f1a;color:#fff;border-radius:12px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#550000,#3a0000);padding:24px 32px;">
              <h1 style="margin:0;font-size:24px;letter-spacing:1px;">🎮 QUIZ BUNKER</h1>
            </div>
            <div style="padding:32px;">
              <h2 style="margin:0 0 12px;color:#ff6b6b;">Your Subscription Has Ended</h2>
              <p style="color:#ccc;line-height:1.6;">Hi ${user.name},</p>
              <p style="color:#ccc;line-height:1.6;">
                Your <strong style="color:#ffaa00;text-transform:uppercase;">${user.subscriptionPlan}</strong>
                subscription has expired. Your quiz access has been paused.
              </p>
              <p style="color:#ccc;line-height:1.6;">
                Renew to instantly restore access to all questions, subjects, and offline content.
              </p>
              <a href="https://quizbunker.com/subscribe"
                 style="display:inline-block;margin:20px 0;padding:14px 32px;background:#ff6b00;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">
                RENEW NOW
              </a>
              <p style="color:#555;font-size:12px;margin-top:16px;">
                Questions you studied are still on your account — renewal picks up right where you left off.
              </p>
            </div>
          </div>
        `,
      }).catch(() => {});

      logActivity({
        type: "expiry_lapsed",
        req,
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        metadata: { plan: user.subscriptionPlan, subscriptionEnd: user.subscriptionEnd.toISOString() },
      }).catch(() => {});
    }
  }

  // ── Expiry warning emails ─────────────────────────────────────────────────
  // Send one warning at 7 days and another at 1 day before expiry.
  // Use activity_logs to ensure we send each warning at most once per day.
  if (isActive && daysRemaining !== null && daysRemaining <= 7 && user.subscriptionEnd) {
    const warningThreshold = daysRemaining <= 1 ? "1d" : "7d";
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Check if we already sent this threshold warning recently
    const recentNotice = await db
      .select({ id: activityLogsTable.id })
      .from(activityLogsTable)
      .where(
        and(
          eq(activityLogsTable.userId, user.id),
          eq(activityLogsTable.type, "expiry_notice"),
          gt(activityLogsTable.createdAt, oneDayAgo),
        ),
      )
      .limit(1);

    if (recentNotice.length === 0) {
      const endFormatted = user.subscriptionEnd.toLocaleDateString("en-GH", {
        day: "numeric", month: "long", year: "numeric",
      });
      const urgency = daysRemaining <= 1 ? "expires TODAY" : `expires in ${daysRemaining} days`;
      const cta = daysRemaining <= 1
        ? "Renew now to keep uninterrupted access."
        : "Renew early to avoid losing access.";

      sendEmail({
        to: user.email,
        subject: `⚠️ Your Quiz Bunker subscription ${urgency}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0f0f1a;color:#fff;border-radius:12px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#cc6600,#994400);padding:24px 32px;">
              <h1 style="margin:0;font-size:24px;letter-spacing:1px;">🎮 QUIZ BUNKER</h1>
            </div>
            <div style="padding:32px;">
              <h2 style="margin:0 0 12px;color:#ffaa00;">Subscription Expiring Soon ⚠️</h2>
              <p style="color:#ccc;line-height:1.6;">Hi ${user.name},</p>
              <p style="color:#ccc;line-height:1.6;">
                Your <strong style="color:#ffaa00;text-transform:uppercase;">${user.subscriptionPlan}</strong>
                subscription <strong style="color:#ff6b6b;">${urgency}</strong> on
                <strong style="color:#fff;">${endFormatted}</strong>.
              </p>
              <p style="color:#ccc;line-height:1.6;">${cta}</p>
              <a href="https://quizbunker.com/subscribe"
                 style="display:inline-block;margin:20px 0;padding:14px 32px;background:#ff6b00;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">
                RENEW SUBSCRIPTION
              </a>
              <p style="color:#555;font-size:12px;margin-top:16px;">
                After renewal, your access continues uninterrupted from the expiry date.
              </p>
            </div>
          </div>
        `,
      }).catch(() => {});

      // Log so we don't send duplicate warnings within 24 hours
      logActivity({
        type: "expiry_notice",
        req,
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        metadata: { threshold: warningThreshold, daysRemaining, subscriptionEnd: user.subscriptionEnd.toISOString() },
      }).catch(() => {});
    }
  }

  return res.json({
    plan: user.subscriptionPlan,
    isActive,
    subscriptionEnd: user.subscriptionEnd?.toISOString() ?? null,
    daysRemaining,
  });
});

// POST /payments/momo-details — save user's MoMo name and number for cashback
router.post("/payments/momo-details", requireAuth, async (req, res) => {
  const { momoNumber, momoName } = req.body as { momoNumber?: string; momoName?: string };

  const numberClean = (momoNumber ?? "").trim();
  const nameClean = (momoName ?? "").trim();

  if (!numberClean || numberClean.length < 10) {
    return res.status(400).json({ error: "A valid MoMo number (at least 10 digits) is required" });
  }
  if (!nameClean) {
    return res.status(400).json({ error: "MoMo name is required" });
  }

  await db
    .update(usersTable)
    .set({ momoNumber: numberClean, momoName: nameClean })
    .where(eq(usersTable.id, req.session.userId!));

  return res.json({ message: "MoMo details saved successfully." });
});

// GET /payments/referral — current user's referral code and earnings
router.get("/payments/referral", requireAuth, async (req, res) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId!))
    .limit(1);

  if (!user) return res.status(401).json({ error: "Not authenticated" });

  // Get all earnings for this user
  const earnings = await db
    .select({
      id: referralEarningsTable.id,
      refereeId: referralEarningsTable.refereeId,
      amount: referralEarningsTable.amount,
      status: referralEarningsTable.status,
      createdAt: referralEarningsTable.createdAt,
      plan: paymentsTable.plan,
      refereeName: usersTable.name,
    })
    .from(referralEarningsTable)
    .leftJoin(paymentsTable, eq(referralEarningsTable.paymentId, paymentsTable.id))
    .leftJoin(usersTable, eq(referralEarningsTable.refereeId, usersTable.id))
    .where(eq(referralEarningsTable.referrerId, user.id))
    .orderBy(referralEarningsTable.createdAt);

  const totalEarningsPesewas = earnings.reduce((s, e) => s + e.amount, 0);
  const pendingEarningsPesewas = earnings.filter(e => e.status === "pending").reduce((s, e) => s + e.amount, 0);

  return res.json({
    referralCode: user.referralCode ?? "",
    totalEarningsPesewas,
    pendingEarningsPesewas,
    momoName: user.momoName ?? null,
    momoNumber: user.momoNumber ?? null,
    earnings: earnings.map(e => ({
      id: e.id,
      refereeName: e.refereeName ?? "Unknown",
      plan: e.plan ?? "—",
      amount: e.amount,
      status: e.status,
      createdAt: e.createdAt.toISOString(),
    })),
  });
});

export { PLANS, REFERRAL_PERCENT };
export default router;
