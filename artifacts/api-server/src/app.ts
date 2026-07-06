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

// Strict CORS: only allow the Replit preview domain and localhost
const allowedOrigins = new Set(
  [
    process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null,
    ...(process.env.REPLIT_DOMAINS ? process.env.REPLIT_DOMAINS.split(",").map((d) => `https://${d.trim()}`) : []),
    "http://localhost:3000",
    "http://localhost:5173",
  ].filter(Boolean) as string[],
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server calls (no origin) and explicitly allowed origins
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
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
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
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

export default app;
