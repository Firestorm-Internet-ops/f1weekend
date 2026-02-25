/**
 * Migration: adds guide_article column to experiences table.
 * Run once before seeding guide articles:
 *   npx tsx --env-file=.env scripts/migrate-add-guide-article.ts
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

  // Check if column already exists before adding
  const [rows] = await conn.execute<mysql.RowDataPacket[]>(`
    SELECT COUNT(*) as cnt
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'experiences' AND COLUMN_NAME = 'guide_article'
  `, [DB_NAME]);

  if ((rows[0] as { cnt: number }).cnt === 0) {
    await conn.execute(`ALTER TABLE experiences ADD COLUMN guide_article LONGTEXT DEFAULT NULL`);
    console.log('[migrate] Added guide_article column to experiences table');
  } else {
    console.log('[migrate] guide_article column already exists — skipping');
  }

  await conn.end();
  console.log('[migrate] Done');
}

main().catch((err) => {
  console.error('[migrate] Failed:', err);
  process.exit(1);
});
