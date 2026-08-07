import { Router } from "express";
import { db, questionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

function questionImages(q: typeof questionsTable.$inferSelect): string[] {
  if (!q.questionImages) return [];
  try {
    const parsed = JSON.parse(q.questionImages);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
}

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
    questionImages: questionImages(q),
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
// Optional params: ?year=X  → filters subjects to those that exist for that year
//                  ?year=X&subject=Y → also filters weeks to those that exist for year+subject
router.get("/questions/filters", async (req, res) => {
  const { year, subject } = req.query as { year?: string; subject?: string };

  const yearRows = await db
    .selectDistinct({ year: questionsTable.year })
    .from(questionsTable)
    .orderBy(questionsTable.year);

  // Subjects: filter by year if provided
  const subjectQuery = db
    .selectDistinct({ subject: questionsTable.subject })
    .from(questionsTable)
    .orderBy(questionsTable.subject);
  const subjectRows = year
    ? await subjectQuery.where(eq(questionsTable.year, year))
    : await subjectQuery;

  // Weeks: filter by year+subject if both provided, by year alone if only year
  let weekRows;
  if (year && subject) {
    weekRows = await db
      .selectDistinct({ week: questionsTable.week, weekTopic: questionsTable.weekTopic })
      .from(questionsTable)
      .where(and(eq(questionsTable.year, year), eq(questionsTable.subject, subject)))
      .orderBy(questionsTable.week);
  } else if (year) {
    weekRows = await db
      .selectDistinct({ week: questionsTable.week, weekTopic: questionsTable.weekTopic })
      .from(questionsTable)
      .where(eq(questionsTable.year, year))
      .orderBy(questionsTable.week);
  } else {
    weekRows = await db
      .selectDistinct({ week: questionsTable.week, weekTopic: questionsTable.weekTopic })
      .from(questionsTable)
      .orderBy(questionsTable.week);
  }

  // Keep one stable, non-empty topic per week. Some older uploads contain
  // duplicate rows for a week or a blank topic on the first row.
  const topicByWeek = new Map<number, string>();
  for (const row of weekRows) {
    const topic = row.weekTopic?.trim() ?? "";
    if (!topicByWeek.has(row.week) || (!topicByWeek.get(row.week) && topic)) {
      topicByWeek.set(row.week, topic);
    }
  }
  const weeks = [...topicByWeek.keys()].sort((a, b) => a - b);
  const weekTopics = Object.fromEntries(
    weeks.map((week) => [String(week), topicByWeek.get(week) ?? ""]),
  );

  return res.json({
    years: yearRows.map((r) => r.year),
    subjects: subjectRows.map((r) => r.subject),
    weeks,
    weekTopics,
  });
});

export default router;
