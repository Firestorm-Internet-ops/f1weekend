/**
 * Migration: creates the schedule_entries table.
 * Run once:
 *   npx tsx --env-file=.env scripts/migrate-add-schedule.ts
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

const DB_HOST = process.env.DATABASE_HOST ?? 'localhost';
const DB_PORT = Number(process.env.DATABASE_PORT) || 3306;
const DB_USER = process.env.DATABASE_USER ?? 'root';
const DB_PASS = process.env.DATABASE_PASSWORD ?? '';
const DB_NAME = process.env.DATABASE_NAME ?? 'pitlane';

async function run() {
  const conn = await mysql.createConnection({
    host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASS, database: DB_NAME,
  });

  try {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS schedule_entries (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        race_id     INT,
        day_of_week ENUM('Thursday','Friday','Saturday','Sunday') NOT NULL,
        start_time  TIME NOT NULL,
        end_time    TIME NOT NULL,
        title       VARCHAR(255) NOT NULL,
        series      VARCHAR(100),
        series_key  VARCHAR(50),
        sort_order  INT,
        created_at  TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (race_id) REFERENCES races(id)
      )
    `);
    console.log('✅ schedule_entries table created (or already exists).');
  } finally {
    await conn.end();
  }
}

run().catch((err) => { console.error(err); process.exit(1); });
