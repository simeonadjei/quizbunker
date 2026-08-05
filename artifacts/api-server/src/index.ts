import app, { ensureSessionTable, backfillTrials, ensureSongsColumns } from "./app";
import { ensureUsersColumns } from "./lib/db-migrations";
import { logEmailConfigStatus } from "./lib/email";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Run DB startup tasks but never let them abort the server.
// The sessions table almost always already exists; if the DB is temporarily
// unavailable (e.g. quota exceeded on the free tier) we still want the
// server to accept requests — most endpoints will degrade gracefully.
Promise.all([
  ensureSessionTable().catch((err: Error) =>
    logger.warn({ err: err.message }, "ensureSessionTable failed — server will still start"),
  ),
  backfillTrials().catch((err: Error) =>
    logger.warn({ err: err.message }, "backfillTrials failed — server will still start"),
  ),
  // Songs columns migration — warn but never crash the server.
  ensureSongsColumns().catch((err: Error) =>
    logger.warn({ err: err.message }, "ensureSongsColumns failed — server will still start"),
  ),
  // Users columns migration — adds columns added after initial deploy.
  // Fixes "column does not exist" errors on login/register in production.
  ensureUsersColumns().catch((err: Error) =>
    logger.warn({ err: err.message }, "ensureUsersColumns failed — server will still start"),
  ),
]).then(() => {
  logEmailConfigStatus();

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");

    // NOTE: The internal Neon keep-alive cronjob has been intentionally removed.
    // Running SELECT 1 every 60 seconds consumed Neon's 5 GB/month network
    // transfer quota in under 5 days (1,440 queries/day × proxy overhead).
    // Neon's cold-start wake-up takes ~1–2 seconds on first real request, which
    // is acceptable. UptimeRobot pings /api/healthz every 5 minutes to keep
    // Render's free tier from spinning down — that is sufficient.
  });
});
