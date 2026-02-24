/**
 * Migration: adds distance_km, neighborhood, travel_mins columns to experiences table.
 * Run once:
 *   npx tsx --env-file=.env scripts/migrate-add-location-fields.ts
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

const DB_HOST = process.env.DATABASE_HOST ?? 'localhost';
const DB_PORT = Number(process.env.DATABASE_PORT) || 3306;
const DB_USER = process.env.DATABASE_USER ?? 'root';
const DB_PASS = process.env.DATABASE_PASSWORD ?? '';
const DB_NAME = process.env.DATABASE_NAME ?? 'pitlane';

const COLUMNS: { name: string; definition: string }[] = [
  { name: 'distance_km',  definition: 'DECIMAL(5,1) DEFAULT NULL' },
  { name: 'neighborhood', definition: 'VARCHAR(100) DEFAULT NULL' },
  { name: 'travel_mins',  definition: 'INT DEFAULT NULL' },
];

async function run() {
  const conn = await mysql.createConnection({
    host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASS, database: DB_NAME,
  });

  try {
    for (const col of COLUMNS) {
      const [rows] = await conn.execute<mysql.RowDataPacket[]>(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'experiences' AND COLUMN_NAME = ?`,
        [DB_NAME, col.name]
      );
      if (rows.length > 0) {
        console.log(`  ✓ Column '${col.name}' already exists — skipping`);
      } else {
        await conn.execute(`ALTER TABLE experiences ADD COLUMN ${col.name} ${col.definition}`);
        console.log(`  ✅ Added column '${col.name}'`);
      }
    }
    console.log('Migration complete.');
  } finally {
    await conn.end();
  }
}

run().catch((err) => { console.error(err); process.exit(1); });
