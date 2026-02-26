/**
 * Seed script: inserts all Shanghai 2026 race weekend schedule entries.
 * Idempotent — DELETEs existing entries for the race before inserting.
 * Run: npx tsx --env-file=.env scripts/seed-shanghai-schedule.ts
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

const DB_HOST = process.env.DATABASE_HOST ?? 'localhost';
const DB_PORT = Number(process.env.DATABASE_PORT) || 3306;
const DB_USER = process.env.DATABASE_USER ?? 'root';
const DB_PASS = process.env.DATABASE_PASSWORD ?? '';
const DB_NAME = process.env.DATABASE_NAME ?? 'pitlane';

interface EntryInput {
  day: 'Friday' | 'Saturday' | 'Sunday';
  startTime: string;
  endTime: string;
  title: string;
  series: string;
  seriesKey: string;
  sortOrder: number;
}

const ENTRIES: EntryInput[] = [
  // ── Friday 13 March ─────────────────────────────────────────────
  { day: 'Friday', startTime: '08:20', endTime: '08:45', title: 'First Practice Session',      series: 'SRO GT Cup',              seriesKey: 'supercars',   sortOrder: 1 },
  { day: 'Friday', startTime: '09:10', endTime: '09:50', title: 'Practice Session',            series: 'F1 Academy',              seriesKey: 'f3',          sortOrder: 2 },
  { day: 'Friday', startTime: '10:00', endTime: '11:00', title: 'F1 Car Presentation',         series: 'FIA',                     seriesKey: 'promoter',    sortOrder: 3 },
  { day: 'Friday', startTime: '11:30', endTime: '12:30', title: 'First Practice Session',      series: 'Formula 1',               seriesKey: 'f1',          sortOrder: 4 },
  { day: 'Friday', startTime: '12:55', endTime: '13:40', title: 'Practice Session',            series: 'Porsche Carrera Cup Asia', seriesKey: 'porsche',     sortOrder: 5 },
  { day: 'Friday', startTime: '13:30', endTime: '14:30', title: "Teams' Press Conference",     series: 'Formula 1',               seriesKey: 'press',       sortOrder: 6 },
  { day: 'Friday', startTime: '14:05', endTime: '14:35', title: 'Qualifying Session',          series: 'F1 Academy',              seriesKey: 'f3',          sortOrder: 7 },
  { day: 'Friday', startTime: '15:30', endTime: '16:14', title: 'Sprint Qualifying',           series: 'Formula 1',               seriesKey: 'f1',          sortOrder: 8 },
  { day: 'Friday', startTime: '17:00', endTime: '17:25', title: 'Second Practice Session',     series: 'SRO GT Cup',              seriesKey: 'supercars',   sortOrder: 9 },

  // ── Saturday 14 March ───────────────────────────────────────────
  { day: 'Saturday', startTime: '08:15', endTime: '08:40', title: 'Qualifying Session',                         series: 'SRO GT Cup',              seriesKey: 'supercars',   sortOrder: 1  },
  { day: 'Saturday', startTime: '09:10', endTime: '09:40', title: 'Qualifying Session',                         series: 'Porsche Carrera Cup Asia', seriesKey: 'porsche',     sortOrder: 2  },
  { day: 'Saturday', startTime: '11:00', endTime: '11:30', title: 'Sprint (19 Laps or 60 Mins)',                series: 'Formula 1',               seriesKey: 'f1',          sortOrder: 3  },
  { day: 'Saturday', startTime: '11:30', endTime: '12:00', title: 'Press Conference',                          series: 'Formula 1',               seriesKey: 'press',       sortOrder: 4  },
  { day: 'Saturday', startTime: '12:25', endTime: '13:00', title: 'First Race (30 Mins +1 Lap)',               series: 'SRO GT Cup',              seriesKey: 'supercars',   sortOrder: 5  },
  { day: 'Saturday', startTime: '13:45', endTime: '14:20', title: 'First Race (13 Laps, Max 30 Mins +1 Lap)', series: 'F1 Academy',              seriesKey: 'f3',          sortOrder: 6  },
  { day: 'Saturday', startTime: '15:00', endTime: '16:00', title: 'Qualifying',                                series: 'Formula 1',               seriesKey: 'f1',          sortOrder: 7  },
  { day: 'Saturday', startTime: '16:00', endTime: '17:00', title: 'Press Conference',                          series: 'Formula 1',               seriesKey: 'press',       sortOrder: 8  },
  { day: 'Saturday', startTime: '16:55', endTime: '17:30', title: 'First Race (13 Laps or 30 Mins)',           series: 'Porsche Carrera Cup Asia', seriesKey: 'porsche',     sortOrder: 9  },
  { day: 'Saturday', startTime: '18:20', endTime: '19:20', title: 'Champions Club Grid Walk & Trophy Photo',   series: 'F1 Experiences',          seriesKey: 'experiences', sortOrder: 10 },

  // ── Sunday 15 March ─────────────────────────────────────────────
  { day: 'Sunday', startTime: '09:10', endTime: '09:45', title: 'Second Race (30 Mins +1 Lap)',               series: 'SRO GT Cup',              seriesKey: 'supercars',   sortOrder: 1 },
  { day: 'Sunday', startTime: '10:40', endTime: '11:15', title: 'Second Race (13 Laps, Max 30 Mins +1 Lap)', series: 'F1 Academy',              seriesKey: 'f3',          sortOrder: 2 },
  { day: 'Sunday', startTime: '11:55', endTime: '12:30', title: 'Second Race (13 Laps or 30 Mins)',           series: 'Porsche Carrera Cup Asia', seriesKey: 'porsche',     sortOrder: 3 },
  { day: 'Sunday', startTime: '13:00', endTime: '13:30', title: "Drivers' Parade",                           series: 'Formula 1',               seriesKey: 'promoter',    sortOrder: 4 },
  { day: 'Sunday', startTime: '14:44', endTime: '14:46', title: 'National Anthem',                           series: 'Formula 1',               seriesKey: 'promoter',    sortOrder: 5 },
  { day: 'Sunday', startTime: '15:00', endTime: '17:00', title: 'Grand Prix (56 Laps or 120 Mins)',          series: 'Formula 1',               seriesKey: 'f1',          sortOrder: 6 },
];

async function run() {
  const conn = await mysql.createConnection({
    host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASS, database: DB_NAME,
  });

  try {
    const [rows] = await conn.execute<mysql.RowDataPacket[]>(
      `SELECT id FROM races WHERE slug = 'shanghai-2026' LIMIT 1`
    );
    if (rows.length === 0) {
      throw new Error("Race 'shanghai-2026' not found. Run seed-shanghai-race.ts first.");
    }
    const raceId = rows[0].id as number;

    const [del] = await conn.execute<mysql.OkPacket>(
      `DELETE FROM schedule_entries WHERE race_id = ?`, [raceId]
    );
    console.log(`Deleted ${del.affectedRows} existing schedule entries.`);

    for (const e of ENTRIES) {
      await conn.execute(
        `INSERT INTO schedule_entries
           (race_id, day_of_week, start_time, end_time, title, series, series_key, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [raceId, e.day, e.startTime + ':00', e.endTime + ':00', e.title, e.series, e.seriesKey, e.sortOrder]
      );
    }
    console.log(`✅ Inserted ${ENTRIES.length} schedule entries for race_id=${raceId}.`);
    const dayCounts = ENTRIES.reduce<Record<string, number>>((acc, e) => {
      acc[e.day] = (acc[e.day] ?? 0) + 1;
      return acc;
    }, {});
    for (const [day, count] of Object.entries(dayCounts)) {
      console.log(`  ${day}: ${count} entries`);
    }
  } finally {
    await conn.end();
  }
}

run().catch((err) => { console.error(err); process.exit(1); });
