/**
 * Migration: add 9 new tour-detail columns to experiences table.
 * Idempotent — checks INFORMATION_SCHEMA before each ALTER.
 * Run before enrich-from-gyg.ts:
 *   npx tsx --env-file=.env scripts/migrate-add-tour-detail.ts
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

const DB_HOST = process.env.DATABASE_HOST ?? 'localhost';
const DB_PORT = Number(process.env.DATABASE_PORT) || 3306;
const DB_USER = process.env.DATABASE_USER ?? 'root';
const DB_PASS = process.env.DATABASE_PASSWORD ?? '';
const DB_NAME = process.env.DATABASE_NAME ?? 'pitlane';

async function addColumnIfMissing(
  conn: mysql.Connection,
  dbName: string,
  colName: string,
  colDef: string
) {
  const [cols] = await conn.execute<mysql.RowDataPacket[]>(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'experiences' AND COLUMN_NAME = ?`,
    [dbName, colName]
  );
  if (cols.length === 0) {
    await conn.execute(`ALTER TABLE experiences ADD COLUMN ${colDef}`);
    console.log(`[migrate] Added column: ${colName}`);
  } else {
    console.log(`[migrate] Column already exists: ${colName}`);
  }
}

async function main() {
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
  });

  console.log(`[migrate] Connected to ${DB_HOST}:${DB_PORT}/${DB_NAME}`);

  await addColumnIfMissing(conn, DB_NAME, 'bestseller',
    'bestseller BOOLEAN NULL AFTER abstract');

  await addColumnIfMissing(conn, DB_NAME, 'original_price',
    'original_price DECIMAL(10,2) NULL AFTER price_label');

  await addColumnIfMissing(conn, DB_NAME, 'discount_pct',
    'discount_pct INT NULL AFTER original_price');

  await addColumnIfMissing(conn, DB_NAME, 'mobile_voucher',
    'mobile_voucher BOOLEAN NULL AFTER meeting_point');

  await addColumnIfMissing(conn, DB_NAME, 'instant_confirmation',
    'instant_confirmation BOOLEAN NULL AFTER mobile_voucher');

  await addColumnIfMissing(conn, DB_NAME, 'skip_the_line',
    'skip_the_line BOOLEAN NULL AFTER instant_confirmation');

  await addColumnIfMissing(conn, DB_NAME, 'has_pick_up',
    'has_pick_up BOOLEAN NULL AFTER skip_the_line');

  await addColumnIfMissing(conn, DB_NAME, 'options_snapshot',
    'options_snapshot JSON NULL AFTER reviews_snapshot');

  await addColumnIfMissing(conn, DB_NAME, 'gyg_categories',
    'gyg_categories JSON NULL AFTER photos');

  await conn.end();
  console.log('[migrate] Done');
}

main().catch((err) => {
  console.error('[migrate] Failed:', err);
  process.exit(1);
});
