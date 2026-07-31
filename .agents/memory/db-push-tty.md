---
name: DB push TTY requirement
description: drizzle-kit push requires a TTY terminal even with --force; use executeSql for non-interactive schema changes
---

`drizzle-kit push --force` still hits interactive prompts when the DB schema has never-seen tables and needs conflict resolution. The shell tool doesn't have a TTY, so it always fails with "Interactive prompts require a TTY terminal."

**Why:** drizzle-kit's push command calls promptNamedWithSchemasConflict internally even with --force, and that function requires stdin/stdout to be a TTY.

**How to apply:** For any new table creation from shell, use `executeSql({ sqlQuery: "CREATE TABLE IF NOT EXISTS ..." })` instead. The `push-force` script in `lib/db/package.json` exists but won't work non-interactively. This DB is a Neon Postgres DB (NEON_DATABASE_URL).
