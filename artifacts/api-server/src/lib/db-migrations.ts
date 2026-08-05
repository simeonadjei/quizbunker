import { pool } from "@workspace/db";
import { logger } from "./logger";

/**
 * Run a function with retry logic and exponential back-off.
 * Designed to handle Neon free-tier "cold start" delays where the first
 * connection attempt at server startup often times out.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxAttempts = 5,
  baseDelayMs = 1500,
): Promise<T> {
  let lastErr: Error = new Error("unreachable");
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err as Error;
      if (attempt < maxAttempts) {
        const delay = baseDelayMs * attempt; // 1.5 s, 3 s, 4.5 s, 6 s
        logger.warn(
          { label, attempt, delay, err: lastErr.message },
          `DB migration attempt ${attempt}/${maxAttempts} failed — retrying in ${delay}ms`,
        );
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw new Error(`${label} failed after ${maxAttempts} attempts: ${lastErr.message}`);
}

/**
 * Run a batch of DDL statements on a single pooled connection.
 * Each statement is run independently so one failure never blocks the rest.
 * Returns the number of statements that succeeded.
 */
async function runDDLBatch(statements: string[]): Promise<number> {
  const client = await pool.connect();
  let succeeded = 0;
  try {
    for (const sql of statements) {
      try {
        await client.query(sql);
        succeeded++;
      } catch (e) {
        // IF NOT EXISTS makes duplicates impossible in modern Postgres, but
        // guard against edge cases on older versions.
        const msg = (e as Error).message ?? "";
        if (msg.includes("already exists")) {
          succeeded++;
        } else {
          throw e;
        }
      }
    }
  } finally {
    client.release();
  }
  return succeeded;
}

/**
 * Ensure the songs table has the file_data and mime_type columns.
 * These were added to the Drizzle schema but may not have been applied to the
 * production Neon/Render database yet. Retries on cold-start connection errors.
 */
export async function ensureSongsColumns(): Promise<void> {
  await withRetry(
    () =>
      runDDLBatch([
        `ALTER TABLE songs ADD COLUMN IF NOT EXISTS file_data TEXT`,
        `ALTER TABLE songs ADD COLUMN IF NOT EXISTS mime_type TEXT`,
      ]),
    "ensureSongsColumns",
  );
  logger.info("ensureSongsColumns: file_data + mime_type columns confirmed");
}

/**
 * Ensure the users table has all columns added after the initial deploy.
 * Safe to run on every startup — ADD COLUMN IF NOT EXISTS is idempotent.
 * Retries on Neon free-tier cold-start connection timeouts.
 */
export async function ensureUsersColumns(): Promise<void> {
  await withRetry(
    () =>
      runDDLBatch([
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS semester_start TIMESTAMP`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by INTEGER`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS momo_number TEXT`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS momo_name TEXT`,
      ]),
    "ensureUsersColumns",
  );
  logger.info("ensureUsersColumns: all user columns confirmed");
}
