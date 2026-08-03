import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db, questionsTable, songsTable, usersTable, quizSessionsTable, paymentsTable, activityLogsTable, referralEarningsTable } from "@workspace/db";
import { eq, desc, count, gt, and } from "drizzle-orm";
import { parseQuestionText } from "../lib/parser";
import mammoth from "mammoth";
import type { Request, Response, NextFunction } from "express";
import { sendEmail, isEmailConfigured } from "../lib/email";
import { logger } from "../lib/logger";

const router = Router();

// Set up upload directories relative to process.cwd() (artifacts/api-server in dev)
const uploadsBase = path.join(process.cwd(), "uploads");
const songsDir = path.join(uploadsBase, "songs");
const questionsDir = path.join(uploadsBase, "questions");

for (const dir of [uploadsBase, songsDir, questionsDir]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Multer for question files (.docx / .txt)
const questionUpload = multer({
  dest: questionsDir,
  fileFilter: (_req, file, cb) => {
    const allowed = [".docx", ".doc", ".txt"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Only .docx and .txt files are supported"));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Multer for songs — memory storage so we never touch disk (faster, no ephemeral-disk issues)
const songUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const allowed = [".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Only audio files are supported (.mp3, .wav, .ogg, .m4a, .aac)"));
  },
  limits: { fileSize: 50 * 1024 * 1024 },
});

// Admin auth middleware
function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.isAdmin) {
    res.status(401).json({ error: "Admin access required" });
    return;
  }
  next();
}

const PLAN_MONTHS: Record<string, number> = {
  trial:    0,   // handled specially
  monthly:  1,
  semester: 4,
  yearly:   12,
  lifetime: 0,  // handled specially — sets end to 2099
};

// Updated amounts: monthly GHS 15, semester GHS 30, yearly GHS 60
const PLAN_AMOUNTS: Record<string, number> = {
  trial:    0,
  monthly:  1500,
  semester: 3000,
  yearly:   6000,
  lifetime: 0,
};

// POST /admin/auth
router.post("/admin/auth", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminSecretPath = process.env.ADMIN_SECRET_PATH;
  const adminEmail = process.env.ADMIN_EMAIL;

  // Accept ADMIN_PASSWORD or ADMIN_SECRET_PATH as the password.
  // This allows Render deployments to work with only ADMIN_SECRET_PATH set.
  // Trim all values to avoid whitespace issues from env var copy-paste.
  const passwordOk =
    (adminPassword && password?.trim() === adminPassword.trim()) ||
    (adminSecretPath && password?.trim() === adminSecretPath.trim());
  const emailOk = !adminEmail || (email && email.trim().toLowerCase() === adminEmail.trim().toLowerCase());

  if (!passwordOk || !emailOk) {
    // Log which check failed (no secret values exposed)
    logger.warn({
      passwordOk,
      emailOk,
      hasAdminPassword: !!adminPassword,
      hasAdminSecretPath: !!adminSecretPath,
      hasAdminEmail: !!adminEmail,
      submittedEmailLen: email?.length ?? 0,
      submittedPasswordLen: password?.length ?? 0,
    }, "Admin login failed");
    return res.status(401).json({ error: "Invalid credentials" });
  }

  await new Promise<void>((resolve, reject) =>
    req.session.regenerate((err) => (err ? reject(err) : resolve())),
  );
  req.session.isAdmin = true;

  const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0].trim() || req.socket?.remoteAddress || null;
  db.insert(activityLogsTable).values({ type: "admin_login", userEmail: email ?? null, ip }).catch(() => {});

  return res.json({ message: "Authenticated" });
});

