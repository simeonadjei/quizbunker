import { pool } from "@workspace/db";
import { logger } from "./logger";

/**
 * Ensure the songs table has the file_data and mime_type columns.
 * These were added to the Drizzle schema but may not have been applied to the
 * production Neon/Render database yet. Each ALTER is run separately so one
 * failure does not prevent the other column from being added.
 * `ADD COLUMN IF NOT EXISTS` is idempotent — safe to run on every startup or
 * inline before an insert.
 */
export async function ensureSongsColumns(): Promise<void> {
  const client = await pool.connect();
  try {
    // Run each column migration independently — a failure on one should not
    // prevent the other from being added.
    try {
      await client.query(`ALTER TABLE songs ADD COLUMN IF NOT EXISTS file_data TEXT`);
    } catch (e) {
      // Only re-throw if it's not a "column already exists" duplicate
      const msg = (e as Error).message ?? "";
      if (!msg.includes("already exists")) throw e;
    }
    try {
      await client.query(`ALTER TABLE songs ADD COLUMN IF NOT EXISTS mime_type TEXT`);
    } catch (e) {
      const msg = (e as Error).message ?? "";
      if (!msg.includes("already exists")) throw e;
    }
    logger.info("ensureSongsColumns: file_data + mime_type columns confirmed");
  } catch (err) {
    throw new Error(`ensureSongsColumns failed: ${(err as Error).message}`);
  } finally {
    client.release();
  }
}

/**
 * Ensure the users table has all columns added after the initial deploy.
 * Safe to run on every startup — ADD COLUMN IF NOT EXISTS is idempotent.
 */
export async function ensureUsersColumns(): Promise<void> {
  const client = await pool.connect();
  const migrations = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS semester_start TIMESTAMP`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by INTEGER`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS momo_number TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS momo_name TEXT`,
  ];
  try {
    for (const sql of migrations) {
      try {
        await client.query(sql);
      } catch (e) {
        const msg = (e as Error).message ?? "";
        if (!msg.includes("already exists")) throw e;
      }
    }
    logger.info("ensureUsersColumns: all user columns confirmed");
  } catch (err) {
    throw new Error(`ensureUsersColumns failed: ${(err as Error).message}`);
  } finally {
    client.release();
  }
}
