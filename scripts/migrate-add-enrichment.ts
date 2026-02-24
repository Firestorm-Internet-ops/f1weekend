/**
 * Idempotent migration: adds enrichment columns to the experiences table.
 * Run once after deploying the schema change:
 *   npx tsx --env-file=.env scripts/migrate-add-enrichment.ts
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

const DB_HOST = process.env.DATABASE_HOST ?? 'localhost';
const DB_PORT = Number(process.env.DATABASE_PORT) || 3306;
const DB_USER = process.env.DATABASE_USER ?? 'root';
const DB_PASS = process.env.DATABASE_PASSWORD ?? '';
const DB_NAME = process.env.DATABASE_NAME ?? 'pitlane';

const COLUMNS: { name: string; definition: string }[] = [
  { name: 'highlights',        definition: 'JSON NULL' },
  { name: 'includes',          definition: 'JSON NULL' },
  { name: 'excludes',          definition: 'JSON NULL' },
  { name: 'important_info',    definition: 'TEXT NULL' },
  { name: 'photos',            definition: 'JSON NULL' },
  { name: 'reviews_snapshot',  definition: 'JSON NULL' },
  { name: 'f1_context',        definition: 'TEXT NULL' },
  { name: 'meeting_point',     definition: 'TEXT NULL' },
  { name: 'seo_keywords',      definition: 'JSON NULL' },
  { name: 'f1_windows_label',  definition: 'VARCHAR(255) NULL' },
];

async function main() {
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
  });

  console.log(`[migrate] Connected to ${DB_HOST}:${DB_PORT}/${DB_NAME}`);

  // Get existing columns
  const [rows] = await conn.execute<mysql.RowDataPacket[]>(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'experiences'`,
    [DB_NAME]
  );
  const existing = new Set(rows.map((r) => r.COLUMN_NAME as string));

  for (const col of COLUMNS) {
    if (existing.has(col.name)) {
      console.log(`[migrate] ✓ ${col.name} already exists — skipping`);
      continue;
    }
    await conn.execute(
      `ALTER TABLE experiences ADD COLUMN \`${col.name}\` ${col.definition}`
    );
    console.log(`[migrate] + added ${col.name}`);
  }

  await conn.end();
  console.log('[migrate] Done');
}

main().catch((err) => {
  console.error('[migrate] Failed:', err);
  process.exit(1);
});
