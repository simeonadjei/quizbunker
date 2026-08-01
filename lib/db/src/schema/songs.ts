import { pgTable, serial, text, integer, boolean, timestamp, customType } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// bytea column type for storing binary audio data in PostgreSQL
const bytea = customType<{ data: Buffer; notNull: false; default: false }>({
  dataType() {
    return "bytea";
  },
  toDriver(value: Buffer): Buffer {
    return value;
  },
  fromDriver(value: unknown): Buffer {
    if (Buffer.isBuffer(value)) return value;
    if (typeof value === "string") {
      // pg returns bytea as hex string prefixed with \x
      return Buffer.from(value.replace(/^\\x/, ""), "hex");
    }
    return Buffer.from(value as ArrayBuffer);
  },
});

export const songsTable = pgTable("songs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  filename: text("filename").notNull(),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  /** Audio file bytes — stored in DB so files survive Render redeploys */
  fileData: bytea("file_data"),
  /** MIME type e.g. audio/mpeg — used when serving fileData */
  mimeType: text("mime_type"),
});

export const insertSongSchema = createInsertSchema(songsTable).omit({ id: true, uploadedAt: true });
export type InsertSong = z.infer<typeof insertSongSchema>;
export type DbSong = typeof songsTable.$inferSelect;