// POST /admin/test-email
router.post("/admin/test-email", requireAdmin, async (req, res) => {
  if (!isEmailConfigured()) {
    return res.status(400).json({
      ok: false,
      error: "Email not configured — BREVO_API_KEY must be set as an environment variable.",
    });
  }

  const adminEmail = (process.env.GMAIL_USER || process.env.ADMIN_EMAIL || "").trim();
  const to = (req.body as { to?: string }).to?.trim() || adminEmail;

  if (!to) {
    return res.status(400).json({ ok: false, error: "No recipient — set GMAIL_USER or pass a 'to' address." });
  }

  const result = await sendEmail({
    to,
    subject: "✅ Quiz Bunker — email test",
    html: "<p>This is a test email from your Quiz Bunker admin panel. If you received this, email sending is working correctly.</p>",
  });

  if (!result.ok) {
    return res.status(500).json({ ok: false, error: result.error });
  }
  return res.json({ ok: true, message: `Test email sent to ${to}` });
});

// POST /admin/payments/:id/verify — admin enters the txId they received, compare with user's
router.post("/admin/payments/:id/verify", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  const { txId } = req.body as { txId?: string };

  if (!txId?.trim()) {
    return res.status(400).json({ error: "txId is required" });
  }

  const adminTxId = txId.trim().toUpperCase();

  const [payment] = await db
    .select({
      id: paymentsTable.id,
      userId: paymentsTable.userId,
      plan: paymentsTable.plan,
      amount: paymentsTable.amount,
      status: paymentsTable.status,
      userTxId: paymentsTable.userTxId,
      semesterStart: paymentsTable.semesterStart,
      userEmail: usersTable.email,
      userName: usersTable.name,
      referredBy: usersTable.referredBy,
    })
    .from(paymentsTable)
    .leftJoin(usersTable, eq(paymentsTable.userId, usersTable.id))
    .where(eq(paymentsTable.id, id))
    .limit(1);

  if (!payment) return res.status(404).json({ error: "Payment record not found" });

  if (payment.status === "success") {
    return res.json({ match: true, message: "This payment was already verified and the user is subscribed." });
  }

  const userTxId = (payment.userTxId ?? "").trim().toUpperCase();
  const match = adminTxId === userTxId;

  if (match) {
    // Subscribe the user
    const plan = payment.plan;
    const months = PLAN_MONTHS[plan] ?? 1;
    let startDate = new Date();
    if (plan === "semester" && payment.semesterStart) {
      startDate = new Date(payment.semesterStart);
    }
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);

    await db.transaction(async (tx) => {
      await tx
        .update(paymentsTable)
        .set({ status: "success", startDate, endDate })
        .where(eq(paymentsTable.id, id));
      await tx
        .update(usersTable)
        .set({ subscriptionPlan: plan, subscriptionEnd: endDate })
        .where(eq(usersTable.id, payment.userId));
    });

    // Create referral earnings if this user was referred
    if (payment.referredBy) {
      const earningAmount = Math.floor(payment.amount * 0.20); // 20% cashback
      if (earningAmount > 0) {
        await db.insert(referralEarningsTable).values({
          referrerId: payment.referredBy,
          refereeId: payment.userId,
          paymentId: payment.id,
          amount: earningAmount,
          status: "pending",
        }).catch(() => {}); // ignore duplicate errors
      }
    }

    // Email the user — subscription confirmed
    if (payment.userEmail) {
      sendEmail({
        to: payment.userEmail,
        subject: "🎉 Your Quiz Bunker subscription is now active!",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0f0f1a;color:#fff;border-radius:12px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#ff6b00,#e03000);padding:24px 32px;">
              <h1 style="margin:0;font-size:24px;letter-spacing:1px;">🎮 QUIZ BUNKER</h1>
            </div>
            <div style="padding:32px;">
              <h2 style="margin:0 0 12px;color:#ffaa00;">Payment Verified! 🎉</h2>
              <p style="color:#ccc;line-height:1.6;">Hi ${payment.userName ?? "there"},</p>
              <p style="color:#ccc;line-height:1.6;">Your MoMo payment has been verified and your <strong style="color:#ffaa00;text-transform:uppercase;">${plan}</strong> subscription is now active!</p>
              <p style="color:#ccc;line-height:1.6;">Your access runs until <strong style="color:#fff;">${endDate.toLocaleDateString("en-GH", { day: "numeric", month: "long", year: "numeric" })}</strong>.</p>
              <a href="https://quizbunker.com/dashboard" style="display:inline-block;margin:20px 0;padding:14px 32px;background:#ff6b00;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">
                ENTER THE BUNKER
              </a>
            </div>
          </div>
        `,
      }).catch(() => {});
    }

    return res.json({ match: true, message: `Payment verified. ${payment.userName ?? payment.userEmail} subscribed to ${plan} until ${endDate.toLocaleDateString()}.` });
  } else {
    // Mark as mismatch in payment record, email the user to resubmit
    await db
      .update(paymentsTable)
      .set({ status: "mismatch" })
      .where(eq(paymentsTable.id, id));

    if (payment.userEmail) {
      sendEmail({
        to: payment.userEmail,
        subject: "⚠️ Quiz Bunker — Transaction ID mismatch",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0f0f1a;color:#fff;border-radius:12px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#cc0000,#880000);padding:24px 32px;">
              <h1 style="margin:0;font-size:24px;letter-spacing:1px;">🎮 QUIZ BUNKER</h1>
            </div>
            <div style="padding:32px;">
              <h2 style="margin:0 0 12px;color:#ff4444;">Transaction ID Mismatch</h2>
              <p style="color:#ccc;line-height:1.6;">Hi ${payment.userName ?? "there"},</p>
              <p style="color:#ccc;line-height:1.6;">We received your payment submission, but the transaction ID you provided (<strong style="color:#ff4444;">${payment.userTxId ?? "—"}</strong>) does not match the one we found on our MoMo account.</p>
              <p style="color:#ccc;line-height:1.6;">Please check your MoMo transaction history for the correct ID and resubmit your payment on Quiz Bunker.</p>
              <a href="https://quizbunker.com/subscribe" style="display:inline-block;margin:20px 0;padding:14px 32px;background:#ff6b00;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">
                RESUBMIT PAYMENT
              </a>
              <p style="color:#555;font-size:12px;margin-top:24px;">If you believe this is an error, contact support via WhatsApp.</p>
            </div>
          </div>
        `,
      }).catch(() => {});
    }

    return res.json({ match: false, message: `Transaction ID mismatch. User has been emailed to resubmit the correct ID.` });
  }
});

