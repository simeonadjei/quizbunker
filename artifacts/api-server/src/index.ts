import app, { ensureSessionTable, backfillTrials, ensureSongsColumns } from "./app";
import { logEmailConfigStatus } from "./lib/email";
import { logger } from "./lib/logger";

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
  ensureSongsColumns().catch((err: Error) =>
    logger.warn({ err: err.message }, "ensureSongsColumns failed — server will still start"),
  ),
]).then(() => {
  logEmailConfigStatus();

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
});
