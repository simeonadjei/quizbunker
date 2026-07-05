import { Router } from "express";
import { db, questionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

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

// GET /questions
router.get("/questions", async (req, res) => {
  const { year, subject, week } = req.query as {
    year?: string;
    subject?: string;
    week?: string;
  };

  const conditions = [];
  if (year) conditions.push(eq(questionsTable.year, year));
  if (subject) conditions.push(eq(questionsTable.subject, subject));
  if (week) conditions.push(eq(questionsTable.week, parseInt(week, 10)));

  let rows;
  if (conditions.length > 0) {
    rows = await db
      .select()
      .from(questionsTable)
      .where(and(...conditions))
      .orderBy(questionsTable.questionNumber);
  } else {
    rows = await db
      .select()
      .from(questionsTable)
      .orderBy(questionsTable.questionNumber);
  }

  return res.json(rows.map(formatQuestion));
});

// GET /questions/filters
router.get("/questions/filters", async (req, res) => {
  const yearRows = await db
    .selectDistinct({ year: questionsTable.year })
    .from(questionsTable)
    .orderBy(questionsTable.year);

  const subjectRows = await db
    .selectDistinct({ subject: questionsTable.subject })
    .from(questionsTable)
    .orderBy(questionsTable.subject);

  const weekRows = await db
    .selectDistinct({ week: questionsTable.week })
    .from(questionsTable)
    .orderBy(questionsTable.week);

  return res.json({
    years: yearRows.map((r) => r.year),
    subjects: subjectRows.map((r) => r.subject),
    weeks: weekRows.map((r) => r.week),
  });
});

export default router;
