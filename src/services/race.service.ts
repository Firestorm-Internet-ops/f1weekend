import { db } from '@/lib/db';
import { races, sessions, experience_windows } from '@/lib/db/schema';
import { eq, asc, gte } from 'drizzle-orm';
import { redis } from '@/lib/redis';
import type { Race, Session, ExperienceWindow } from '@/types/race';

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

function toDateString(d: unknown): string {
  if (!d) return '';
  if (d instanceof Date) return d.toISOString().split('T')[0];
  return String(d).slice(0, 10);
}

function mapRace(r: typeof races.$inferSelect): Race {
  return {
    id: r.id,
    slug: r.slug ?? '',
    name: r.name ?? '',
    season: Number(r.season),
    round: r.round ?? 0,
    circuitName: r.circuit_name ?? '',
    city: r.city ?? '',
    country: r.country ?? '',
    countryCode: r.country_code ?? '',
    circuitLat: Number(r.circuit_lat),
    circuitLng: Number(r.circuit_lng),
    timezone: r.timezone ?? '',
    raceDate: toDateString(r.race_date),
  };
}

function mapSession(s: typeof sessions.$inferSelect): Session {
  return {
    id: s.id,
    raceId: s.race_id ?? 0,
    name: s.name ?? '',
    shortName: s.short_name ?? '',
    dayOfWeek: s.day_of_week as Session['dayOfWeek'],
    startTime: s.start_time ?? '',
    endTime: s.end_time ?? '',
    sessionType: s.session_type as Session['sessionType'],
  };
}

function mapWindow(w: typeof experience_windows.$inferSelect): ExperienceWindow {
  return {
    id: w.id,
    raceId: w.race_id ?? 0,
    slug: w.slug ?? '',
    label: w.label ?? '',
    dayOfWeek: w.day_of_week as ExperienceWindow['dayOfWeek'],
    startTime: w.start_time ?? null,
    endTime: w.end_time ?? null,
    maxDurationHours: w.max_duration_hours ? Number(w.max_duration_hours) : null,
    description: w.description ?? '',
    sortOrder: w.sort_order ?? 0,
  };
}

export async function getRaceBySlug(slug: string): Promise<Race | null> {
  const rows = await cached(`race:slug:${slug}`, () =>
    db.select().from(races).where(eq(races.slug, slug)).limit(1)
  );
  return rows[0] ? mapRace(rows[0]) : null;
}

export async function getUpcomingRace(): Promise<Race | null> {
  const rows = await cached('race:upcoming', () =>
    db
      .select()
      .from(races)
      .where(gte(races.race_date, new Date()))
      .orderBy(asc(races.race_date))
      .limit(1)
  );
  return rows[0] ? mapRace(rows[0]) : null;
}

export async function getSessionsByRace(raceId: number): Promise<Session[]> {
  const DAY_ORDER = { Thursday: 0, Friday: 1, Saturday: 2, Sunday: 3 };

  const rows = await cached(`race:sessions:${raceId}`, () =>
    db
      .select()
      .from(sessions)
      .where(eq(sessions.race_id, raceId))
      .orderBy(asc(sessions.start_time))
  );

  return rows
    .map(mapSession)
    .sort((a, b) => {
      const dayDiff = DAY_ORDER[a.dayOfWeek] - DAY_ORDER[b.dayOfWeek];
      return dayDiff !== 0 ? dayDiff : a.startTime.localeCompare(b.startTime);
    });
}

export async function getWindowsByRace(raceId: number): Promise<ExperienceWindow[]> {
  const rows = await cached(`race:windows:${raceId}`, () =>
    db
      .select()
      .from(experience_windows)
      .where(eq(experience_windows.race_id, raceId))
      .orderBy(asc(experience_windows.sort_order))
  );
  return rows.map(mapWindow);
}
