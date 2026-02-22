import mysql from 'mysql2/promise';
import { execSync } from 'child_process';

const DB_HOST = process.env.DATABASE_HOST ?? 'localhost';
const DB_PORT = Number(process.env.DATABASE_PORT) || 3306;
const DB_USER = process.env.DATABASE_USER ?? 'root';
const DB_PASS = process.env.DATABASE_PASSWORD ?? '';
const DB_NAME = process.env.DATABASE_NAME ?? 'pitlane';

let initialized = false;

/**
 * Auto-initialize on server startup:
 * 1. Creates the database if it doesn't exist
 * 2. Runs drizzle-kit push to sync tables from schema.ts + drizzle.config.ts
 *
 * Safe to call multiple times — only runs once.
 */
export async function initDatabase(): Promise<void> {
  if (initialized) return;

  try {
    // Connect without a database to create it if missing
    const conn = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASS,
    });

    await conn.execute(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`[db] Database '${DB_NAME}' ready`);
    await conn.end();

    // Sync schema.ts → MySQL tables via drizzle-kit push
    console.log('[db] Syncing tables from schema.ts...');
    execSync('npx drizzle-kit push --force', {
      stdio: 'pipe',
      cwd: process.cwd(),
    });
    console.log('[db] All tables synced from schema.ts');

    initialized = true;
  } catch (error) {
    console.error('[db] Initialization failed:', error);
    throw error;
  }
}
