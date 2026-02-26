import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { races, sessions, experience_windows } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Seed script for the 2026 Chinese Grand Prix (Shanghai)
 *
 * Official schedule: FORMULA 1 CHINESE GRAND PRIX 2026
 * Dates: March 13-15, 2026 (Friday–Sunday)
 * Circuit: Shanghai International Circuit
 * Timezone: CST (UTC+8)
 *
 * F1 Sessions (all CST):
 *   Friday:   FP1 11:30–12:30, FP2 15:00–16:00
 *   Saturday: FP3 11:30–12:30, Qualifying 15:00–16:00
 *   Sunday:   Race 15:00–17:00
 *
 * Experience windows = gaps where fans can leave the circuit
 * to explore Shanghai (food, culture, adventure, etc.)
 *
 * Run: npx tsx scripts/seed-shanghai-race.ts
 */

async function seed() {
  const pool = mysql.createPool({
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT) || 3306,
    user: process.env.DATABASE_USER ?? 'root',
    password: process.env.DATABASE_PASSWORD ?? '12345678',
    database: process.env.DATABASE_NAME ?? 'pitlane',
  });

  const db = drizzle(pool);

  console.log('[seed] Connected to database');

  // --- 1. Check if race already exists ---
  const existing = await db.select().from(races).where(eq(races.slug, 'shanghai-2026'));
  if (existing.length > 0) {
    console.log('[seed] Shanghai 2026 already seeded (race id:', existing[0].id, ')');
    console.log('[seed] To re-seed, delete existing data first:');
    console.log('  DELETE FROM experience_windows WHERE race_id =', existing[0].id);
    console.log('  DELETE FROM sessions WHERE race_id =', existing[0].id);
    console.log('  DELETE FROM races WHERE id =', existing[0].id);
    await pool.end();
    return;
  }

  // --- 2. Insert race ---
  const [raceResult] = await db.insert(races).values({
    slug: 'shanghai-2026',
    name: 'Chinese Grand Prix',
    season: 2026,
    round: 3,
    circuit_name: 'Shanghai International Circuit',
    city: 'Shanghai',
    country: 'China',
    country_code: 'CN',
    circuit_lat: '31.338500',
    circuit_lng: '121.220000',
    timezone: 'Asia/Shanghai',
    race_date: new Date('2026-03-15'),
  });

  const raceId = raceResult.insertId;
  console.log('[seed] Inserted race: Chinese Grand Prix 2026 (id:', raceId, ')');

  // --- 3. Insert F1 sessions ---
  // Official 2026 schedule times (local CST, UTC+8)
  const sessionData = [
    {
      name: 'Free Practice 1',
      short_name: 'FP1',
      day_of_week: 'Friday' as const,
      start_time: '11:30',
      end_time: '12:30',
      session_type: 'practice' as const,
    },
    {
      name: 'Free Practice 2',
      short_name: 'FP2',
      day_of_week: 'Friday' as const,
      start_time: '15:00',
      end_time: '16:00',
      session_type: 'practice' as const,
    },
    {
      name: 'Free Practice 3',
      short_name: 'FP3',
      day_of_week: 'Saturday' as const,
      start_time: '11:30',
      end_time: '12:30',
      session_type: 'practice' as const,
    },
    {
      name: 'Qualifying',
      short_name: 'QUALI',
      day_of_week: 'Saturday' as const,
      start_time: '15:00',
      end_time: '16:00',
      session_type: 'qualifying' as const,
    },
    {
      name: 'Race',
      short_name: 'RACE',
      day_of_week: 'Sunday' as const,
      start_time: '15:00',
      end_time: '17:00',
      session_type: 'race' as const,
    },
  ];

  for (const s of sessionData) {
    await db.insert(sessions).values({
      race_id: raceId,
      ...s,
    });
  }
  console.log('[seed] Inserted', sessionData.length, 'F1 sessions');

  // --- 4. Insert experience windows ---
  // Friday: FP1 11:30-12:30, FP2 15:00-16:00
  //   Morning free until ~11:00 (allow 30min travel to circuit).
  //   Gap between FP1 end (12:30) and FP2 start (15:00) — 2hrs,
  //   but support races fill some of this. Realistic city excursion ~1.5hrs.
  //   Evening free after 16:00.
  //
  // Saturday: FP3 11:30-12:30, Qualifying 15:00-16:00.
  //   Same structure as Friday.
  //
  // Sunday: Race 15:00-17:00.
  //   Full morning free for city exploration. Evening post-race celebrations.
  const windowData = [
    {
      slug: 'fri-morning',
      label: 'Friday Morning — Before FP1',
      day_of_week: 'Friday' as const,
      start_time: '08:00',
      end_time: '11:30',
      max_duration_hours: '3.5',
      description: 'Free morning before the first on-track action. Hit the Bund, grab a dim sum breakfast, or explore Yu Garden before heading to the circuit.',
      sort_order: 1,
    },
    {
      slug: 'fri-gap',
      label: 'Friday Afternoon — Between Sessions',
      day_of_week: 'Friday' as const,
      start_time: '13:00',
      end_time: '15:00',
      max_duration_hours: '1.5',
      description: 'Quick break between FP1 and FP2. Grab nearby street food, duck into a tea house, or explore the local market.',
      sort_order: 2,
    },
    {
      slug: 'fri-evening',
      label: 'Friday Evening — After FP2',
      day_of_week: 'Friday' as const,
      start_time: '16:00',
      end_time: '23:00',
      max_duration_hours: '4.0',
      description: 'Sessions done for the day. Head to the Huangpu riverfront, the French Concession bars, or take a night cruise on the river.',
      sort_order: 3,
    },
    {
      slug: 'sat-morning',
      label: 'Saturday Morning — Before FP3',
      day_of_week: 'Saturday' as const,
      start_time: '08:00',
      end_time: '11:30',
      max_duration_hours: '3.5',
      description: 'Morning free before FP3. Explore Old Town, join a morning food tour, or take a walk along the Bund riverfront.',
      sort_order: 4,
    },
    {
      slug: 'sat-gap',
      label: 'Saturday Afternoon — Between Sessions',
      day_of_week: 'Saturday' as const,
      start_time: '13:00',
      end_time: '15:00',
      max_duration_hours: '1.5',
      description: 'Between FP3 and Qualifying. Short cultural stop, a traditional tea ceremony, or a quick snack run.',
      sort_order: 5,
    },
    {
      slug: 'sat-evening',
      label: 'Saturday Evening — After Qualifying',
      day_of_week: 'Saturday' as const,
      start_time: '16:00',
      end_time: '23:00',
      max_duration_hours: '4.0',
      description: 'Grid is set — time to celebrate. Acrobatics show, pub crawl through the French Concession, or a skyline dinner.',
      sort_order: 6,
    },
    {
      slug: 'sun-morning',
      label: 'Sunday Morning — Race Day Exploration',
      day_of_week: 'Sunday' as const,
      start_time: '08:00',
      end_time: '15:00',
      max_duration_hours: '6.0',
      description: 'Race day morning — full day before the 15:00 start. Perfect for a Zhujiajiao water town day trip or a comprehensive city tour.',
      sort_order: 7,
    },
    {
      slug: 'post-race',
      label: 'Sunday Evening — After the Chequered Flag',
      day_of_week: 'Sunday' as const,
      start_time: '17:00',
      end_time: '23:00',
      max_duration_hours: '3.0',
      description: 'After the chequered flag. Celebrate with a night river cruise, bar hopping in the French Concession, or a final Shanghai dinner.',
      sort_order: 8,
    },
  ];

  for (const w of windowData) {
    await db.insert(experience_windows).values({
      race_id: raceId,
      ...w,
    });
  }
  console.log('[seed] Inserted', windowData.length, 'experience windows');

  // --- Done ---
  console.log('[seed] Shanghai 2026 seeded successfully!');
  console.log('[seed] Summary: 1 race, 5 sessions, 8 experience windows');

  await pool.end();
}

seed().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
