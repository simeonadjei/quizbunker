import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// Prefer explicit Neon URL or DATABASE_URL secret when non-empty.
// Fall back to individual PG* env vars that Replit always injects —
// this handles cases where the DATABASE_URL secret was set to an empty string,
// which would otherwise shadow the runtime-managed value.
function buildConnectionString(): string {
  const explicit =
    process.env.NEON_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim();
  if (explicit) return explicit;

  // Construct from individual Replit-managed PG* vars
  const host = process.env.PGHOST?.trim();
  const db   = process.env.PGDATABASE?.trim();
  const user = process.env.PGUSER?.trim();
  const pass = process.env.PGPASSWORD?.trim();
  const port = process.env.PGPORT?.trim() ?? "5432";
  if (host && db) {
    const creds = user && pass ? `${user}:${encodeURIComponent(pass)}@` : user ? `${user}@` : "";
    return `postgresql://${creds}${host}:${port}/${db}`;
  }

  throw new Error(
    "No database connection found. Set NEON_DATABASE_URL (or DATABASE_URL) as a secret, or ensure PGHOST/PGDATABASE are available.",
  );
}

const connectionString = buildConnectionString();

// Neon and other cloud databases require SSL; local Replit postgres does not.
// Detect by whether the host looks like a cloud endpoint.
const isCloudDb =
  connectionString.includes(".neon.tech") ||
  connectionString.includes("amazonaws.com") ||
  connectionString.includes("supabase.co") ||
  connectionString.includes("render.com") ||
  connectionString.includes("sslmode=require");

export const pool = new Pool({
  connectionString,
  ...(isCloudDb ? { ssl: { rejectUnauthorized: false } } : {}),
});
export const db = drizzle(pool, { schema });

export * from "./schema";
