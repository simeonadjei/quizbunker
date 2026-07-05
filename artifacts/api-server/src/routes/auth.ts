import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { RegisterUserBody, LoginUserBody, ForgotPasswordBody, ResetPasswordBody } from "@workspace/api-zod";

const router = Router();

// ── Email sender ──────────────────────────────────────────────────────────────

function createTransporter() {
  const user = process.env.GMAIL_USER || process.env.ADMIN_EMAIL;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

async function sendVerificationEmail(toEmail: string, name: string, token: string, origin: string) {
  const verifyUrl = `${origin}/verify-email?token=${token}`;
  const transporter = createTransporter();

  if (!transporter) {
    // Email not configured yet — log the link in dev so it can be tested manually
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV EMAIL VERIFICATION] ${toEmail} → ${verifyUrl}`);
    }
    return;
  }

  const senderEmail = process.env.GMAIL_USER || process.env.ADMIN_EMAIL;

  await transporter.sendMail({
    from: `"Quiz Bunker" <${senderEmail}>`,
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
}

async function sendPasswordResetEmail(toEmail: string, name: string, token: string, origin: string) {
  const resetUrl = `${origin}/reset-password?token=${token}`;
  const transporter = createTransporter();

  if (!transporter) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV PASSWORD RESET] ${toEmail} → ${resetUrl}`);
    }
    return;
  }

  const senderEmail = process.env.GMAIL_USER || process.env.ADMIN_EMAIL;

  await transporter.sendMail({
    from: `"Quiz Bunker" <${senderEmail}>`,
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

router.post("/auth/register", async (req, res) => {
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

  // Detect origin for verification link
  const origin =
    (req.headers.origin as string) ||
    `https://${process.env.REPLIT_DEV_DOMAIN || "localhost"}`;

  // Send verification email (non-blocking — don't fail registration if email fails)
  sendVerificationEmail(email, name, verificationToken, origin).catch((err) => {
    console.error("[EMAIL ERROR]", err);
  });

  return res.status(201).json({
    user: formatUser(user),
    requiresVerification: true,
    message: "Account created. Please check your email to verify your account.",
  });
});

// ── POST /auth/verify-email ───────────────────────────────────────────────────

router.post("/auth/verify-email", async (req, res) => {
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

  return res.json({ message: "Email verified successfully! You can now log in." });
});

// ── POST /auth/login ──────────────────────────────────────────────────────────

router.post("/auth/login", async (req, res) => {
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

  return res.json({ user: formatUser(user) });
});

// ── POST /auth/forgot-password ────────────────────────────────────────────────

router.post("/auth/forgot-password", async (req, res) => {
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
    (req.headers.origin as string) ||
    `https://${process.env.REPLIT_DEV_DOMAIN || "localhost"}`;

  sendPasswordResetEmail(user.email, user.name, resetToken, origin).catch((err) => {
    console.error("[EMAIL ERROR]", err);
  });

  return res.json(genericMessage);
});

// ── POST /auth/reset-password ─────────────────────────────────────────────────

router.post("/auth/reset-password", async (req, res) => {
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

  return res.json({ message: "Password reset successfully! You can now log in with your new password." });
});

// ── POST /auth/logout ─────────────────────────────────────────────────────────

router.post("/auth/logout", (req, res) => {
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
