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

    // ── Neon keep-alive ───────────────────────────────────────────────────
    // Neon free tier suspends after 5 minutes of inactivity. A lightweight
    // SELECT 1 every 60 seconds prevents that without measurable overhead.
    // UptimeRobot (5-min pings to /api/healthz) acts as a secondary guard
    // that also keeps Render's free tier from spinning down.
    const KEEPALIVE_INTERVAL_MS = 60 * 1000; // 1 minute
    setInterval(async () => {
      try {
        const client = await pool.connect();
        await client.query("SELECT 1");
        client.release();
      } catch (err) {
        // Non-fatal — log and wait for the next tick
        logger.warn({ err: (err as Error).message }, "Neon keep-alive ping failed");
      }
    }, KEEPALIVE_INTERVAL_MS).unref(); // unref() so the interval never blocks graceful shutdown
  });
});
