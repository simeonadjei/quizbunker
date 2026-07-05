import { Router } from "express";
import { db, songsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// GET /songs
router.get("/songs", async (_req, res) => {
  const songs = await db
    .select()
    .from(songsTable)
    .where(eq(songsTable.isActive, true))
    .orderBy(songsTable.sortOrder);

  return res.json(
    songs.map((s) => ({
      id: s.id,
      title: s.title,
      url: s.url,
      sortOrder: s.sortOrder,
      isActive: s.isActive,
    })),
  );
});

export default router;