// POST /admin/subscribe — manually subscribe any user by email, optionally generate new password
router.post("/admin/subscribe", requireAdmin, async (req, res) => {
  const { email, plan, months: customMonths, generatePassword } = req.body as {
    email?: string;
    plan?: string;
    months?: number;
    generatePassword?: boolean;
  };

  if (!email?.trim() || !plan?.trim()) {
    return res.status(400).json({ error: "email and plan are required" });
  }

  const emailLower = email.trim().toLowerCase();
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, emailLower))
    .limit(1);

  if (!user) return res.status(404).json({ error: `No user found with email: ${emailLower}` });

  const months = customMonths && customMonths > 0
    ? customMonths
    : (PLAN_MONTHS[plan] ?? 1);

  const now = new Date();
  let endDate: Date;
  if (plan === "lifetime") {
    endDate = new Date("2099-12-31T23:59:59Z");
  } else if (plan === "trial") {
    endDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  } else {
    endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + months);
  }

  const updates: Record<string, unknown> = {
    subscriptionPlan: plan,
    subscriptionEnd: endDate,
  };

  let newPassword: string | null = null;

  if (generatePassword) {
    const words = ["Quiz", "Bunker", "Ghana", "Learn", "Smart", "Ace", "Study", "Pass"];
    const word = words[Math.floor(Math.random() * words.length)];
    const digits = Math.floor(1000 + Math.random() * 9000).toString();
    newPassword = `${word}${digits}`;
    const passwordHash = await bcrypt.hash(newPassword, 10);
    updates.passwordHash = passwordHash;
    updates.emailVerified = true;
    updates.verificationToken = null;
  }

  await db.update(usersTable).set(updates).where(eq(usersTable.id, user.id));

  // Create a payment record for tracking
  const reference = `ADMIN_${Date.now()}_${user.id}`;
  await db.insert(paymentsTable).values({
    userId: user.id,
    plan,
    amount: PLAN_AMOUNTS[plan] ?? 0,
    reference,
    status: "success",
    startDate: now,
    endDate,
  });

  // Email the user about their subscription
  if (newPassword) {
    sendEmail({
      to: user.email,
      subject: "🎮 Your Quiz Bunker account is ready!",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0f0f1a;color:#fff;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#ff6b00,#e03000);padding:24px 32px;">
            <h1 style="margin:0;font-size:24px;letter-spacing:1px;">🎮 QUIZ BUNKER</h1>
          </div>
          <div style="padding:32px;">
            <h2 style="margin:0 0 12px;color:#ffaa00;">Your Account is Active!</h2>
            <p style="color:#ccc;line-height:1.6;">Hi ${user.name},</p>
            <p style="color:#ccc;line-height:1.6;">Your Quiz Bunker account has been set up with a <strong style="color:#ffaa00;text-transform:uppercase;">${plan}</strong> subscription.</p>
            <div style="background:#1a1a2e;border:1px solid #333;border-radius:8px;padding:16px;margin:20px 0;">
              <p style="margin:0 0 8px;color:#888;font-size:13px;">LOGIN DETAILS</p>
              <p style="margin:0 0 6px;color:#ccc;"><strong style="color:#fff;">Email:</strong> ${user.email}</p>
              <p style="margin:0;color:#ccc;"><strong style="color:#fff;">Password:</strong> <span style="color:#00ffcc;font-weight:bold;font-size:16px;">${newPassword}</span></p>
            </div>
            <p style="color:#aaa;font-size:13px;">Change your password after logging in.</p>
            <a href="https://quizbunker.com/login" style="display:inline-block;margin:20px 0;padding:14px 32px;background:#ff6b00;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">
              LOG IN NOW
            </a>
          </div>
        </div>
      `,
    }).catch(() => {});
  } else {
    sendEmail({
      to: user.email,
      subject: "🎉 Your Quiz Bunker subscription is active!",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0f0f1a;color:#fff;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#ff6b00,#e03000);padding:24px 32px;">
            <h1 style="margin:0;font-size:24px;letter-spacing:1px;">🎮 QUIZ BUNKER</h1>
          </div>
          <div style="padding:32px;">
            <h2 style="margin:0 0 12px;color:#ffaa00;">Subscription Activated!</h2>
            <p style="color:#ccc;line-height:1.6;">Hi ${user.name},</p>
            <p style="color:#ccc;line-height:1.6;">Your <strong style="color:#ffaa00;text-transform:uppercase;">${plan}</strong> subscription has been activated. Access runs until <strong style="color:#fff;">${endDate.toLocaleDateString("en-GH", { day: "numeric", month: "long", year: "numeric" })}</strong>.</p>
            <a href="https://quizbunker.com/dashboard" style="display:inline-block;margin:20px 0;padding:14px 32px;background:#ff6b00;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">
              ENTER THE BUNKER
            </a>
          </div>
        </div>
      `,
    }).catch(() => {});
  }

  return res.json({
    message: `${user.name} (${user.email}) subscribed to ${plan} until ${endDate.toLocaleDateString()}.`,
    generatedPassword: newPassword,
  });
});

