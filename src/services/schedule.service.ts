import { db } from '@/lib/db';
import { schedule_entries } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { redis } from '@/lib/redis';
import type { ScheduleDay, ScheduleEntry, SeriesKey } from '@/types/schedule';

const CACHE_TTL = 3600; // 1 hour

async function cached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  try {
    const hit = await redis.get(key);
    if (hit) return JSON.parse(hit) as T;
  } catch {
    // Redis unavailable — fall through to DB
  }

  const result = await fetcher();

  try {
    await redis.set(key, JSON.stringify(result), 'EX', CACHE_TTL);
  } catch {
    // Redis unavailable — ignore
  }

  return result;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Compute display date strings ("05 March") from raceDate (the Sunday race day).
function computeDayDates(raceDate: string): Record<string, string> {
  const DAYS = ['Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
  const OFFSETS = [-3, -2, -1, 0];
  const result: Record<string, string> = {};
  for (let i = 0; i < DAYS.length; i++) {
    const d = new Date(raceDate + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + OFFSETS[i]);
    result[DAYS[i]] = `${String(d.getUTCDate()).padStart(2, '0')} ${MONTHS[d.getUTCMonth()]}`;
  }
  return result;
}

// Normalize TIME column (MySQL returns "HH:MM:SS"; we want "HH:MM")
function toHHMM(t: string | null): string {
  if (!t) return '00:00';
  return t.slice(0, 5);
}

export async function getScheduleByRace(raceId: number, raceDate?: string): Promise<ScheduleDay[]> {
  const rows = await cached(`schedule:race:${raceId}`, () =>
    db
      .select()
      .from(schedule_entries)
      .where(eq(schedule_entries.race_id, raceId))
      .orderBy(asc(schedule_entries.day_of_week), asc(schedule_entries.sort_order))
  );

  // Compute day dates — dynamically from raceDate when provided
  const DAY_DATES = raceDate
    ? computeDayDates(raceDate)
    : { Thursday: '05 March', Friday: '06 March', Saturday: '07 March', Sunday: '08 March' };

  // Group by day
  const dayMap = new Map<string, ScheduleEntry[]>();
  const DAY_ORDER = ['Thursday', 'Friday', 'Saturday', 'Sunday'];
  for (const day of DAY_ORDER) dayMap.set(day, []);

  for (const row of rows) {
    const day = row.day_of_week;
    if (!day || !dayMap.has(day)) continue;
    dayMap.get(day)!.push({
      series: row.series ?? '',
      seriesKey: (row.series_key ?? 'promoter') as SeriesKey,
      name: row.title,
      startTime: toHHMM(row.start_time),
      endTime: toHHMM(row.end_time),
    });
  }

  return DAY_ORDER.map((day) => ({
    day: day as ScheduleDay['day'],
    date: DAY_DATES[day] ?? '',
    entries: dayMap.get(day) ?? [],
  }));
}
