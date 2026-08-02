import { pgTable, serial, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  verificationToken: text("verification_token"),
  resetToken: text("reset_token"),
  resetTokenExpires: timestamp("reset_token_expires"),
  subscriptionPlan: text("subscription_plan").notNull().default("none"),
  subscriptionEnd: timestamp("subscription_end"),
  semesterStart: timestamp("semester_start"),
  // Referral system
  referralCode: text("referral_code").unique(),
  referredBy: integer("referred_by"), // user id of who referred them (no FK to avoid circular)
  momoNumber: text("momo_number"),
  momoName: text("momo_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
