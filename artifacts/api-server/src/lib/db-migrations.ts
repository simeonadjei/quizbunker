import { pool } from "@workspace/db";
import { logger } from "./logger";

/**
 * Ensure the songs table has the file_data and mime_type columns.
 * These were added to the Drizzle schema but may not have been applied to the
 * production Neon database yet. `ADD COLUMN IF NOT EXISTS` is idempotent —
 * safe to run on every startup or inline before an insert.
 */
export async function ensureSongsColumns(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`ALTER TABLE songs ADD COLUMN IF NOT EXISTS file_data TEXT`);
    await client.query(`ALTER TABLE songs ADD COLUMN IF NOT EXISTS mime_type TEXT`);
    logger.info("ensureSongsColumns: file_data + mime_type columns confirmed");
  } catch (err) {
    throw new Error(`ensureSongsColumns failed: ${(err as Error).message}`);
  } finally {
    client.release();
  }
}