// POST /admin/questions/upload
router.post(
  "/admin/questions/upload",
  requireAdmin,
  questionUpload.single("file"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded. Send a .docx or .txt file in the 'file' field." });
    }

    const { year: overrideYear, subject: overrideSubject } = req.body as {
      year?: string;
      subject?: string;
    };

    let rawText = "";
    const ext = path.extname(req.file.originalname).toLowerCase();

    try {
      if (ext === ".docx" || ext === ".doc") {
        const result = await mammoth.extractRawText({ path: req.file.path });
        rawText = result.value;
      } else {
        rawText = fs.readFileSync(req.file.path, "utf-8");
      }
    } finally {
      fs.unlink(req.file.path, () => {});
    }

    const { questions, errors } = parseQuestionText(rawText, overrideYear, overrideSubject);

    if (questions.length === 0) {
      return res.status(400).json({
        error: "No valid questions found in file. Check the format matches: Year N Subject / WEEK N: TOPIC / 1. Question / A. Option / Answer: X",
        errors,
        inserted: 0,
        skipped: 0,
        preview: [],
      });
    }

    let inserted = 0;
    let skipped = 0;

    for (const q of questions) {
      try {
        await db.insert(questionsTable).values(q);
        inserted++;
      } catch (e: unknown) {
        if ((e as { code?: string }).code === "23505") {
          skipped++;
        } else {
          errors.push(`Q${q.questionNumber}: ${(e as Error).message}`);
        }
      }
    }

    const preview = questions.slice(0, 3).map((q, i) => ({ ...q, id: i + 1, dok: null, learningIndicator: null, feedback: null }));

    return res.json({ inserted, skipped, errors, preview });
  },
);

