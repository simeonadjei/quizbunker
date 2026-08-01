import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { RegisterUserBody, LoginUserBody, ForgotPasswordBody, ResetPasswordBody } from "@workspace/api-zod";
import { logActivity } from "../lib/activity";
import { sendEmail } from "../lib/email";

const router = Router();

// ── Rate limiters ─────────────────────────────────────────────────────────────

/** Login: max 10 attempts per 15 minutes per IP */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again in 15 minutes." },
});

/** Forgot-password: max 5 requests per hour per IP — prevents email flooding */
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many password reset requests. Please try again in an hour." },
});

/** Reset-password: max 10 attempts per hour per IP — token is already time-limited, but prevent token guessing */
const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many reset attempts. Please try again in an hour." },
});

/** Register: max 10 accounts per hour per IP — prevents account flood and email spam */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many accounts created from this IP. Please try again in an hour." },
});

/** Verify-email: max 20 attempts per hour per IP — token is 32-byte random so guessing is impractical, light cap for basic abuse prevention */
const verifyEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many verification attempts. Please try again in an hour." },
});

/** Resend-verification: max 5 per hour per IP — prevents email flooding */
const resendVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many resend requests. Please try again in an hour." },
});

async function sendVerificationEmail(toEmail: string, name: string, token: string, origin: string) {
  const verifyUrl = `${origin}/verify-email?token=${token}`;
  const result = await sendEmail({
    to: toEmail,
    subject: "✅ Verify your Quiz Bunker account",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0f0f1a;color:#fff;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#ff6b00,#e03000);padding:24px 32px;">
          <h1 style="margin:0;font-size:24px;letter-spacing:1px;">🎮 QUIZ BUNKER</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="margin:0 0 12px;color:#ff6b00;">Hi ${name}!</h2>
          <p style="color:#ccc;line-height:1.6;">You're almost ready. Click the button below to verify your email and start playing.</p>
          <a href="${verifyUrl}" style="display:inline-block;margin:20px 0;padding:14px 32px;background:#ff6b00;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">
            VERIFY MY ACCOUNT
          </a>
          <p style="color:#666;font-size:13px;">Or copy this link: <a href="${verifyUrl}" style="color:#ff6b00;">${verifyUrl}</a></p>
          <p style="color:#555;font-size:12px;margin-top:24px;">If you didn't create an account, you can safely ignore this email.</p>
        </div>
      </div>
    `,
  });
  if (!result.ok) console.error(`[EMAIL ERROR] ${result.error}`);
  if (process.env.NODE_ENV !== "production" && !result.ok) {
    console.log(`[DEV EMAIL VERIFICATION] ${toEmail} → ${verifyUrl}`);
  }
}

async function sendPasswordResetEmail(toEmail: string, name: string, token: string, origin: string) {
  const resetUrl = `${origin}/reset-password?token=${token}`;
  const result = await sendEmail({
    to: toEmail,
    subject: "🔑 Reset your Quiz Bunker password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0f0f1a;color:#fff;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#ff6b00,#e03000);padding:24px 32px;">
          <h1 style="margin:0;font-size:24px;letter-spacing:1px;">🎮 QUIZ BUNKER</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="margin:0 0 12px;color:#ff6b00;">Hi ${name}!</h2>
          <p style="color:#ccc;line-height:1.6;">We received a request to reset your password. Click the button below to choose a new one. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display:inline-block;margin:20px 0;padding:14px 32px;background:#ff6b00;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">
            RESET MY PASSWORD
          </a>
          <p style="color:#666;font-size:13px;">Or copy this link: <a href="${resetUrl}" style="color:#ff6b00;">${resetUrl}</a></p>
          <p style="color:#555;font-size:12px;margin-top:24px;">If you didn't request this, you can safely ignore this email — your password will stay the same.</p>
        </div>
      </div>
    `,
  });
  if (!result.ok) console.error(`[EMAIL ERROR] ${result.error}`);
  if (process.env.NODE_ENV !== "production" && !result.ok) {
    console.log(`[DEV PASSWORD RESET] ${toEmail} → ${resetUrl}`);
  }
}

// ── Format user ───────────────────────────────────────────────────────────────

function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    subscriptionPlan: user.subscriptionPlan,
    subscriptionEnd: user.subscriptionEnd?.toISOString() ?? null,
    semesterStart: user.semesterStart?.toISOString() ?? null,
  };
}

// ── POST /auth/register ───────────────────────────────────────────────────────

router.post("/auth/register", registerLimiter, async (req, res) => {
  const parsed = RegisterUserBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input: email, password (min 6 chars), and name are required" });
  }

  const { email, password, name } = parsed.data;

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  if (existing.length > 0) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const verificationToken = crypto.randomBytes(32).toString("hex");

  const [user] = await db
    .insert(usersTable)
    .values({ email: email.toLowerCase(), name, passwordHash, verificationToken, emailVerified: false })
    .returning();

  // Detect origin for verification link — prefer FRONTEND_URL (set in production env)
  const origin =
    process.env.FRONTEND_URL ||
    (req.headers.origin as string) ||
    `https://${process.env.REPLIT_DEV_DOMAIN || "localhost"}`;

  // Send verification email (non-blocking — don't fail registration if email fails)
  sendVerificationEmail(email, name, verificationToken, origin).catch((err) => {
    const msg = err instanceof Error ? err.message : String(err); console.error(`[EMAIL ERROR] ${msg}`, err);
  });

  logActivity({ type: "register", req, userId: user.id, userEmail: user.email, userName: user.name }).catch(() => {});

  return res.status(201).json({
    user: formatUser(user),
    requiresVerification: true,
    message: "Account created. Please check your email to verify your account.",
  });
});

