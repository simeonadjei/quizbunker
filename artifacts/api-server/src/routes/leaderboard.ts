import { Router } from "express";
import { db, quizSessionsTable, usersTable } from "@workspace/db";
import { eq, and, isNotNull, ne, gt, sql } from "drizzle-orm";

const router = Router();

/**
 * GET /leaderboard
 * Returns top 20 subscribed users ranked by average score %
 * Only users who have completed at least 3 quizzes are eligible.
 * Score = AVG(score / totalQuestions * 100) across all completed sessions.
 * No auth required — leaderboard is public to motivate registration.
 */
router.get("/leaderboard", async (req, res) => {
  const now = new Date();

  const rows = await db
    .select({
      userId: usersTable.id,
      name: usersTable.name,
      avgScore: sql<number>`ROUND(AVG(CAST(${quizSessionsTable.score} AS FLOAT) / NULLIF(${quizSessionsTable.totalQuestions}, 0) * 100), 1)`,
      quizzesCompleted: sql<number>`COUNT(*)::int`,
    })
    .from(quizSessionsTable)
    .innerJoin(usersTable, eq(quizSessionsTable.userId, usersTable.id))
    .where(
      and(
        isNotNull(quizSessionsTable.completedAt),
        isNotNull(quizSessionsTable.score),
        ne(usersTable.subscriptionPlan, "none"),
        isNotNull(usersTable.subscriptionEnd),
        gt(usersTable.subscriptionEnd, now),
      ),
    )
    .groupBy(usersTable.id, usersTable.name)
    .having(sql`COUNT(*) >= 3`)
    .orderBy(
      sql`AVG(CAST(${quizSessionsTable.score} AS FLOAT) / NULLIF(${quizSessionsTable.totalQuestions}, 0) * 100) DESC`,
    )
    .limit(20);

  const leaderboard = rows.map((row, i) => ({
    rank: i + 1,
    userId: row.userId,
    name: row.name,
    avgScore: Number(row.avgScore),
    quizzesCompleted: Number(row.quizzesCompleted),
  }));

  res.json(leaderboard);
});

export default router;