// DELETE /admin/questions/:id
router.delete("/admin/questions/:id", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  await db.delete(questionsTable).where(eq(questionsTable.id, id));
  return res.json({ message: "Question deleted" });
});

// PUT /admin/songs/reorder — must come BEFORE /admin/songs/:id
router.put("/admin/songs/reorder", requireAdmin, async (req, res) => {
  const { songIds } = req.body as { songIds?: number[] };
  if (!Array.isArray(songIds)) {
    return res.status(400).json({ error: "songIds must be an array of integers" });
  }

  for (let i = 0; i < songIds.length; i++) {
    await db.update(songsTable).set({ sortOrder: i }).where(eq(songsTable.id, songIds[i]));
  }

  return res.json({ message: "Songs reordered" });
});

// MIME type map for audio uploads
const AUDIO_MIME: Record<string, string> = {
  ".mp3":  "audio/mpeg",
  ".wav":  "audio/wav",
  ".ogg":  "audio/ogg",
  ".m4a":  "audio/mp4",
  ".aac":  "audio/aac",
  ".flac": "audio/flac",
};

// POST /admin/songs — accepts one file at a time
// Wrap multer in a manual callback so file-type / size errors return JSON, not HTML
router.post("/admin/songs", requireAdmin, (req, res, next) => {
  songUpload.single("file")(req, res, (err) => {
    if (err) {
      const msg =
        err instanceof multer.MulterError
          ? err.code === "LIMIT_FILE_SIZE"
            ? "File too large — maximum size is 50 MB"
            : `Upload error: ${err.message}`
          : (err as Error).message ?? "File upload failed";
      return res.status(400).json({ error: msg });
    }
    next();
  });
}, async (req, res) => {
  const file = req.file as Express.Multer.File | undefined;
  if (!file) {
    return res.status(400).json({ error: "No audio file uploaded. Send a single file in the 'file' field." });
  }

  if (!file.buffer || file.buffer.length === 0) {
    return res.status(400).json({ error: "Uploaded file is empty" });
  }

  try {
    const [last] = await db
      .select({ sortOrder: songsTable.sortOrder })
      .from(songsTable)
      .orderBy(desc(songsTable.sortOrder))
      .limit(1);

    const nextSortOrder = last ? last.sortOrder + 1 : 0;

    const rawTitle = String(req.body.title ?? "").trim();
    const title = rawTitle || file.originalname.replace(/\.[^.]+$/, "").trim();
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeType = AUDIO_MIME[ext] ?? "audio/mpeg";

    const fileData = file.buffer.toString("base64");
    const fileSizeMB = (file.buffer.length / 1024 / 1024).toFixed(1);

    logger.info({ title, fileSizeMB, mimeType }, "Inserting song into DB");

    const [song] = await db
      .insert(songsTable)
      .values({
        title,
        filename: file.originalname,
        url: "/api/songs/0/audio",
        sortOrder: nextSortOrder,
        isActive: true,
        fileData,
        mimeType,
      })
      .returning();

    const audioUrl = `/api/songs/${song.id}/audio`;
    await db.update(songsTable).set({ url: audioUrl }).where(eq(songsTable.id, song.id));

    logger.info({ songId: song.id, title }, "Song uploaded successfully");
    return res.status(201).json({ id: song.id, title: song.title, url: audioUrl, sortOrder: song.sortOrder, isActive: song.isActive });
  } catch (err: unknown) {
    const message = (err as Error).message ?? "Unknown error";
    logger.error({ err: message }, "Song upload DB error");
    return res.status(500).json({ error: `Database error: ${message}` });
  }
});

