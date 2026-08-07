/**
 * One-time migration: add file_data and mime_type columns to the songs table.
 * Safe to run multiple times (uses ADD COLUMN IF NOT EXISTS).
 * Run with: pnpm --filter @workspace/api-server run migrate-songs
 */
import { pool } from "@workspace/db";

async function run() {
  console.log("Connected.");

  const { rows } = await pool.query<{ column_name: string }>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'songs' ORDER BY ordinal_position`
  );
  console.log("Existing columns:", rows.map((r) => r.column_name).join(", "));

  await pool.query(`ALTER TABLE songs ADD COLUMN IF NOT EXISTS file_data TEXT`);
  await pool.query(`ALTER TABLE songs ADD COLUMN IF NOT EXISTS mime_type TEXT`);
  console.log("✅ Migration complete — file_data and mime_type columns ensured.");
}

run()
  .catch(e => { console.error("Migration failed:", e.message); process.exit(1); })
  .finally(() => pool.end());
