import { Router } from "express";
import { db, songsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { isSupabaseConfigured, getSupabaseSignedUrl } from "../lib/supabaseStorage";
import { isR2Configured, streamFromR2 } from "../lib/r2Storage";

const router = Router();

// GET /songs
// Explicitly scoped — never touches file_data / mime_type so this route works
// even on Render DBs that are missing those columns.
router.get("/songs", async (_req, res) => {
  const songs = await db
    .select({
      id: songsTable.id,
      title: songsTable.title,
      url: songsTable.url,
      sortOrder: songsTable.sortOrder,
      isActive: songsTable.isActive,
    })
    .from(songsTable)
    .where(eq(songsTable.isActive, true))
    .orderBy(songsTable.sortOrder);

  return res.json(songs);
});

/**
 * GET /songs/:id/audio
 *
 * Serves audio for songs stored as:
 *   1. R2 object  — fileData is null, filename holds the R2 key (e.g. "songs/…")
 *   2. DB blob    — fileData holds base64 bytes (legacy, still works)
 *
 * Songs served from disk (/api/uploads/songs/*) are handled by express.static
 * in app.ts and never reach this route.
 */
router.get("/songs/:id/audio", async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid song id" });

  const [song] = await db
    .select({
      fileData: songsTable.fileData,
      mimeType: songsTable.mimeType,
      filename: songsTable.filename,
    })
    .from(songsTable)
    .where(eq(songsTable.id, id))
    .limit(1);

  if (!song) return res.status(404).json({ error: "Song not found" });

  // ── Path 1: Cloud Storage (fileData is null — file lives in R2 or Supabase) ──
  if (!song.fileData) {
    // R2 is preferred — stream directly so Range / seeking works natively
    if (isR2Configured() && song.filename.startsWith("songs/")) {
      try {
        const rangeHeader = req.headers.range;
        const result = await streamFromR2(song.filename, rangeHeader);

        res.writeHead(result.statusCode, {
          "Content-Type":   result.contentType,
          "Accept-Ranges":  result.acceptRanges ?? "bytes",
          "Cache-Control":  "public, max-age=86400",
          ...(result.contentLength !== undefined && { "Content-Length": String(result.contentLength) }),
          ...(result.contentRange   !== undefined && { "Content-Range":  result.contentRange }),
        });
        result.body.pipe(res);
        return;
      } catch (err: unknown) {
        const msg = (err as Error).message ?? String(err);
        return res.status(404).json({ error: `Audio not found in R2: ${msg}` });
      }
    }

    // Supabase fallback — redirect to 1-hour signed URL
    if (isSupabaseConfigured()) {
      try {
        const signedUrl = await getSupabaseSignedUrl(song.filename);
        return res.redirect(302, signedUrl);
      } catch (err: unknown) {
        const msg = (err as Error).message ?? String(err);
        return res.status(404).json({ error: `Audio not found in storage: ${msg}` });
      }
    }

    return res.status(503).json({ error: "Storage not configured" });
  }

  // ── Path 2: Legacy DB blob (base64 stored in fileData column) ────────────
  const mime = song.mimeType ?? "audio/mpeg";
  const buf = Buffer.from(song.fileData, "base64");
  const fileSize = buf.length;

  const rangeHeader = req.headers.range;
  if (rangeHeader) {
    const parts = rangeHeader.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": mime,
      "Cache-Control": "public, max-age=86400",
    });
    return void res.end(buf.slice(start, end + 1));
  }

  res.writeHead(200, {
    "Content-Length": fileSize,
    "Content-Type": mime,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=86400",
  });
  return void res.end(buf);
});

export default router;
