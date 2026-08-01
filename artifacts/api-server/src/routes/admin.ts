import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db, questionsTable, songsTable, usersTable, quizSessionsTable, paymentsTable, activityLogsTable } from "@workspace/db";
import { eq, desc, count, gt } from "drizzle-orm";
import { parseQuestionText } from "../lib/parser";
import mammoth from "mammoth";
import type { Request, Response, NextFunction } from "express";
import { sendEmail, isEmailConfigured } from "../lib/email";

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

// Multer for songs (audio files) — keep original extension
const songStorage = multer.diskStorage({
  destination: songsDir,
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});
const songUpload = multer({
  storage: songStorage,
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

// POST /admin/auth
router.post("/admin/auth", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminEmail = process.env.ADMIN_EMAIL;

  // Check password always; check email only if ADMIN_EMAIL is set
  const passwordOk = adminPassword && password === adminPassword;
  const emailOk = !adminEmail || (email && email.toLowerCase() === adminEmail.toLowerCase());

  if (!passwordOk || !emailOk) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Regenerate session on privilege escalation to prevent session fixation
  await new Promise<void>((resolve, reject) =>
    req.session.regenerate((err) => (err ? reject(err) : resolve())),
  );
  req.session.isAdmin = true;

  // Log admin login
  const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0].trim() || req.socket?.remoteAddress || null;
  db.insert(activityLogsTable).values({ type: "admin_login", userEmail: email ?? null, ip }).catch(() => {});

  return res.json({ message: "Authenticated" });
});

// POST /admin/test-email — sends a test email via Resend and returns success or the exact error
router.post("/admin/test-email", requireAdmin, async (req, res) => {
  if (!isEmailConfigured()) {
    return res.status(400).json({
      ok: false,
      error: "Email not configured — RESEND_API_KEY must be set as an environment variable on Render.",
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

// POST /admin/songs — supports single or multiple files (field name: "files" or "file")
router.post("/admin/songs", requireAdmin, songUpload.array("files", 20), async (req, res) => {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) {
    return res.status(400).json({ error: "No audio files uploaded. Send files in the 'files' field." });
  }

  // Compute starting sort order
  const [last] = await db
    .select()
    .from(songsTable)
    .orderBy(desc(songsTable.sortOrder))
    .limit(1);

  let nextSortOrder = last ? last.sortOrder + 1 : 0;

  const titles = Array.isArray(req.body.titles) ? req.body.titles as string[] : [];
  const inserted = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    // Use provided title or derive from original filename
    const rawTitle = (titles[i] || req.body.title || "").trim();
    const title = rawTitle || file.originalname.replace(/\.[^.]+$/, "").trim();

    const url = `/api/uploads/songs/${file.filename}`;

    const [song] = await db
      .insert(songsTable)
      .values({ title, filename: file.filename, url, sortOrder: nextSortOrder, isActive: true })
      .returning();

    inserted.push({ id: song.id, title: song.title, url: song.url, sortOrder: song.sortOrder, isActive: song.isActive });
    nextSortOrder++;
  }

  return res.status(201).json(inserted.length === 1 ? inserted[0] : inserted);
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

export default router;