// DELETE /admin/songs — wipe all songs
router.delete("/admin/songs", requireAdmin, async (_req, res) => {
  await db.delete(songsTable);
  return res.json({ message: "All songs deleted" });
});

// PUT /admin/songs/:id
router.put("/admin/songs/:id", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  const { title, isActive, sortOrder } = req.body as {
    title?: string;
    isActive?: boolean;
    sortOrder?: number;
  };

  const updates: Partial<{ title: string; isActive: boolean; sortOrder: number }> = {};
  if (title !== undefined) updates.title = title;
  if (isActive !== undefined) updates.isActive = isActive;
  if (sortOrder !== undefined) updates.sortOrder = sortOrder;

  const [song] = await db.update(songsTable).set(updates).where(eq(songsTable.id, id)).returning();
  return res.json({ id: song.id, title: song.title, url: song.url, sortOrder: song.sortOrder, isActive: song.isActive });
});

// DELETE /admin/songs/:id
router.delete("/admin/songs/:id", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id), 10);

  const [song] = await db.select().from(songsTable).where(eq(songsTable.id, id)).limit(1);
  if (song) {
    const filePath = path.join(songsDir, song.filename);
    if (fs.existsSync(filePath)) fs.unlink(filePath, () => {});
  }

  await db.delete(songsTable).where(eq(songsTable.id, id));
  return res.json({ message: "Song deleted" });
});

// GET /admin/activity
router.get("/admin/activity", requireAdmin, async (req, res) => {
  const limit = Math.min(parseInt(String((req as { query: Record<string, string> }).query.limit ?? "200"), 10) || 200, 500);
  const type = String((req as { query: Record<string, string> }).query.type ?? "").trim() || undefined;

  let query = db
    .select()
    .from(activityLogsTable)
    .orderBy(desc(activityLogsTable.createdAt))
    .limit(limit);

  const rows = await (type
    ? db.select().from(activityLogsTable).where(eq(activityLogsTable.type, type)).orderBy(desc(activityLogsTable.createdAt)).limit(limit)
    : query);

  return res.json(
    rows.map((r) => ({
      id: r.id,
      type: r.type,
      userId: r.userId ?? null,
      userEmail: r.userEmail ?? null,
      userName: r.userName ?? null,
      metadata: r.metadata ?? null,
      ip: r.ip ?? null,
      createdAt: r.createdAt.toISOString(),
    })),
  );
});

// GET /admin/payments
router.get("/admin/payments", requireAdmin, async (_req, res) => {
  const payments = await db
    .select({
      id: paymentsTable.id,
      userId: paymentsTable.userId,
      userEmail: usersTable.email,
      userName: usersTable.name,
      plan: paymentsTable.plan,
      amount: paymentsTable.amount,
      status: paymentsTable.status,
      reference: paymentsTable.reference,
      userTxId: paymentsTable.userTxId,
      startDate: paymentsTable.startDate,
      endDate: paymentsTable.endDate,
      createdAt: paymentsTable.createdAt,
    })
    .from(paymentsTable)
    .leftJoin(usersTable, eq(paymentsTable.userId, usersTable.id))
    .orderBy(desc(paymentsTable.createdAt));

  return res.json(
    payments.map((p) => ({
      id: p.id,
      userId: p.userId,
      userEmail: p.userEmail ?? null,
      userName: p.userName ?? null,
      plan: p.plan,
      amount: p.amount,
      status: p.status,
      reference: p.reference,
      userTxId: p.userTxId ?? null,
      startDate: p.startDate?.toISOString() ?? null,
      endDate: p.endDate?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
    })),
  );
});

