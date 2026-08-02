/**
 * One-time migration: add file_data and mime_type columns to the songs table.
 * Safe to run multiple times (uses ADD COLUMN IF NOT EXISTS).
 * Run with: pnpm --filter @workspace/api-server run migrate-songs
 */
import pg from "pg";

const { Client } = pg;

const url =
  process.env.NEON_DATABASE_URL?.trim() ||
  process.env.DATABASE_URL?.trim();

if (!url) {
  console.error("ERROR: No database URL (NEON_DATABASE_URL or DATABASE_URL)");
  process.exit(1);
}

const client = new Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await client.connect();
  console.log("Connected.");

  const { rows } = await client.query<{ column_name: string }>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'songs' ORDER BY ordinal_position`
  );
  console.log("Existing columns:", rows.map(r => r.column_name).join(", "));

  await client.query(`ALTER TABLE songs ADD COLUMN IF NOT EXISTS file_data TEXT`);
  await client.query(`ALTER TABLE songs ADD COLUMN IF NOT EXISTS mime_type TEXT`);
  console.log("✅ Migration complete — file_data and mime_type columns ensured.");
}

run()
  .catch(e => { console.error("Migration failed:", e.message); process.exit(1); })
  .finally(() => client.end());
