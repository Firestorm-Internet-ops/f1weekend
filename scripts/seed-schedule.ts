/**
 * Seed script: inserts all Melbourne 2026 race weekend schedule entries.
 * Idempotent — DELETEs existing entries for the race before inserting.
 * Run after migrate-add-schedule.ts:
 *   npx tsx --env-file=.env scripts/seed-schedule.ts
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

const DB_HOST = process.env.DATABASE_HOST ?? 'localhost';
const DB_PORT = Number(process.env.DATABASE_PORT) || 3306;
const DB_USER = process.env.DATABASE_USER ?? 'root';
const DB_PASS = process.env.DATABASE_PASSWORD ?? '';
const DB_NAME = process.env.DATABASE_NAME ?? 'pitlane';

interface EntryInput {
  day: 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string;
  endTime: string;
  title: string;
  series: string;
  seriesKey: string;
  sortOrder: number;
}

const ENTRIES: EntryInput[] = [
  // ── Thursday 05 March ───────────────────────────────────────────
  { day: 'Thursday', startTime: '09:45', endTime: '10:15', title: 'Practice Session',           series: 'Porsche Carrera Cup',    seriesKey: 'porsche',     sortOrder: 1  },
  { day: 'Thursday', startTime: '10:35', endTime: '11:05', title: 'Practice 1',                 series: 'Supercars Championship', seriesKey: 'supercars',   sortOrder: 2  },
  { day: 'Thursday', startTime: '11:35', endTime: '12:05', title: 'Qualifying',                 series: 'Porsche Carrera Cup',    seriesKey: 'porsche',     sortOrder: 3  },
  { day: 'Thursday', startTime: '12:25', endTime: '12:55', title: 'Practice 2',                 series: 'Supercars Championship', seriesKey: 'supercars',   sortOrder: 4  },
  { day: 'Thursday', startTime: '13:30', endTime: '14:30', title: "F1 Drivers' Press Conference", series: 'Press Conference',     seriesKey: 'press',       sortOrder: 5  },
  { day: 'Thursday', startTime: '14:20', endTime: '14:50', title: 'Qualifying',                 series: 'Supercars Championship', seriesKey: 'supercars',   sortOrder: 6  },
  { day: 'Thursday', startTime: '15:35', endTime: '16:10', title: 'Race 1',                     series: 'Porsche Carrera Cup',    seriesKey: 'porsche',     sortOrder: 7  },
  { day: 'Thursday', startTime: '16:20', endTime: '16:35', title: 'F1 Car Demonstration',       series: 'Promoter Activity',      seriesKey: 'promoter',    sortOrder: 8  },
  { day: 'Thursday', startTime: '16:55', endTime: '17:40', title: 'Race 1',                     series: 'Supercars Championship', seriesKey: 'supercars',   sortOrder: 9  },
  { day: 'Thursday', startTime: '18:00', endTime: '18:45', title: 'Driver Autograph Session',   series: 'Promoter Activity',      seriesKey: 'promoter',    sortOrder: 10 },
  { day: 'Thursday', startTime: '18:50', endTime: '20:15', title: 'Track Tour & Pit Lane Walk', series: 'F1 Experiences',         seriesKey: 'experiences', sortOrder: 11 },
  { day: 'Thursday', startTime: '20:30', endTime: '21:45', title: 'Track Tour & Pit Lane Walk', series: 'F1 Experiences',         seriesKey: 'experiences', sortOrder: 12 },

  // ── Friday 06 March ─────────────────────────────────────────────
  { day: 'Friday', startTime: '08:30', endTime: '10:00', title: 'Circuit Walk',                      series: 'F1 Experiences',         seriesKey: 'experiences', sortOrder: 1  },
  { day: 'Friday', startTime: '09:35', endTime: '10:25', title: 'Practice',                          series: 'FIA Formula 3',          seriesKey: 'f3',          sortOrder: 2  },
  { day: 'Friday', startTime: '10:40', endTime: '11:30', title: 'Practice',                          series: 'FIA Formula 2',          seriesKey: 'f2',          sortOrder: 3  },
  { day: 'Friday', startTime: '11:45', endTime: '12:15', title: 'Race 2',                            series: 'Porsche Carrera Cup',    seriesKey: 'porsche',     sortOrder: 4  },
  { day: 'Friday', startTime: '12:30', endTime: '13:30', title: 'Free Practice 1',                   series: 'Formula 1',              seriesKey: 'f1',          sortOrder: 5  },
  { day: 'Friday', startTime: '13:45', endTime: '14:15', title: 'Qualifying',                        series: 'FIA Formula 3',          seriesKey: 'f3',          sortOrder: 6  },
  { day: 'Friday', startTime: '14:30', endTime: '15:00', title: 'Qualifying',                        series: 'FIA Formula 2',          seriesKey: 'f2',          sortOrder: 7  },
  { day: 'Friday', startTime: '15:10', endTime: '15:50', title: 'Race 2',                            series: 'Supercars Championship', seriesKey: 'supercars',   sortOrder: 8  },
  { day: 'Friday', startTime: '16:00', endTime: '17:00', title: 'Free Practice 2',                   series: 'Formula 1',              seriesKey: 'f1',          sortOrder: 9  },
  { day: 'Friday', startTime: '17:15', endTime: '17:55', title: 'Race 3',                            series: 'Supercars Championship', seriesKey: 'supercars',   sortOrder: 10 },
  { day: 'Friday', startTime: '18:00', endTime: '18:45', title: 'Driver Autograph Session',          series: 'Promoter Activity',      seriesKey: 'promoter',    sortOrder: 11 },
  { day: 'Friday', startTime: '18:30', endTime: '19:30', title: "F1 Team Principals' Press Conference", series: 'Press Conference',   seriesKey: 'press',       sortOrder: 12 },
  { day: 'Friday', startTime: '19:00', endTime: '20:30', title: 'Pit Lane Walk',                     series: 'F1 Experiences',         seriesKey: 'experiences', sortOrder: 13 },
  { day: 'Friday', startTime: '19:30', endTime: '21:00', title: 'Fan Stage Entertainment',           series: 'Promoter Activity',      seriesKey: 'promoter',    sortOrder: 14 },
  { day: 'Friday', startTime: '20:30', endTime: '22:00', title: 'Pit Lane Walk',                     series: 'F1 Experiences',         seriesKey: 'experiences', sortOrder: 15 },

  // ── Saturday 07 March ───────────────────────────────────────────
  { day: 'Saturday', startTime: '08:30', endTime: '10:00', title: 'Track Tour',                    series: 'F1 Experiences',         seriesKey: 'experiences', sortOrder: 1  },
  { day: 'Saturday', startTime: '09:35', endTime: '10:10', title: 'Race 1',                        series: 'FIA Formula 3',          seriesKey: 'f3',          sortOrder: 2  },
  { day: 'Saturday', startTime: '10:25', endTime: '11:20', title: 'Sprint Race',                   series: 'FIA Formula 2',          seriesKey: 'f2',          sortOrder: 3  },
  { day: 'Saturday', startTime: '11:35', endTime: '12:05', title: 'Race 3',                        series: 'Porsche Carrera Cup',    seriesKey: 'porsche',     sortOrder: 4  },
  { day: 'Saturday', startTime: '12:30', endTime: '13:30', title: 'Free Practice 3',               series: 'Formula 1',              seriesKey: 'f1',          sortOrder: 5  },
  { day: 'Saturday', startTime: '13:45', endTime: '14:25', title: 'Race 4',                        series: 'Supercars Championship', seriesKey: 'supercars',   sortOrder: 6  },
  { day: 'Saturday', startTime: '14:40', endTime: '15:15', title: 'Race 2',                        series: 'FIA Formula 3',          seriesKey: 'f3',          sortOrder: 7  },
  { day: 'Saturday', startTime: '15:20', endTime: '15:55', title: 'Driver Autograph Session',      series: 'Promoter Activity',      seriesKey: 'promoter',    sortOrder: 8  },
  { day: 'Saturday', startTime: '16:00', endTime: '17:00', title: 'Qualifying',                    series: 'Formula 1',              seriesKey: 'f1',          sortOrder: 9  },
  { day: 'Saturday', startTime: '17:15', endTime: '18:15', title: 'F1 Post-Qualifying Press Conference', series: 'Press Conference', seriesKey: 'press',       sortOrder: 10 },
  { day: 'Saturday', startTime: '18:30', endTime: '20:00', title: 'Fan Stage Live Music',          series: 'Promoter Activity',      seriesKey: 'promoter',    sortOrder: 11 },
  { day: 'Saturday', startTime: '19:00', endTime: '20:30', title: 'Pit Lane Walk',                 series: 'F1 Experiences',         seriesKey: 'experiences', sortOrder: 12 },
  { day: 'Saturday', startTime: '20:30', endTime: '22:30', title: 'Headline Concert',              series: 'Promoter Activity',      seriesKey: 'promoter',    sortOrder: 13 },
  { day: 'Saturday', startTime: '20:45', endTime: '22:15', title: 'Pit Lane Walk',                 series: 'F1 Experiences',         seriesKey: 'experiences', sortOrder: 14 },

  // ── Sunday 08 March ─────────────────────────────────────────────
  { day: 'Sunday', startTime: '09:30', endTime: '10:15', title: 'Feature Race',              series: 'FIA Formula 3',          seriesKey: 'f3',          sortOrder: 1  },
  { day: 'Sunday', startTime: '10:30', endTime: '11:25', title: 'Feature Race',              series: 'FIA Formula 2',          seriesKey: 'f2',          sortOrder: 2  },
  { day: 'Sunday', startTime: '11:40', endTime: '12:15', title: 'Race 4',                   series: 'Porsche Carrera Cup',    seriesKey: 'porsche',     sortOrder: 3  },
  { day: 'Sunday', startTime: '12:00', endTime: '13:30', title: 'Pre-Race Pit Lane Walk',   series: 'F1 Experiences',         seriesKey: 'experiences', sortOrder: 4  },
  { day: 'Sunday', startTime: '12:30', endTime: '13:15', title: 'Driver Autograph Session', series: 'Promoter Activity',      seriesKey: 'promoter',    sortOrder: 5  },
  { day: 'Sunday', startTime: '13:30', endTime: '14:00', title: 'Driver Parade',            series: 'Promoter Activity',      seriesKey: 'promoter',    sortOrder: 6  },
  { day: 'Sunday', startTime: '14:00', endTime: '14:50', title: 'Pre-Race Entertainment',   series: 'Promoter Activity',      seriesKey: 'promoter',    sortOrder: 7  },
  { day: 'Sunday', startTime: '14:05', endTime: '14:50', title: 'Grid Walk',                series: 'Promoter Activity',      seriesKey: 'promoter',    sortOrder: 8  },
  { day: 'Sunday', startTime: '15:00', endTime: '17:00', title: 'Race',                     series: 'Formula 1',              seriesKey: 'f1',          sortOrder: 9  },
  { day: 'Sunday', startTime: '17:15', endTime: '17:50', title: 'Podium Ceremony',          series: 'Promoter Activity',      seriesKey: 'promoter',    sortOrder: 10 },
  { day: 'Sunday', startTime: '17:50', endTime: '19:30', title: 'Victory Lane Celebrations', series: 'F1 Experiences',        seriesKey: 'experiences', sortOrder: 11 },
  { day: 'Sunday', startTime: '18:30', endTime: '21:30', title: 'Post-Race Concert',        series: 'Promoter Activity',      seriesKey: 'promoter',    sortOrder: 12 },
];

const DAY_DATES: Record<string, string> = {
  Thursday: '2026-03-05',
  Friday:   '2026-03-06',
  Saturday: '2026-03-07',
  Sunday:   '2026-03-08',
};

async function run() {
  const conn = await mysql.createConnection({
    host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASS, database: DB_NAME,
  });

  try {
    // Find Melbourne 2026 race ID
    const [rows] = await conn.execute<mysql.RowDataPacket[]>(
      `SELECT id FROM races WHERE slug = 'melbourne-2026' LIMIT 1`
    );
    if (rows.length === 0) {
      throw new Error("Race 'melbourne-2026' not found. Run seed-race.ts first.");
    }
    const raceId = rows[0].id as number;

    // Idempotent: delete existing entries for this race
    const [del] = await conn.execute<mysql.OkPacket>(
      `DELETE FROM schedule_entries WHERE race_id = ?`, [raceId]
    );
    console.log(`Deleted ${del.affectedRows} existing schedule entries.`);

    // Insert all entries
    for (const e of ENTRIES) {
      await conn.execute(
        `INSERT INTO schedule_entries
           (race_id, day_of_week, start_time, end_time, title, series, series_key, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [raceId, e.day, e.startTime + ':00', e.endTime + ':00', e.title, e.series, e.seriesKey, e.sortOrder]
      );
    }
    console.log(`✅ Inserted ${ENTRIES.length} schedule entries for race_id=${raceId}.`);
    console.log(`\nDay distribution:`);
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

// Suppress unused variable warning
void DAY_DATES;

run().catch((err) => { console.error(err); process.exit(1); });