// ── POST /auth/verify-email ───────────────────────────────────────────────────

router.post("/auth/verify-email", verifyEmailLimiter, async (req, res) => {
  const { token } = req.body as { token?: string };

  if (!token) {
    return res.status(400).json({ error: "Verification token is required" });
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.verificationToken, token))
    .limit(1);

  if (!user) {
    return res.status(400).json({ error: "Invalid or expired verification link" });
  }

  if (user.emailVerified) {
    return res.json({ message: "Email already verified. You can log in now." });
  }

  await db
    .update(usersTable)
    .set({ emailVerified: true, verificationToken: null })
    .where(eq(usersTable.id, user.id));

  logActivity({ type: "email_verify", req, userId: user.id, userEmail: user.email, userName: user.name }).catch(() => {});

  return res.json({ message: "Email verified successfully! You can now log in." });
});

// ── POST /auth/resend-verification ───────────────────────────────────────────

router.post("/auth/resend-verification", resendVerificationLimiter, async (req, res) => {
  const { email } = req.body as { email?: string };

  // Generic response so we don't leak which emails are registered
  const genericMessage = { message: "If your account exists and isn't verified yet, a new verification link has been sent." };

  if (!email || typeof email !== "string") {
    return res.json(genericMessage);
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  if (!user || user.emailVerified) {
    return res.json(genericMessage);
  }

  // Issue a fresh token so old links can't be reused
  const verificationToken = crypto.randomBytes(32).toString("hex");
  await db
    .update(usersTable)
    .set({ verificationToken })
    .where(eq(usersTable.id, user.id));

  const origin =
    process.env.FRONTEND_URL ||
    (req.headers.origin as string) ||
    `https://${process.env.REPLIT_DEV_DOMAIN || "localhost"}`;

  sendVerificationEmail(user.email, user.name, verificationToken, origin).catch((err) => {
    const msg = err instanceof Error ? err.message : String(err); console.error(`[EMAIL ERROR] ${msg}`, err);
  });

  logActivity({ type: "resend_verification", req, userId: user.id, userEmail: user.email, userName: user.name }).catch(() => {});

  return res.json(genericMessage);
});

// ── POST /auth/login ──────────────────────────────────────────────────────────

router.post("/auth/login", loginLimiter, async (req, res) => {
  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const { email, password, rememberMe } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  if (!user.emailVerified) {
    return res.status(403).json({ error: "Please verify your email before logging in. Check your inbox for the verification link." });
  }

  // Regenerate session to prevent session fixation
  await new Promise<void>((resolve, reject) =>
    req.session.regenerate((err) => (err ? reject(err) : resolve())),
  );
  req.session.userId = user.id;

  // "Remember me" extends the session cookie to 30 days; otherwise it falls
  // back to the default session lifetime (7 days) set in app.ts.
  if (rememberMe) {
    req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
  }

  logActivity({ type: "login", req, userId: user.id, userEmail: user.email, userName: user.name }).catch(() => {});

  return res.json({ user: formatUser(user) });
});

// ── POST /auth/forgot-password ────────────────────────────────────────────────

router.post("/auth/forgot-password", forgotPasswordLimiter, async (req, res) => {
  const parsed = ForgotPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "A valid email is required" });
  }

  const { email } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  // Always return a generic success message so we don't leak which emails are registered
  const genericMessage = { message: "If an account exists for that email, a password reset link has been sent." };

  if (!user) {
    return res.json(genericMessage);
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db
    .update(usersTable)
    .set({ resetToken, resetTokenExpires })
    .where(eq(usersTable.id, user.id));

  const origin =
    process.env.FRONTEND_URL ||
    (req.headers.origin as string) ||
    `https://${process.env.REPLIT_DEV_DOMAIN || "localhost"}`;

  sendPasswordResetEmail(user.email, user.name, resetToken, origin).catch((err) => {
    const msg = err instanceof Error ? err.message : String(err); console.error(`[EMAIL ERROR] ${msg}`, err);
  });

  logActivity({ type: "password_reset_request", req, userId: user.id, userEmail: user.email, userName: user.name }).catch(() => {});

  return res.json(genericMessage);
});

// ── POST /auth/reset-password ─────────────────────────────────────────────────

router.post("/auth/reset-password", resetPasswordLimiter, async (req, res) => {
  const parsed = ResetPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "A valid token and password (min 6 chars) are required" });
  }

  const { token, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.resetToken, token))
    .limit(1);

  if (!user || !user.resetTokenExpires || user.resetTokenExpires.getTime() < Date.now()) {
    return res.status(400).json({ error: "Invalid or expired reset link. Please request a new one." });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await db
    .update(usersTable)
    .set({ passwordHash, resetToken: null, resetTokenExpires: null })
    .where(eq(usersTable.id, user.id));

  logActivity({ type: "password_reset", req, userId: user.id, userEmail: user.email, userName: user.name }).catch(() => {});

  return res.json({ message: "Password reset successfully! You can now log in with your new password." });
});

// ── POST /auth/logout ─────────────────────────────────────────────────────────

router.post("/auth/logout", (req, res) => {
  const userId = req.session.userId;
  logActivity({ type: "logout", req, userId: userId ?? null }).catch(() => {});
  req.session.destroy(() => {});
  return res.json({ message: "Logged out" });
});

// ── GET /auth/me ──────────────────────────────────────────────────────────────

router.get("/auth/me", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId))
    .limit(1);

  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  return res.json(formatUser(user));
});

export default router;
