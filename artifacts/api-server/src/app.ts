import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import path from "path";
import fs from "fs";
import router from "./routes";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";

// Session type augmentation
import "./lib/session.d.ts";

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}

const app: Express = express();

// Trust the first hop in Replit's reverse-proxy chain so express-rate-limit
// reads the real client IP from X-Forwarded-For rather than the proxy address.
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// CORS: allow Replit preview domains, explicit FRONTEND_URL overrides,
// any *.onrender.com deployment, and localhost for dev.
const allowedOrigins = new Set(
  [
    process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null,
    ...(process.env.REPLIT_DOMAINS ? process.env.REPLIT_DOMAINS.split(",").map((d) => `https://${d.trim()}`) : []),
    // Explicit override — comma-separated list of allowed frontend origins
    ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",").map((d) => d.trim()) : []),
    "http://localhost:3000",
    "http://localhost:5173",
  ].filter(Boolean) as string[],
);

function isOriginAllowed(origin: string): boolean {
  if (allowedOrigins.has(origin)) return true;
  // Allow any *.onrender.com origin (Render deployments)
  try {
    const url = new URL(origin);
    if (url.hostname.endsWith(".onrender.com") && url.protocol === "https:") return true;
  } catch {}
  return false;
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server calls (no Origin header) and approved origins
      if (!origin || isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        logger.warn({ origin }, "CORS: blocked request from unlisted origin");
        callback(new Error(`CORS: origin '${origin}' is not allowed`));
      }
    },
    credentials: true,
  }),
);

// Capture raw body for Paystack webhook signature verification
app.use(
  express.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
      (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const PgSession = connectPgSimple(session);

// connect-pg-simple reads a bundled table.sql file to create the sessions
// table, but esbuild does not include .sql assets in the output bundle.
// We create the table ourselves with inline SQL so the deployed build works.
export async function ensureSessionTable(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS "user_sessions" (
        "sid"    varchar      NOT NULL COLLATE "default",
        "sess"   json         NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
      );
      CREATE INDEX IF NOT EXISTS "IDX_user_sessions_expire"
        ON "user_sessions" ("expire");
    `);
  } finally {
    client.release();
  }
}

/**
 * Backfill 2-day trials for every user who has never had a subscription
 * (plan = 'none') or whose trial has already expired.
 * Safe to run on every startup — won't touch active trials or paid plans.
 */
export async function backfillTrials(): Promise<void> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      UPDATE users
      SET subscription_plan = 'trial',
          subscription_end   = NOW() + INTERVAL '2 days'
      WHERE subscription_plan = 'none'
         OR (subscription_plan = 'trial' AND subscription_end < NOW())
    `);
    if (result.rowCount && result.rowCount > 0) {
      logger.info({ count: result.rowCount }, "Backfilled 2-day trials for existing users");
    }
  } finally {
    client.release();
  }
}

app.use(
  session({
    store: new PgSession({
      pool,
      // createTableIfMissing intentionally omitted — we handle it above
      tableName: "user_sessions",
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      // Replit always terminates TLS at its proxy, so cookies must be Secure
      // even in NODE_ENV=development.  Fall back to false only when running
      // on a plain-HTTP local machine (no REPL_ID in the environment).
      secure: process.env.NODE_ENV === "production" || !!process.env.REPL_ID,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: (process.env.NODE_ENV === "production" || !!process.env.REPL_ID) ? "none" : "lax",
    },
  }),
);

// Serve uploaded songs statically at /api/uploads/songs
const songsDir = path.join(process.cwd(), "uploads", "songs");
if (!fs.existsSync(songsDir)) {
  fs.mkdirSync(songsDir, { recursive: true });
}
app.use("/api/uploads/songs", express.static(songsDir));

app.use("/api", router);

// ── Global JSON error handler ─────────────────────────────────────────────────
// Must have 4 parameters so Express treats it as an error handler.
// This ensures every unhandled error returns JSON, never Express's default HTML.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const isCors = err.message.startsWith("CORS:");
  const status = isCors ? 403 : 500;
  logger.error({ err: err.message, stack: err.stack }, "Unhandled error");
  return res.status(status).json({ error: isCors ? err.message : "Internal server error" });
});

export default app;
