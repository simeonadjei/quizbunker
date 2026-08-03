import { Router } from "express";
import { db, songsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

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

// GET /songs/:id/audio — stream audio bytes stored in the database
// This is the persistent fallback that survives Render redeploys.
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
  if (!song.fileData) return res.status(404).json({ error: "Audio data not available" });

  const mime = song.mimeType ?? "audio/mpeg";
  // Decode base64 stored string back to binary
  const buf = Buffer.from(song.fileData, "base64");
  const fileSize = buf.length;

  // Support HTTP Range requests so mobile browsers can seek
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
  } else {
    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": mime,
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=86400",
    });
    return void res.end(buf);
  }
});

export default router;
