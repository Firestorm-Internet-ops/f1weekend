import 'dotenv/config';
import mysql from 'mysql2/promise';

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT) || 3306,
    user: process.env.DATABASE_USER ?? 'root',
    password: process.env.DATABASE_PASSWORD ?? '',
    database: process.env.DATABASE_NAME ?? 'pitlane',
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
  });

  const [rows] = await conn.execute(
    `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'sessions'
       AND COLUMN_NAME = 'session_type'`
  ) as any[];

  const current: string = rows[0]?.COLUMN_TYPE ?? '';
  console.log('Current enum:', current);

  if (current.includes('support') && current.includes('event')) {
    console.log('Already up to date — no change needed');
  } else {
    await conn.execute(
      `ALTER TABLE sessions MODIFY COLUMN session_type
       ENUM('practice','qualifying','sprint','race','support','event')`
    );
    console.log('session_type enum updated successfully');
  }

  await conn.end();
}

run().catch((err) => { console.error(err); process.exit(1); });
