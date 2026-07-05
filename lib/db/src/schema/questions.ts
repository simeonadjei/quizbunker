import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const questionsTable = pgTable("questions", {
  id: serial("id").primaryKey(),
  year: text("year").notNull(),
  subject: text("subject").notNull(),
  week: integer("week").notNull(),
  weekTopic: text("week_topic").notNull(),
  questionNumber: integer("question_number").notNull(),
  questionText: text("question_text").notNull(),
  optionA: text("option_a").notNull(),
  optionB: text("option_b").notNull(),
  optionC: text("option_c").notNull(),
  optionD: text("option_d").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  dok: text("dok"),
  learningIndicator: text("learning_indicator"),
  feedback: text("feedback"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const insertQuestionSchema = createInsertSchema(questionsTable).omit({ id: true, uploadedAt: true });
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type DbQuestion = typeof questionsTable.$inferSelect;
