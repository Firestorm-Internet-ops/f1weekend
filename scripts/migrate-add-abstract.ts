/**
 * Migration: add `abstract` column to experiences table.
 * Run before enrich-from-gyg.ts:
 *   npx tsx --env-file=.env scripts/migrate-add-abstract.ts
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

const DB_HOST = process.env.DATABASE_HOST ?? 'localhost';
const DB_PORT = Number(process.env.DATABASE_PORT) || 3306;
const DB_USER = process.env.DATABASE_USER ?? 'root';
const DB_PASS = process.env.DATABASE_PASSWORD ?? '';
const DB_NAME = process.env.DATABASE_NAME ?? 'pitlane';

async function main() {
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
  });

  console.log(`[migrate] Connected to ${DB_HOST}:${DB_PORT}/${DB_NAME}`);

  const [cols] = await conn.execute<mysql.RowDataPacket[]>(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'experiences' AND COLUMN_NAME = 'abstract'`,
    [DB_NAME]
  );

  if (cols.length > 0) {
    console.log('[migrate] abstract column already exists — skipping');
  } else {
    await conn.execute(`
      ALTER TABLE experiences
      ADD COLUMN abstract TEXT NULL
        AFTER short_description
    `);
    console.log('[migrate] abstract column added');
  }

  await conn.end();
  console.log('[migrate] Done');
}

main().catch((err) => {
  console.error('[migrate] Failed:', err);
  process.exit(1);
});
