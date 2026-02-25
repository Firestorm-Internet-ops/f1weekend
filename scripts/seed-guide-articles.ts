/**
 * Seeds guide_article content into the experiences table.
 * Articles are read from scripts/output/guide-articles/<slug>.md
 *
 * Run:
 *   npx tsx --env-file=.env scripts/seed-guide-articles.ts
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_HOST = process.env.DATABASE_HOST ?? 'localhost';
const DB_PORT = Number(process.env.DATABASE_PORT) || 3306;
const DB_USER = process.env.DATABASE_USER ?? 'root';
const DB_PASS = process.env.DATABASE_PASSWORD ?? '';
const DB_NAME = process.env.DATABASE_NAME ?? 'pitlane';

const ARTICLES_DIR = join(__dirname, 'output/guide-articles');

// Slugs to seed (add more as articles are generated)
const SLUGS = [
  'melbourne-laneways-hidden-bars-food-tour',
  'great-ocean-road-12-apostles-day-trip',
  'phillip-island-penguin-parade-tour',
  'hot-air-balloon-over-melbourne-at-sunrise',
  'queen-victoria-market-foodie-tour',
];

async function main() {
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    ssl: DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : undefined,
  });

  console.log(`[seed] Connected to ${DB_HOST}:${DB_PORT}/${DB_NAME}`);

  let seeded = 0;
  let skipped = 0;

  for (const slug of SLUGS) {
    const filePath = join(ARTICLES_DIR, `${slug}.md`);

    if (!existsSync(filePath)) {
      console.log(`[seed] SKIP ${slug} — file not found`);
      skipped++;
      continue;
    }

    const content = readFileSync(filePath, 'utf-8');

    const [result] = await conn.execute<mysql.ResultSetHeader>(
      `UPDATE experiences SET guide_article = ? WHERE slug = ?`,
      [content, slug]
    );

    if (result.affectedRows === 0) {
      console.log(`[seed] WARN ${slug} — no matching experience found in DB`);
      skipped++;
    } else {
      console.log(`[seed] OK   ${slug} (${content.length} chars)`);
      seeded++;
    }
  }

  await conn.end();
  console.log(`\n[seed] Done — ${seeded} seeded, ${skipped} skipped`);
}

main().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
