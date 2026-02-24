/**
 * Migration: adds lat, lng, languages columns to experiences table.
 * Run once before re-enriching:
 *   npx tsx --env-file=.env scripts/migrate-add-geodata.ts
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

  await conn.execute(`ALTER TABLE experiences
    ADD COLUMN IF NOT EXISTS lat DECIMAL(10,7) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS lng DECIMAL(10,7) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS languages JSON DEFAULT NULL`);

  console.log('[migrate] Added lat, lng, languages columns to experiences table');

  await conn.end();
  console.log('[migrate] Done');
}

main().catch((err) => {
  console.error('[migrate] Failed:', err);
  process.exit(1);
});