// GET /admin/users
router.get("/admin/users", requireAdmin, async (_req, res) => {
  const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
  return res.json(
    users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      subscriptionPlan: u.subscriptionPlan,
      subscriptionEnd: u.subscriptionEnd?.toISOString() ?? null,
      createdAt: u.createdAt.toISOString(),
    })),
  );
});

// GET /admin/stats
router.get("/admin/stats", requireAdmin, async (_req, res) => {
  const now = new Date();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [userCount] = await db.select({ count: count() }).from(usersTable);
  const [activeSubCount] = await db
    .select({ count: count() })
    .from(usersTable)
    .where(gt(usersTable.subscriptionEnd, now));
  const [questionCount] = await db.select({ count: count() }).from(questionsTable);
  const subjectRows = await db
    .selectDistinct({ subject: questionsTable.subject })
    .from(questionsTable);
  const [songCount] = await db.select({ count: count() }).from(songsTable);
  const [sessionCount] = await db
    .select({ count: count() })
    .from(quizSessionsTable)
    .where(gt(quizSessionsTable.createdAt, weekAgo));

  return res.json({
    totalUsers: Number(userCount?.count ?? 0),
    activeSubscribers: Number(activeSubCount?.count ?? 0),
    totalQuestions: Number(questionCount?.count ?? 0),
    totalSubjects: subjectRows.length,
    totalSongs: Number(songCount?.count ?? 0),
    recentSessions: Number(sessionCount?.count ?? 0),
  });
});

// GET /admin/referrals — referral earnings grouped by referrer
router.get("/admin/referrals", requireAdmin, async (_req, res) => {
  // Get all earnings with referrer info
  const referrerAlias = usersTable;
  const earnings = await db
    .select({
      id: referralEarningsTable.id,
      referrerId: referralEarningsTable.referrerId,
      refereeId: referralEarningsTable.refereeId,
      amount: referralEarningsTable.amount,
      status: referralEarningsTable.status,
      createdAt: referralEarningsTable.createdAt,
      plan: paymentsTable.plan,
    })
    .from(referralEarningsTable)
    .leftJoin(paymentsTable, eq(referralEarningsTable.paymentId, paymentsTable.id))
    .orderBy(desc(referralEarningsTable.createdAt));

  // Get all unique referrers
  const referrerIds = [...new Set(earnings.map(e => e.referrerId))];
  if (referrerIds.length === 0) {
    return res.json([]);
  }

  // Get referrer and referee user info
  const allUsers = await db.select().from(usersTable);
  const userMap = new Map(allUsers.map(u => [u.id, u]));

  // Group by referrerId
  const grouped = new Map<number, {
    userId: number;
    userName: string;
    userEmail: string;
    momoName: string | null;
    momoNumber: string | null;
    pendingAmount: number;
    paidAmount: number;
    earnings: Array<{
      id: number; refereeName: string; plan: string; amount: number; status: string; createdAt: string;
    }>;
  }>();

  for (const earning of earnings) {
    const referrer = userMap.get(earning.referrerId);
    if (!referrer) continue;
    const referee = userMap.get(earning.refereeId);

    if (!grouped.has(earning.referrerId)) {
      grouped.set(earning.referrerId, {
        userId: referrer.id,
        userName: referrer.name,
        userEmail: referrer.email,
        momoName: referrer.momoName ?? null,
        momoNumber: referrer.momoNumber ?? null,
        pendingAmount: 0,
        paidAmount: 0,
        earnings: [],
      });
    }

    const row = grouped.get(earning.referrerId)!;
    if (earning.status === "pending") row.pendingAmount += earning.amount;
    if (earning.status === "paid") row.paidAmount += earning.amount;
    row.earnings.push({
      id: earning.id,
      refereeName: referee?.name ?? "Unknown",
      plan: earning.plan ?? "—",
      amount: earning.amount,
      status: earning.status,
      createdAt: earning.createdAt.toISOString(),
    });
  }

  return res.json(Array.from(grouped.values()));
});

