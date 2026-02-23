import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { sessions, experience_windows, races } from '../lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Inserts Thursday on-circuit sessions for Melbourne 2026 and
 * updates the thu-full window description to reflect the real program.
 *
 * Official Thursday 05 March program (local AEDT):
 *   09:45–10:15  Porsche Carrera Cup Practice
 *   10:35–11:05  Supercars FP1
 *   11:35–12:05  Porsche Carrera Cup Qualifying
 *   12:25–12:55  Supercars FP2
 *   13:30–14:30  F1 Drivers' Press Conference
 *   14:20–14:50  Supercars Qualifying Parts 1 & 2
 *   15:35–16:10  Porsche Carrera Cup Race 1
 *   16:20–16:35  F1 Car Demonstration
 *   16:55–17:40  Supercars Race 1
 *   18:50–20:15  F1 Experiences — Track Tour & Pit Lane Walk
 */
async function run() {
  const pool = mysql.createPool({
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT) || 3306,
    user: process.env.DATABASE_USER ?? 'root',
    password: process.env.DATABASE_PASSWORD ?? '',
    database: process.env.DATABASE_NAME ?? 'pitlane',
  });
  const db = drizzle(pool);

  const [race] = await db.select().from(races).where(eq(races.slug, 'melbourne-2026'));
  if (!race) {
    console.error('Race not found. Run seed-race.ts first.');
    await pool.end();
    return;
  }

  const raceId = race.id;

  // Check if Thursday sessions already exist
  const existing = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.race_id, raceId), eq(sessions.day_of_week, 'Thursday')));
  if (existing.length > 0) {
    console.log(`Thursday sessions already exist (${existing.length} found). Skipping insert.`);
  } else {
    const thursdaySessions = [
      {
        name: 'Porsche Carrera Cup & Supercars',
        short_name: 'SUPPORT',
        day_of_week: 'Thursday' as const,
        start_time: '09:45',
        end_time: '17:40',
        session_type: 'support' as const,
      },
      {
        name: 'F1 Drivers\' Press Conference',
        short_name: 'PRESS',
        day_of_week: 'Thursday' as const,
        start_time: '13:30',
        end_time: '14:30',
        session_type: 'event' as const,
      },
      {
        name: 'F1 Car Demonstration',
        short_name: 'DEMO',
        day_of_week: 'Thursday' as const,
        start_time: '16:20',
        end_time: '16:35',
        session_type: 'event' as const,
      },
      {
        name: 'F1 Experiences — Track Tour & Pit Walk',
        short_name: 'EXP',
        day_of_week: 'Thursday' as const,
        start_time: '18:50',
        end_time: '20:15',
        session_type: 'event' as const,
      },
    ];

    for (const s of thursdaySessions) {
      await db.insert(sessions).values({ race_id: raceId, ...s });
    }
    console.log(`Inserted ${thursdaySessions.length} Thursday sessions`);
  }

  // Update thu-full window description
  await db
    .update(experience_windows)
    .set({
      label: 'Thursday — Explore Melbourne',
      description:
        'Support racing fires up at 09:45 (Porsche Cup & Supercars all day). Thursday is still the best day to discover Melbourne — roam the laneways, hit Queen Vic Market, or book a tasting menu. Head to the circuit from midday for the F1 press conference and Car Demo.',
    })
    .where(and(eq(experience_windows.race_id, raceId), eq(experience_windows.slug, 'thu-full')));
  console.log('Updated thu-full window description');

  console.log('Done.');
  await pool.end();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
