// One-time migration: add file_data and mime_type to songs table
// Run with: node artifacts/api-server/migrate-songs.cjs
const { Client } = require('/home/runner/workspace/node_modules/.pnpm/pg@8.22.0/node_modules/pg');

const url = process.env.NEON_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim();
if (!url) { console.error('No DB URL found'); process.exit(1); }
console.log('Connecting to Neon...');

const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
client.connect()
  .then(async () => {
    console.log('Connected.');
    const { rows } = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'songs' ORDER BY ordinal_position`
    );
    console.log('Current columns:', rows.map(r => r.column_name).join(', '));
    await client.query(`ALTER TABLE songs ADD COLUMN IF NOT EXISTS file_data TEXT`);
    await client.query(`ALTER TABLE songs ADD COLUMN IF NOT EXISTS mime_type TEXT`);
    const { rows: after } = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'songs' ORDER BY ordinal_position`
    );
    console.log('Columns after migration:', after.map(r => r.column_name).join(', '));
    console.log('✅ Migration complete.');
  })
  .catch(e => { console.error('Failed:', e.message); process.exit(1); })
  .finally(() => client.end());
