import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { races, experience_windows } from '../lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Idempotent patch: inserts the `thu-full` experience window for melbourne-2026
 * if it doesn't already exist in the DB.
 *
 * Run: npx tsx src/data/patch-add-thu-window.ts
 */

async function patch() {
  const pool = mysql.createPool({
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT) || 3306,
    user: process.env.DATABASE_USER ?? 'root',
    password: process.env.DATABASE_PASSWORD ?? '',
    database: process.env.DATABASE_NAME ?? 'pitlane',
  });

  const db = drizzle(pool);

  // 1. Find the race
  const [race] = await db.select().from(races).where(eq(races.slug, 'melbourne-2026'));
  if (!race) {
    console.error('[patch] melbourne-2026 race not found — run seed-race.ts first');
    await pool.end();
    process.exit(1);
  }

  // 2. Check if thu-full already exists
  const existing = await db
    .select()
    .from(experience_windows)
    .where(and(eq(experience_windows.race_id, race.id), eq(experience_windows.slug, 'thu-full')));

  if (existing.length > 0) {
    console.log('[patch] thu-full already exists for race', race.id, '— nothing to do');
    await pool.end();
    return;
  }

  // 3. Insert the missing window
  await db.insert(experience_windows).values({
    race_id: race.id,
    slug: 'thu-full',
    label: 'Thursday — Full Day to Explore',
    day_of_week: 'Thursday',
    start_time: '08:00',
    end_time: '22:00',
    max_duration_hours: '14.0',
    description:
      'No F1 on-track Thursday. Explore Melbourne — hit the laneways, coffee scene, street art, or take a day trip along the Great Ocean Road.',
    sort_order: 1,
  });

  console.log('[patch] Inserted thu-full for race', race.id);
  await pool.end();
}

patch().catch((err) => {
  console.error('[patch] Failed:', err);
  process.exit(1);
});
