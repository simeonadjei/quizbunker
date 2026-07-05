import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const songsTable = pgTable("songs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  filename: text("filename").notNull(),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const insertSongSchema = createInsertSchema(songsTable).omit({ id: true, uploadedAt: true });
export type InsertSong = z.infer<typeof insertSongSchema>;
export type DbSong = typeof songsTable.$inferSelect;
