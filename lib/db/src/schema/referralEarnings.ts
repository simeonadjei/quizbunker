import { pgTable, serial, integer, timestamp, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { paymentsTable } from "./payments";

export const referralEarningsTable = pgTable("referral_earnings", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull().references(() => usersTable.id),
  refereeId: integer("referee_id").notNull().references(() => usersTable.id),
  paymentId: integer("payment_id").notNull().references(() => paymentsTable.id),
  amount: integer("amount").notNull(), // in pesewas (GHS × 100), 20% of payment
  status: text("status").notNull().default("pending"), // pending | paid
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReferralEarningSchema = createInsertSchema(referralEarningsTable).omit({ id: true, createdAt: true });
export type InsertReferralEarning = z.infer<typeof insertReferralEarningSchema>;
export type ReferralEarning = typeof referralEarningsTable.$inferSelect;