// POST /admin/referrals/:userId/notify — mark earnings as paid + send thank-you email
router.post("/admin/referrals/:userId/notify", requireAdmin, async (req, res) => {
  const userId = parseInt(String(req.params.userId), 10);

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) return res.status(404).json({ error: "User not found" });

  // Get pending earnings for this user
  const pendingEarnings = await db
    .select()
    .from(referralEarningsTable)
    .where(and(
      eq(referralEarningsTable.referrerId, userId),
      eq(referralEarningsTable.status, "pending"),
    ));

  if (pendingEarnings.length === 0) {
    return res.status(400).json({ error: "No pending earnings for this user" });
  }

  const totalAmount = pendingEarnings.reduce((s, e) => s + e.amount, 0);

  // Mark all pending as paid
  await db
    .update(referralEarningsTable)
    .set({ status: "paid" })
    .where(and(
      eq(referralEarningsTable.referrerId, userId),
      eq(referralEarningsTable.status, "pending"),
    ));

  // Send thank-you email to the user
  const momoInfo = user.momoNumber ? `to ${user.momoName ?? user.momoNumber} (${user.momoNumber})` : "to your registered MoMo";
  sendEmail({
    to: user.email,
    subject: "💰 Your Quiz Bunker referral earnings have been sent!",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0f0f1a;color:#fff;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#ff6b00,#e03000);padding:24px 32px;">
          <h1 style="margin:0;font-size:24px;letter-spacing:1px;">🎮 QUIZ BUNKER</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="margin:0 0 12px;color:#ffaa00;">Referral Earnings Sent! 💰</h2>
          <p style="color:#ccc;line-height:1.6;">Hi ${user.name},</p>
          <p style="color:#ccc;line-height:1.6;">
            We've sent your referral earnings of
            <strong style="color:#00ffcc;font-size:18px;"> GHS ${(totalAmount / 100).toFixed(2)}</strong>
            ${momoInfo}.
          </p>
          <div style="background:#1a1a2e;border:1px solid #333;border-radius:8px;padding:16px;margin:20px 0;">
            <p style="margin:0 0 6px;color:#888;font-size:12px;">PAYMENT DETAILS</p>
            <p style="margin:0;color:#ccc;">Amount: <strong style="color:#00ffcc;">GHS ${(totalAmount / 100).toFixed(2)}</strong></p>
            ${user.momoNumber ? `<p style="margin:4px 0 0;color:#ccc;">Sent to: <strong style="color:#fff;">${user.momoName ?? ""} (${user.momoNumber})</strong></p>` : ""}
          </div>
          <p style="color:#ccc;line-height:1.6;">
            Thank you so much for referring friends to Quiz Bunker! Keep sharing your referral link to earn more. Every new subscriber who uses your link earns you <strong style="color:#ffaa00;">20%</strong> of their payment.
          </p>
          <a href="https://quizbunker.com/dashboard" style="display:inline-block;margin:20px 0;padding:14px 32px;background:#ff6b00;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">
            SHARE YOUR REFERRAL LINK
          </a>
          <p style="color:#555;font-size:12px;margin-top:24px;">Payments are sent manually between the 15th and 20th of each month.</p>
        </div>
      </div>
    `,
  }).catch(() => {});

  return res.json({
    message: `GHS ${(totalAmount / 100).toFixed(2)} earnings marked as paid. Thank-you email sent to ${user.email}.`,
  });
});

export default router;
