import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { races, sessions, experience_windows } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Seed script for the 2026 Australian Grand Prix (Melbourne)
 *
 * Official schedule: FORMULA 1 QATAR AIRWAYS AUSTRALIAN GRAND PRIX 2026
 * Dates: March 5-8, 2026 (Thursday–Sunday)
 * Circuit: Albert Park Circuit, Melbourne
 * Timezone: AEDT (UTC+11)
 *
 * F1 Sessions (the ones fans plan around):
 *   Friday:   FP1 12:30–13:30, FP2 16:00–17:00
 *   Saturday: FP3 12:30–13:30, Qualifying 16:00–17:00
 *   Sunday:   Race 15:00–17:00
 *
 * Support programme (not seeded as sessions, but informs experience windows):
 *   Porsche Carrera Cup Australia, Supercars Championship,
 *   Formula 2, Formula 3, F1 Experiences Pit Lane Walk,
 *   Press conferences, Promoter activities
 *
 * Experience windows = gaps where fans can leave the circuit
 * to explore Melbourne (food, culture, adventure, etc.)
 *
 * Run: npx tsx src/data/seed-race.ts
 */

async function seed() {
  const pool = mysql.createPool({
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT) || 3306,
    user: process.env.DATABASE_USER ?? 'root',
    password: process.env.DATABASE_PASSWORD ?? '',
    database: process.env.DATABASE_NAME ?? 'pitlane',
  });

  const db = drizzle(pool);

  console.log('[seed] Connected to database');

  // --- 1. Check if race already exists ---
  const existing = await db.select().from(races).where(eq(races.slug, 'melbourne-2026'));
  if (existing.length > 0) {
    console.log('[seed] Melbourne 2026 already seeded (race id:', existing[0].id, ')');
    console.log('[seed] To re-seed, delete existing data first:');
    console.log('  DELETE FROM experience_windows WHERE race_id =', existing[0].id);
    console.log('  DELETE FROM sessions WHERE race_id =', existing[0].id);
    console.log('  DELETE FROM races WHERE id =', existing[0].id);
    await pool.end();
    return;
  }

  // --- 2. Insert race ---
  const [raceResult] = await db.insert(races).values({
    slug: 'melbourne-2026',
    name: 'Australian Grand Prix',
    season: 2026,
    round: 1,
    circuit_name: 'Albert Park Circuit',
    city: 'Melbourne',
    country: 'Australia',
    country_code: 'AU',
    circuit_lat: '-37.849700',
    circuit_lng: '144.968000',
    timezone: 'Australia/Melbourne',
    race_date: new Date('2026-03-08'),
  });

  const raceId = raceResult.insertId;
  console.log('[seed] Inserted race: Australian Grand Prix 2026 (id:', raceId, ')');

  // --- 3. Insert F1 sessions ---
  // Official 2026 schedule times (local AEDT)
  const sessionData = [
    {
      name: 'Free Practice 1',
      short_name: 'FP1',
      day_of_week: 'Friday' as const,
      start_time: '12:30',
      end_time: '13:30',
      session_type: 'practice' as const,
    },
    {
      name: 'Free Practice 2',
      short_name: 'FP2',
      day_of_week: 'Friday' as const,
      start_time: '16:00',
      end_time: '17:00',
      session_type: 'practice' as const,
    },
    {
      name: 'Free Practice 3',
      short_name: 'FP3',
      day_of_week: 'Saturday' as const,
      start_time: '12:30',
      end_time: '13:30',
      session_type: 'practice' as const,
    },
    {
      name: 'Qualifying',
      short_name: 'QUALI',
      day_of_week: 'Saturday' as const,
      start_time: '16:00',
      end_time: '17:00',
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
  // These represent time gaps where fans can explore Melbourne.
  //
  // Thursday: Full day — no F1 on-track (media day + support races only).
  //   Gates open ~9:00. Fans arriving early have a full day to explore.
  //
  // Friday: F1 at 12:30-13:30 (FP1) and 16:00-17:00 (FP2).
  //   Morning free until ~12:00 (allow 30min travel to circuit).
  //   Gap between FP1 end (13:30) and FP2 start (16:00) — 2.5hrs,
  //   but support races fill some of this. Realistic city excursion ~1.5hrs.
  //   Evening free after 17:00.
  //
  // Saturday: F1 at 12:30-13:30 (FP3) and 16:00-17:00 (Qualifying).
  //   Same structure as Friday.
  //
  // Sunday: Race at 15:00-17:00.
  //   Full morning free. Evening celebrations after.
  const windowData = [
    {
      slug: 'thu-full',
      label: 'Thursday — Full Day to Explore',
      day_of_week: 'Thursday' as const,
      start_time: '08:00',
      end_time: '22:00',
      max_duration_hours: '14.0',
      description: 'No F1 on-track Thursday. Explore Melbourne — hit the laneways, coffee scene, street art, or take a day trip along the Great Ocean Road.',
      sort_order: 1,
    },
    {
      slug: 'fri-morning',
      label: 'Friday Morning — Before FP1',
      day_of_week: 'Friday' as const,
      start_time: '08:00',
      end_time: '12:00',
      max_duration_hours: '3.5',
      description: 'Free morning before the first on-track action. Grab brunch in the CBD, explore Queen Victoria Market, or walk along the Yarra.',
      sort_order: 2,
    },
    {
      slug: 'fri-gap',
      label: 'Friday Afternoon — Between Sessions',
      day_of_week: 'Friday' as const,
      start_time: '13:30',
      end_time: '15:30',
      max_duration_hours: '1.5',
      description: 'Quick break between FP1 and FP2. Grab lunch at one of the circuit-adjacent cafes or explore nearby South Melbourne Market.',
      sort_order: 3,
    },
    {
      slug: 'fri-evening',
      label: 'Friday Evening — After FP2',
      day_of_week: 'Friday' as const,
      start_time: '17:00',
      end_time: '22:00',
      max_duration_hours: '4.0',
      description: 'Sessions done for the day. Head to the CBD for dinner, rooftop bars, or Melbourne\'s famous live music scene.',
      sort_order: 4,
    },
    {
      slug: 'sat-morning',
      label: 'Saturday Morning — Before FP3',
      day_of_week: 'Saturday' as const,
      start_time: '08:00',
      end_time: '12:00',
      max_duration_hours: '3.5',
      description: 'Morning free before FP3. Visit street art in Hosier Lane, grab specialty coffee, or take the tram to St Kilda beach.',
      sort_order: 5,
    },
    {
      slug: 'sat-evening',
      label: 'Saturday Evening — After Qualifying',
      day_of_week: 'Saturday' as const,
      start_time: '17:00',
      end_time: '22:00',
      max_duration_hours: '4.0',
      description: 'Qualifying\'s done — the grid is set. Celebrate with dinner in Chinatown, drinks on a rooftop, or catch live music.',
      sort_order: 6,
    },
    {
      slug: 'sun-morning',
      label: 'Sunday Morning — Race Day Build-Up',
      day_of_week: 'Sunday' as const,
      start_time: '08:00',
      end_time: '14:30',
      max_duration_hours: '5.0',
      description: 'The big day. Morning free for brunch, a walk along the Yarra, or soaking up the race day atmosphere around the circuit.',
      sort_order: 7,
    },
    {
      slug: 'sun-evening',
      label: 'Sunday Evening — Post-Race Celebration',
      day_of_week: 'Sunday' as const,
      start_time: '17:00',
      end_time: '22:00',
      max_duration_hours: '4.0',
      description: 'Chequered flag\'s waved. Time to celebrate — hit the bars, grab dinner, and replay the race with fellow fans.',
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
  console.log('[seed] Melbourne 2026 seeded successfully!');
  console.log('[seed] Summary: 1 race, 5 sessions, 8 experience windows');

  await pool.end();
}

seed().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
