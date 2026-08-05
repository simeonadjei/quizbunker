import { pool } from "@workspace/db";
import { logger } from "./logger";

/**
 * Create all application tables if they don't exist.
 * Safe to run on every startup — every statement uses IF NOT EXISTS.
 * Must be called BEFORE any other migration helpers so they can safely
 * do ALTER TABLE without hitting "relation does not exist".
 */
export async function ensureAllTables(): Promise<void> {
  await withRetry(
    () =>
      runDDLBatch([
        // 1. users — no foreign key deps
        `CREATE TABLE IF NOT EXISTS users (
          id                   SERIAL PRIMARY KEY,
          email                TEXT NOT NULL UNIQUE,
          name                 TEXT NOT NULL,
          password_hash        TEXT NOT NULL,
          email_verified       BOOLEAN NOT NULL DEFAULT false,
          verification_token   TEXT,
          reset_token          TEXT,
          reset_token_expires  TIMESTAMP,
          subscription_plan    TEXT NOT NULL DEFAULT 'none',
          subscription_end     TIMESTAMP,
          semester_start       TIMESTAMP,
          referral_code        TEXT UNIQUE,
          referred_by          INTEGER,
          momo_number          TEXT,
          momo_name            TEXT,
          created_at           TIMESTAMP NOT NULL DEFAULT NOW()
        )`,

        // 2. questions — no foreign key deps
        `CREATE TABLE IF NOT EXISTS questions (
          id                 SERIAL PRIMARY KEY,
          year               TEXT NOT NULL,
          subject            TEXT NOT NULL,
          week               INTEGER NOT NULL,
          week_topic         TEXT NOT NULL,
          question_number    INTEGER NOT NULL,
          question_text      TEXT NOT NULL,
          option_a           TEXT NOT NULL,
          option_b           TEXT NOT NULL,
          option_c           TEXT NOT NULL,
          option_d           TEXT NOT NULL,
          correct_answer     TEXT NOT NULL,
          dok                TEXT,
          learning_indicator TEXT,
          feedback           TEXT,
          uploaded_at        TIMESTAMP NOT NULL DEFAULT NOW()
        )`,

        // 3. songs — no foreign key deps
        `CREATE TABLE IF NOT EXISTS songs (
          id          SERIAL PRIMARY KEY,
          title       TEXT NOT NULL,
          filename    TEXT NOT NULL,
          url         TEXT NOT NULL,
          sort_order  INTEGER NOT NULL DEFAULT 0,
          is_active   BOOLEAN NOT NULL DEFAULT true,
          uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
          file_data   TEXT,
          mime_type   TEXT
        )`,

        // 4. quiz_sessions — depends on users
        `CREATE TABLE IF NOT EXISTS quiz_sessions (
          id              SERIAL PRIMARY KEY,
          user_id         INTEGER NOT NULL REFERENCES users(id),
          year            TEXT NOT NULL,
          subject         TEXT NOT NULL,
          week            INTEGER NOT NULL,
          week_topic      TEXT,
          score           INTEGER,
          total_questions INTEGER NOT NULL,
          completed_at    TIMESTAMP,
          created_at      TIMESTAMP NOT NULL DEFAULT NOW()
        )`,

        // 5. quiz_answers — depends on quiz_sessions, questions
        `CREATE TABLE IF NOT EXISTS quiz_answers (
          id              SERIAL PRIMARY KEY,
          session_id      INTEGER NOT NULL REFERENCES quiz_sessions(id),
          question_id     INTEGER NOT NULL REFERENCES questions(id),
          selected_answer TEXT,
          is_correct      BOOLEAN NOT NULL DEFAULT false
        )`,

        // 6. payments — depends on users
        `CREATE TABLE IF NOT EXISTS payments (
          id             SERIAL PRIMARY KEY,
          user_id        INTEGER NOT NULL REFERENCES users(id),
          plan           TEXT NOT NULL,
          amount         INTEGER NOT NULL,
          reference      TEXT NOT NULL UNIQUE,
          status         TEXT NOT NULL DEFAULT 'pending',
          user_tx_id     TEXT,
          start_date     TIMESTAMP,
          end_date       TIMESTAMP,
          semester_start TIMESTAMP,
          created_at     TIMESTAMP NOT NULL DEFAULT NOW()
        )`,

        // 7. activity_logs — user_id nullable (SET NULL on delete)
        `CREATE TABLE IF NOT EXISTS activity_logs (
          id         SERIAL PRIMARY KEY,
          type       TEXT NOT NULL,
          user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
          user_email TEXT,
          user_name  TEXT,
          metadata   TEXT,
          ip         TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )`,

        // 8. referral_earnings — depends on users, payments
        `CREATE TABLE IF NOT EXISTS referral_earnings (
          id          SERIAL PRIMARY KEY,
          referrer_id INTEGER NOT NULL REFERENCES users(id),
          referee_id  INTEGER NOT NULL REFERENCES users(id),
          payment_id  INTEGER NOT NULL REFERENCES payments(id),
          amount      INTEGER NOT NULL,
          status      TEXT NOT NULL DEFAULT 'pending',
          created_at  TIMESTAMP NOT NULL DEFAULT NOW()
        )`,

        // 9. express_sessions — connect-pg-simple reads table.sql from its
        //    package directory at runtime, which breaks when esbuild bundles
        //    the server (the .sql asset is not included in dist/).
        //    Create the table ourselves and set createTableIfMissing: false.
        `CREATE TABLE IF NOT EXISTS express_sessions (
          sid    VARCHAR NOT NULL COLLATE "default",
          sess   JSON    NOT NULL,
          expire TIMESTAMP(6) NOT NULL,
          CONSTRAINT express_sessions_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE
        )`,
        `CREATE INDEX IF NOT EXISTS IDX_express_sessions_expire ON express_sessions (expire)`,
      ]),
    "ensureAllTables",
  );
  logger.info("ensureAllTables: all application tables confirmed");
}

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
