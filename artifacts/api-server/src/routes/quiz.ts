import { Router } from "express";
import { db, questionsTable, quizSessionsTable, quizAnswersTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";

const router = Router();

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

function formatSession(s: typeof quizSessionsTable.$inferSelect) {
  return {
    id: s.id,
    year: s.year,
    subject: s.subject,
    week: s.week,
    weekTopic: s.weekTopic ?? null,
    score: s.score ?? null,
    totalQuestions: s.totalQuestions,
    completedAt: s.completedAt?.toISOString() ?? null,
  };
}

/** Full question (with answer) — only for completed sessions / results */
function formatQuestion(q: typeof questionsTable.$inferSelect) {
  return {
    id: q.id,
    year: q.year,
    subject: q.subject,
    week: q.week,
    weekTopic: q.weekTopic,
    questionNumber: q.questionNumber,
    questionText: q.questionText,
    optionA: q.optionA,
    optionB: q.optionB,
    optionC: q.optionC,
    optionD: q.optionD,
    correctAnswer: q.correctAnswer,
    dok: q.dok ?? null,
    learningIndicator: q.learningIndicator ?? null,
    feedback: q.feedback ?? null,
  };
}

/** Question without the answer — for in-progress sessions */
function formatQuestionSafe(q: typeof questionsTable.$inferSelect) {
  return {
    id: q.id,
    year: q.year,
    subject: q.subject,
    week: q.week,
    weekTopic: q.weekTopic,
    questionNumber: q.questionNumber,
    questionText: q.questionText,
    optionA: q.optionA,
    optionB: q.optionB,
    optionC: q.optionC,
    optionD: q.optionD,
    // correctAnswer intentionally omitted
    dok: q.dok ?? null,
    learningIndicator: q.learningIndicator ?? null,
    feedback: q.feedback ?? null,
  };
}

// POST /quiz/sessions
router.post("/quiz/sessions", requireAuth, async (req, res) => {
  const { year, subject, week } = req.body;

  if (!year || !subject || week == null) {
    return res.status(400).json({ error: "year, subject, and week are required" });
  }

  // Server-side subscription gate
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId!))
    .limit(1);

  const now = new Date();
  const isActive =
    user &&
    user.subscriptionPlan !== "none" &&
    user.subscriptionEnd !== null &&
    user.subscriptionEnd > now;

  if (!isActive) {
    return res.status(403).json({ error: "Active subscription required to start a quiz" });
  }

  const questions = await db
    .select()
    .from(questionsTable)
    .where(
      and(
        eq(questionsTable.year, year),
        eq(questionsTable.subject, subject),
        eq(questionsTable.week, Number(week)),
      ),
    )
    .orderBy(questionsTable.questionNumber);

  if (questions.length === 0) {
    return res
      .status(400)
      .json({ error: "No questions found for this selection. Try a different year, subject, or week." });
  }

  const weekTopic = questions[0]?.weekTopic ?? null;

  const [session] = await db
    .insert(quizSessionsTable)
    .values({
      userId: req.session.userId!,
      year,
      subject,
      week: Number(week),
      weekTopic,
      totalQuestions: questions.length,
    })
    .returning();

  return res.status(201).json(formatSession(session));
});

// GET /quiz/sessions/:sessionId
router.get("/quiz/sessions/:sessionId", requireAuth, async (req, res) => {
  const sessionId = parseInt(String(req.params.sessionId), 10);

  const [session] = await db
    .select()
    .from(quizSessionsTable)
    .where(and(eq(quizSessionsTable.id, sessionId), eq(quizSessionsTable.userId, req.session.userId!)))
    .limit(1);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  const questions = await db
    .select()
    .from(questionsTable)
    .where(
      and(
        eq(questionsTable.year, session.year),
        eq(questionsTable.subject, session.subject),
        eq(questionsTable.week, session.week),
      ),
    )
    .orderBy(questionsTable.questionNumber);

  const answers = await db
    .select()
    .from(quizAnswersTable)
    .where(eq(quizAnswersTable.sessionId, sessionId));

  // Only reveal correct answers for completed sessions
  const isCompleted = !!session.completedAt;

  return res.json({
    ...formatSession(session),
    questions: isCompleted ? questions.map(formatQuestion) : questions.map(formatQuestionSafe),
    answers: answers.map((a) => ({
      questionId: a.questionId,
      selectedAnswer: a.selectedAnswer ?? null,
      isCorrect: a.isCorrect,
    })),
  });
});

// POST /quiz/sessions/:sessionId/submit
router.post("/quiz/sessions/:sessionId/submit", requireAuth, async (req, res) => {
  const sessionId = parseInt(String(req.params.sessionId), 10);
  const { answers } = req.body;

  if (!Array.isArray(answers)) {
    return res.status(400).json({ error: "answers must be an array" });
  }

  const [session] = await db
    .select()
    .from(quizSessionsTable)
    .where(and(eq(quizSessionsTable.id, sessionId), eq(quizSessionsTable.userId, req.session.userId!)))
    .limit(1);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }
  if (session.completedAt) {
    return res.status(400).json({ error: "Session already submitted" });
  }

  const questions = await db
    .select()
    .from(questionsTable)
    .where(
      and(
        eq(questionsTable.year, session.year),
        eq(questionsTable.subject, session.subject),
        eq(questionsTable.week, session.week),
      ),
    );

  const questionMap = new Map(questions.map((q) => [q.id, q]));
  const validQuestionIds = new Set(questions.map((q) => q.id));

  // Deduplicate by questionId and reject answers for questions not in this session
  const seenIds = new Set<number>();
  const validAnswers: { questionId: number; selectedAnswer: string }[] = [];
  for (const a of answers as { questionId: number; selectedAnswer: string }[]) {
    const qid = Number(a.questionId);
    if (!validQuestionIds.has(qid) || seenIds.has(qid)) continue;
    seenIds.add(qid);
    validAnswers.push({ questionId: qid, selectedAnswer: String(a.selectedAnswer).toUpperCase() });
  }

  let score = 0;
  const answerRows = validAnswers.map((a) => {
    const question = questionMap.get(a.questionId);
    const isCorrect = question ? question.correctAnswer === a.selectedAnswer : false;
    if (isCorrect) score++;
    return {
      sessionId,
      questionId: a.questionId,
      selectedAnswer: a.selectedAnswer,
      isCorrect,
    };
  });

  if (answerRows.length > 0) {
    await db.insert(quizAnswersTable).values(answerRows);
  }

  const [updatedSession] = await db
    .update(quizSessionsTable)
    .set({ score, completedAt: new Date() })
    .where(eq(quizSessionsTable.id, sessionId))
    .returning();

  const savedAnswers = await db
    .select()
    .from(quizAnswersTable)
    .where(eq(quizAnswersTable.sessionId, sessionId));

  return res.json({
    ...formatSession(updatedSession),
    questions: questions.map(formatQuestion),
    answers: savedAnswers.map((a) => ({
      questionId: a.questionId,
      selectedAnswer: a.selectedAnswer ?? null,
      isCorrect: a.isCorrect,
    })),
  });
});

// GET /quiz/history
router.get("/quiz/history", requireAuth, async (req, res) => {
  const sessions = await db
    .select()
    .from(quizSessionsTable)
    .where(eq(quizSessionsTable.userId, req.session.userId!))
    .orderBy(quizSessionsTable.createdAt);

  return res.json(sessions.map(formatSession));
});

export default router;
