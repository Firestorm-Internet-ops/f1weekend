import { db } from '@/lib/db';
import { races, sessions, experience_windows, race_content } from '@/lib/db/schema';
import { eq, asc, gte, desc, sql } from 'drizzle-orm';
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

// "Active" = first race whose race_date is today or in the future (with 1-day grace: >= yesterday).
// After the race Sunday, users still see it on Monday, then it switches to the next race on Tuesday.
// Falls back to the most recent past race if all races are done.
export async function getActiveRace(): Promise<Race | null> {
  const todayStr = new Date().toISOString().split('T')[0];
  const rows = await cached(`race:active:${todayStr}`, () =>
    db
      .select()
      .from(races)
      .where(gte(races.race_date, sql`DATE_SUB(CURDATE(), INTERVAL 1 DAY)`))
      .orderBy(asc(races.race_date))
      .limit(1)
  );
  if (rows[0]) return mapRace(rows[0]);

  // All races are past — return the most recent one as fallback
  const fallback = await cached('race:last', () =>
    db.select().from(races).orderBy(desc(races.race_date)).limit(1)
  );
  return fallback[0] ? mapRace(fallback[0]) : null;
}

// The race immediately after the active race, or null if no more races.
export async function getNextRace(): Promise<Race | null> {
  const todayStr = new Date().toISOString().split('T')[0];
  const rows = await cached(`race:next:${todayStr}`, () =>
    db
      .select()
      .from(races)
      .where(gte(races.race_date, sql`DATE_SUB(CURDATE(), INTERVAL 1 DAY)`))
      .orderBy(asc(races.race_date))
      .limit(2)
  );
  // rows[0] = active race, rows[1] = next race
  return rows[1] ? mapRace(rows[1]) : null;
}

export async function getAllRaces(): Promise<Race[]> {
  const rows = await cached('races:all', () =>
    db.select().from(races).orderBy(asc(races.race_date))
  );
  return rows.map(mapRace);
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

export interface RaceContentRow {
  raceId: number;
  pageTitle: string | null;
  pageDescription: string | null;
  pageKeywords: string[] | null;
  metaJson: Record<string, unknown> | null;
  howItWorksText: string | null;
  whyCityText: string | null;
  circuitMapSrc: string | null;
  tipsContent: unknown | null;
  faqItems: { q: string; a: string }[] | null;
  faqLd: unknown | null;
  currency: string | null;
  openF1: { countryName: string; year: number } | null;
  firstDayOffset: number | null;
}

export async function getRaceContent(raceSlug: string): Promise<RaceContentRow | null> {
  return cached(`race-content:${raceSlug}`, async () => {
    const race = await db.select({ id: races.id }).from(races).where(eq(races.slug, raceSlug)).limit(1);
    if (!race[0]) return null;

    const rows = await db
      .select()
      .from(race_content)
      .where(eq(race_content.race_id, race[0].id))
      .limit(1);

    if (!rows[0]) return null;
    const r = rows[0];
    return {
      raceId: r.race_id,
      pageTitle: r.page_title ?? null,
      pageDescription: r.page_description ?? null,
      pageKeywords: (r.page_keywords as string[] | null) ?? null,
      metaJson: (r.meta_json as Record<string, unknown> | null) ?? null,
      howItWorksText: r.how_it_works_text ?? null,
      whyCityText: r.why_city_text ?? null,
      circuitMapSrc: r.circuit_map_src ?? null,
      tipsContent: r.tips_content ?? null,
      faqItems: (r.faq_items as { q: string; a: string }[] | null) ?? null,
      faqLd: r.faq_ld ?? null,
      currency: r.currency ?? null,
      openF1: (r.open_f1 as { countryName: string; year: number } | null) ?? null,
      firstDayOffset: r.first_day_offset ?? null,
    };
  });
}
