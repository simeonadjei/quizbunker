import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { questionsTable } from "./questions";

export const quizSessionsTable = pgTable("quiz_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  year: text("year").notNull(),
  subject: text("subject").notNull(),
  week: integer("week").notNull(),
  weekTopic: text("week_topic"),
  score: integer("score"),
  totalQuestions: integer("total_questions").notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const quizAnswersTable = pgTable("quiz_answers", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => quizSessionsTable.id),
  questionId: integer("question_id").notNull().references(() => questionsTable.id),
  selectedAnswer: text("selected_answer"),
  isCorrect: boolean("is_correct").notNull().default(false),
});

export const insertQuizSessionSchema = createInsertSchema(quizSessionsTable).omit({ id: true, createdAt: true });
export type InsertQuizSession = z.infer<typeof insertQuizSessionSchema>;
export type QuizSessionRow = typeof quizSessionsTable.$inferSelect;

export const insertQuizAnswerSchema = createInsertSchema(quizAnswersTable).omit({ id: true });
export type InsertQuizAnswer = z.infer<typeof insertQuizAnswerSchema>;
export type QuizAnswerRow = typeof quizAnswersTable.$inferSelect;
