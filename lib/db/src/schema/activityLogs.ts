import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const activityLogsTable = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  // Event type — extensible: add new strings freely as features grow
  type: text("type").notNull(),
  // Nullable: user may not exist yet (e.g. failed register)
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  // Denormalised for display even after user deletion
  userEmail: text("user_email"),
  userName: text("user_name"),
  // JSON blob — each event type puts relevant data here
  metadata: text("metadata"),
  ip: text("ip"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogsTable.$inferSelect;
