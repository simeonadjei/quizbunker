import app, { ensureSessionTable, backfillTrials } from "./app";
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

Promise.all([ensureSessionTable(), backfillTrials()])
  .then(() => {
    // Log whether email is configured at startup
    logEmailConfigStatus();

    app.listen(port, (err) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }
      logger.info({ port }, "Server listening");
    });
  })
  .catch((err) => {
    logger.error({ err }, "Failed to ensure session table — aborting");
    process.exit(1);
  });
