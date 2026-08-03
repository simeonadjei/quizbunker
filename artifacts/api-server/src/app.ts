import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import pgSession from "connect-pg-simple";
import path from "path";
import fs from "fs";
import router from "./routes";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";
export { ensureSongsColumns } from "./lib/db-migrations";

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

const corsOptions: cors.CorsOptions = {
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
};

// cors() automatically handles OPTIONS preflight (preflightContinue defaults to
// false), so credentials and headers are returned correctly for multipart
// uploads from cross-origin Render deployments.
app.use(cors(corsOptions));

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

const PgStore = pgSession(session);

// Sessions are stored in PostgreSQL so they survive server restarts and
// redeployments.  connect-pg-simple creates the `session` table automatically
// the first time the store is used (createTableIfMissing: true).
const sessionStore = new PgStore({
  pool,
  tableName: "express_sessions",
  createTableIfMissing: true,
  // Prune expired sessions every hour
  pruneSessionInterval: 60 * 60,
});

// ensureSessionTable is kept as a no-op so index.ts can still call it safely.
export async function ensureSessionTable(): Promise<void> {
  // no-op: connect-pg-simple creates the sessions table automatically
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
    store: sessionStore,
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

// Public diagnostic route — must be registered BEFORE the session middleware
// so a DB outage (session store failure) never blocks this endpoint.
app.get("/api/admin/auth-status", (_req, res) => {
  res.json({
    hasAdminPassword: !!process.env.ADMIN_PASSWORD,
    hasAdminSecretPath: !!process.env.ADMIN_SECRET_PATH,
    hasAdminEmail: !!process.env.ADMIN_EMAIL,
    adminEmail: process.env.ADMIN_EMAIL ?? null,
    note: "Values are not shown. At least one of hasAdminPassword or hasAdminSecretPath must be true for login to work.",
  });
});

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
