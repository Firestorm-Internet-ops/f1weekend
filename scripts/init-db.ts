import 'dotenv/config';
import mysql from 'mysql2/promise';
import { execSync } from 'child_process';

const DB_HOST = process.env.DATABASE_HOST ?? 'localhost';
const DB_PORT = Number(process.env.DATABASE_PORT) || 3306;
const DB_USER = process.env.DATABASE_USER ?? 'root';
const DB_PASS = process.env.DATABASE_PASSWORD ?? '';
const DB_NAME = process.env.DATABASE_NAME ?? 'pitlane';

async function main() {
  // Step 1: Create database if it doesn't exist
  console.log(`[init] Connecting to MySQL at ${DB_HOST}:${DB_PORT}...`);
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASS,
  });

  await conn.execute(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  console.log(`[init] Database '${DB_NAME}' ready`);
  await conn.end();

  // Step 2: drizzle-kit push syncs schema.ts → MySQL tables
  console.log('[init] Running drizzle-kit push to sync tables from schema.ts...');
  execSync('npx drizzle-kit push --force', {
    stdio: 'inherit',
    cwd: process.cwd(),
  });

  console.log('[init] Done — database and all tables are ready');
}

main().catch((err) => {
  console.error('[init] Failed:', err);
  process.exit(1);
});
