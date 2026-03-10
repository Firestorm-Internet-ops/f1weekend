import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { eq, inArray } from 'drizzle-orm';
import {
  races,
  sessions,
  experience_windows,
  schedule_entries,
} from '../src/lib/db/schema';

const CANDIDATE_SLUGS = ['miami-f1-2026', 'miami-2026'] as const;
const TARGET_SLUG = 'miami-f1-2026';

async function main() {
  const pool = mysql.createPool({
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT) || 3306,
    user: process.env.DATABASE_USER ?? 'root',
    password: process.env.DATABASE_PASSWORD ?? '',
    database: process.env.DATABASE_NAME ?? 'pitlane',
  });
  const db = drizzle(pool);

  const existing = await db
    .select({ id: races.id, slug: races.slug })
    .from(races)
    .where(inArray(races.slug, [...CANDIDATE_SLUGS]))
    .limit(1);

  let raceId: number;
  let raceSlug = TARGET_SLUG;

  if (existing[0]) {
    raceId = existing[0].id;
    raceSlug = existing[0].slug ?? TARGET_SLUG;
    await db
      .update(races)
      .set({
        slug: TARGET_SLUG,
        name: 'Formula 1 Crypto.com Miami Grand Prix 2026',
        season: 2026,
        round: 6,
        circuit_name: 'Miami International Autodrome',
        city: 'Miami',
        country: 'United States',
        country_code: 'US',
        circuit_lat: '25.958100',
        circuit_lng: '-80.238900',
        timezone: 'America/New_York',
        race_date: '2026-05-03',
      })
      .where(eq(races.id, raceId));
    console.log(`[race] updated id=${raceId} (slug ${raceSlug} -> ${TARGET_SLUG})`);
  } else {
    const result = await db.insert(races).values({
      slug: TARGET_SLUG,
      name: 'Formula 1 Crypto.com Miami Grand Prix 2026',
      season: 2026,
      round: 6,
      circuit_name: 'Miami International Autodrome',
      city: 'Miami',
      country: 'United States',
      country_code: 'US',
      circuit_lat: '25.958100',
      circuit_lng: '-80.238900',
      timezone: 'America/New_York',
      race_date: '2026-05-03',
    });
    raceId = (result[0] as { insertId: number }).insertId;
    console.log(`[race] inserted id=${raceId} slug=${TARGET_SLUG}`);
  }

  await db.delete(sessions).where(eq(sessions.race_id, raceId));
  await db.insert(sessions).values([
    {
      race_id: raceId,
      name: 'Practice 1',
      short_name: 'FP1',
      day_of_week: 'Friday',
      start_time: '12:30:00',
      end_time: '13:30:00',
      session_type: 'practice',
    },
    {
      race_id: raceId,
      name: 'Sprint Qualifying',
      short_name: 'SQ',
      day_of_week: 'Friday',
      start_time: '16:30:00',
      end_time: '17:14:00',
      session_type: 'qualifying',
    },
    {
      race_id: raceId,
      name: 'Sprint',
      short_name: 'SPR',
      day_of_week: 'Saturday',
      start_time: '12:00:00',
      end_time: '13:00:00',
      session_type: 'sprint',
    },
    {
      race_id: raceId,
      name: 'Qualifying',
      short_name: 'Q',
      day_of_week: 'Saturday',
      start_time: '16:00:00',
      end_time: '17:00:00',
      session_type: 'qualifying',
    },
    {
      race_id: raceId,
      name: 'Race',
      short_name: 'R',
      day_of_week: 'Sunday',
      start_time: '16:00:00',
      end_time: '18:00:00',
      session_type: 'race',
    },
  ]);
  console.log('[sessions] inserted 5 rows');

  await db.delete(experience_windows).where(eq(experience_windows.race_id, raceId));
  await db.insert(experience_windows).values([
    {
      race_id: raceId,
      slug: 'fri-morning',
      label: 'Friday Morning — Before FP1',
      day_of_week: 'Friday',
      start_time: '08:00:00',
      end_time: '12:15:00',
      max_duration_hours: '4.0',
      description: 'Best for short city tours and brunch before Practice 1.',
      sort_order: 1,
    },
    {
      race_id: raceId,
      slug: 'fri-gap',
      label: 'Friday Gap — Between FP1 and Sprint Qualifying',
      day_of_week: 'Friday',
      start_time: '13:30:00',
      end_time: '16:15:00',
      max_duration_hours: '2.5',
      description: 'Good slot for nearby activities that end before Sprint Qualifying.',
      sort_order: 2,
    },
    {
      race_id: raceId,
      slug: 'fri-evening',
      label: 'Friday Evening — After Sprint Qualifying',
      day_of_week: 'Friday',
      start_time: '17:30:00',
      end_time: '23:00:00',
      max_duration_hours: '5.0',
      description: 'Dinner and nightlife window after on-track action.',
      sort_order: 3,
    },
    {
      race_id: raceId,
      slug: 'sat-morning',
      label: 'Saturday Morning — Before Sprint',
      day_of_week: 'Saturday',
      start_time: '08:00:00',
      end_time: '11:45:00',
      max_duration_hours: '3.5',
      description: 'Short activity slot before Sprint.',
      sort_order: 4,
    },
    {
      race_id: raceId,
      slug: 'sat-gap',
      label: 'Saturday Gap — Between Sprint and Qualifying',
      day_of_week: 'Saturday',
      start_time: '13:00:00',
      end_time: '15:45:00',
      max_duration_hours: '2.5',
      description: 'Ideal for compact experiences near the circuit/city core.',
      sort_order: 5,
    },
    {
      race_id: raceId,
      slug: 'sat-evening',
      label: 'Saturday Evening — After Qualifying',
      day_of_week: 'Saturday',
      start_time: '17:00:00',
      end_time: '23:00:00',
      max_duration_hours: '5.5',
      description: 'Prime evening slot for food and nightlife.',
      sort_order: 6,
    },
    {
      race_id: raceId,
      slug: 'sun-morning',
      label: 'Sunday Morning — Before Race',
      day_of_week: 'Sunday',
      start_time: '08:00:00',
      end_time: '15:15:00',
      max_duration_hours: '6.5',
      description: 'Long pre-race window for one headline experience.',
      sort_order: 7,
    },
  ]);
  console.log('[experience_windows] inserted 7 rows');

  await db.delete(schedule_entries).where(eq(schedule_entries.race_id, raceId));
  await db.insert(schedule_entries).values([
    {
      race_id: raceId,
      day_of_week: 'Friday',
      start_time: '12:30:00',
      end_time: '13:30:00',
      title: 'Practice 1',
      series: 'F1',
      series_key: 'f1',
      sort_order: 1,
    },
    {
      race_id: raceId,
      day_of_week: 'Friday',
      start_time: '16:30:00',
      end_time: '17:14:00',
      title: 'Sprint Qualifying',
      series: 'F1',
      series_key: 'f1',
      sort_order: 2,
    },
    {
      race_id: raceId,
      day_of_week: 'Saturday',
      start_time: '12:00:00',
      end_time: '13:00:00',
      title: 'Sprint',
      series: 'F1',
      series_key: 'f1',
      sort_order: 3,
    },
    {
      race_id: raceId,
      day_of_week: 'Saturday',
      start_time: '16:00:00',
      end_time: '17:00:00',
      title: 'Qualifying',
      series: 'F1',
      series_key: 'f1',
      sort_order: 4,
    },
    {
      race_id: raceId,
      day_of_week: 'Sunday',
      start_time: '16:00:00',
      end_time: '18:00:00',
      title: 'Race',
      series: 'F1',
      series_key: 'f1',
      sort_order: 5,
    },
  ]);
  console.log('[schedule_entries] inserted 5 rows');

  await pool.end();
  console.log('\nDone: Miami 2026 schedule patched in pitlane.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
