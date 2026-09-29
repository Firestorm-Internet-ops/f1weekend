import { unstable_cache } from 'next/cache';
import { getDb } from '@/lib/db';
import { races, sessions, experience_windows, race_content, experiences } from '@/lib/db/schema';
import { eq, asc, sql, inArray, notInArray } from 'drizzle-orm';
import { redis } from '@/lib/redis';
import type { Race, Session, ExperienceWindow } from '@/types/race';
import { calendarEntry, nextCalendarRace, sortByCalendar } from '@/data/calendar-2026';

const CACHE_TTL = 3600; // 1 hour

function toDateString(d: unknown): string {
  if (!d) return '';
  if (d instanceof Date) return d.toISOString().split('T')[0];
  return String(d).slice(0, 10);
}

/** Database row + the 2026 calendar (round, date, and venue when a race moved). */
function mapRace(r: typeof races.$inferSelect, hasThursdayFreeDay?: boolean): Race {
  return withCalendar(mapRaceRow(r, hasThursdayFreeDay));
}

function withCalendar(race: Race): Race {
  const cal = calendarEntry(race.slug);
  if (!cal) return race;
  const v = cal.venue;
  return {
    ...race,
    round: cal.round,
    raceDate: cal.raceDate,
    ...(v
      ? {
          name: cal.name,
          circuitName: v.circuitName,
          city: v.city,
          country: v.country,
          countryCode: v.countryCode,
          circuitLat: v.circuitLat,
          circuitLng: v.circuitLng,
          timezone: v.timezone,
          flag: v.flag,
        }
      : {}),
  };
}

function todayUtc(): string {
  return new Date().toISOString().split('T')[0];
}

function mapRaceRow(r: typeof races.$inferSelect, hasThursdayFreeDay?: boolean): Race {
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
    flag: r.flag ?? undefined,
    shortCode: r.short_code ?? undefined,
    available: !!r.available,
    hasThursdayFreeDay: hasThursdayFreeDay,
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

// "Active" = the first race on the 2026 calendar whose weekend hasn't finished
// (by the calendar's dates, not the older dates in the database), among races
// the site has content for. After race day it moves to the next race.
export async function getActiveRace(): Promise<Race | null> {
  const available = await getAvailableRaces();
  const bySlug = new Map(available.map((r) => [r.slug, r]));
  const cal = nextCalendarRace(todayUtc(), new Set(bySlug.keys()));
  if (cal) return bySlug.get(cal.slug) ?? null;
  return available[available.length - 1] ?? null;
}

// The race after the active race, or null if no more races.
export async function getNextRace(): Promise<Race | null> {
  const [active, available] = await Promise.all([getActiveRace(), getAvailableRaces()]);
  if (!active) return null;
  const i = available.findIndex((r) => r.slug === active.slug);
  return i >= 0 ? available[i + 1] ?? null : null;
}

export const getAllRaces = unstable_cache(
  async (): Promise<Race[]> => {
    const db = await getDb();
    const rows = await db
      .select({ race: races, content: race_content })
      .from(races)
      .leftJoin(race_content, eq(races.id, race_content.race_id))
      .orderBy(asc(races.race_date));
    return sortByCalendar(rows.map((row) => mapRace(row.race, !!row.content?.has_thursday_free_day)));
  },
  ['races:all:calendar-2026'],
  { revalidate: CACHE_TTL, tags: ['races'] }
);

export const getAvailableRaces = unstable_cache(
  async (): Promise<Race[]> => {
    const db = await getDb();
    const rows = await db
      .select({ race: races, content: race_content })
      .from(races)
      .leftJoin(race_content, eq(races.id, race_content.race_id))
      .where(eq(races.available, true))
      .orderBy(asc(races.race_date));
    return sortByCalendar(rows.map((row) => mapRace(row.race, !!row.content?.has_thursday_free_day)));
  },
  ['races:available:calendar-2026'],
  { revalidate: CACHE_TTL, tags: ['races'] }
);

export const getRacesWithExperiences = unstable_cache(
  async (): Promise<Race[]> => {
    const db = await getDb();
    const rows = await db
      .select({ race: races, content: race_content })
      .from(races)
      .leftJoin(race_content, eq(races.id, race_content.race_id))
      .where(sql`EXISTS (SELECT 1 FROM experiences WHERE race_id = ${races.id})`)
      .orderBy(asc(races.race_date));
    return sortByCalendar(rows.map((row) => mapRace(row.race, !!row.content?.has_thursday_free_day)));
  },
  ['races:with-experiences:calendar-2026'],
  { revalidate: CACHE_TTL, tags: ['races', 'experiences'] }
);

export async function getRaceBySlug(slug: string): Promise<Race | null> {
  const fetch = unstable_cache(
    async () => {
      const db = await getDb();
      return db
        .select({ race: races, content: race_content })
        .from(races)
        .leftJoin(race_content, eq(races.id, race_content.race_id))
        .where(eq(races.slug, slug))
        .limit(1);
    },
    [`race:slug:${slug}`],
    { revalidate: CACHE_TTL, tags: ['races', `race:${slug}`] }
  );
  const rows = await fetch();
  return rows[0] ? mapRace(rows[0].race, !!rows[0].content?.has_thursday_free_day) : null;
}

export async function getRaceById(id: number): Promise<Race | null> {
  const fetch = unstable_cache(
    async () => {
      const db = await getDb();
      return db
        .select({ race: races, content: race_content })
        .from(races)
        .leftJoin(race_content, eq(races.id, race_content.race_id))
        .where(eq(races.id, id))
        .limit(1);
    },
    [`race:id:${id}`],
    { revalidate: CACHE_TTL, tags: ['races'] }
  );
  const rows = await fetch();
  return rows[0] ? mapRace(rows[0].race, !!rows[0].content?.has_thursday_free_day) : null;
}

export async function getUpcomingRace(): Promise<Race | null> {
  const all = await getAllRaces();
  const bySlug = new Map(all.map((r) => [r.slug, r]));
  const cal = nextCalendarRace(todayUtc(), new Set(bySlug.keys()));
  return cal ? bySlug.get(cal.slug) ?? null : null;
}

/**
 * True when the race moved venue after its data was stored (Bahrain GP →
 * Sepang): its sessions, gap windows and written content describe the old
 * venue and are not shown until they are replaced.
 */
async function venueMoved(raceId: number): Promise<boolean> {
  const race = await getRaceById(raceId);
  return !!(race && calendarEntry(race.slug)?.venue);
}

export async function getSessionsByRace(raceId: number): Promise<Session[]> {
  if (await venueMoved(raceId)) return [];
  const DAY_ORDER = { Thursday: 0, Friday: 1, Saturday: 2, Sunday: 3 };

  const fetch = unstable_cache(
    async () => {
      const db = await getDb();
      return db
        .select()
        .from(sessions)
        .where(eq(sessions.race_id, raceId))
        .orderBy(asc(sessions.start_time));
    },
    [`race:sessions:${raceId}`],
    { revalidate: CACHE_TTL, tags: ['races', `race:sessions:${raceId}`] }
  );

  const rows = await fetch();
  return rows
    .map(mapSession)
    .sort((a, b) => {
      const dayDiff = DAY_ORDER[a.dayOfWeek] - DAY_ORDER[b.dayOfWeek];
      return dayDiff !== 0 ? dayDiff : a.startTime.localeCompare(b.startTime);
    });
}

export async function getWindowsByRace(raceId: number): Promise<ExperienceWindow[]> {
  if (await venueMoved(raceId)) return [];
  const fetch = unstable_cache(
    async () => {
      const db = await getDb();
      return db
        .select()
        .from(experience_windows)
        .where(eq(experience_windows.race_id, raceId))
        .orderBy(asc(experience_windows.sort_order));
    },
    [`race:windows:${raceId}`],
    { revalidate: CACHE_TTL, tags: ['races', `race:windows:${raceId}`] }
  );
  const rows = await fetch();
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
  hasThursdayFreeDay: boolean;
  homepageIntro: string | null;
  categoryMeta: Record<string, { title: string; description: string }> | null;
  transportGuide: {
    options: { icon: string; title: string; details: string; bestFor: string }[];
    howToSteps: { name: string; text: string }[];
    mapsUrl: string;
  } | null;
  scheduleIntro: string | null;
  sessionGapCopy: { windowSlug: string; heading: string; copy: string }[] | null;
  homepageCopy: {
    heroHeading: string;
    heroSubtitle: string;
    featuredHeading: string;
    featuredDescription: string;
    windowsDescription: string;
  } | null;
}

export async function getRaceContent(raceSlug: string): Promise<RaceContentRow | null> {
  if (calendarEntry(raceSlug)?.venue) return null; // written for the old venue
  const fetch = unstable_cache(
    async () => {
      const db = await getDb();
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
        hasThursdayFreeDay: !!r.has_thursday_free_day,
        homepageIntro: r.homepage_intro ?? null,
        categoryMeta: (r.category_meta as RaceContentRow['categoryMeta']) ?? null,
        transportGuide: (r.transport_guide as RaceContentRow['transportGuide']) ?? null,
        scheduleIntro: r.schedule_intro ?? null,
        sessionGapCopy: (r.session_gap_copy as RaceContentRow['sessionGapCopy']) ?? null,
        homepageCopy: (r.homepage_copy as RaceContentRow['homepageCopy']) ?? null,
      } as RaceContentRow;
    },
    [`race-content:${raceSlug}`],
    { revalidate: CACHE_TTL, tags: ['races', `race:${raceSlug}`] }
  );
  return fetch();
}

/**
 * Flush Redis cache keys for races.
 * If slug is provided, also flushes that specific race's cache.
 */
export async function clearRaceCache(slug?: string): Promise<void> {
  const todayStr = new Date().toISOString().split('T')[0];
  const keys = [
    'races:all',
    'races:available',
    'races:with-experiences',
    `race:active:${todayStr}`,
    `race:next:${todayStr}`,
    'race:upcoming',
    'race:last',
  ];

  if (slug) {
    keys.push(`race:slug:${slug}`);
    keys.push(`race-content:${slug}`);
  }

  try {
    await Promise.all(keys.map((k) => redis.del(k)));
  } catch {
    // Redis unavailable — ignore
  }
}

/**
 * Sync available flag for all races based on experiences in DB.
 */
export async function syncAvailableRaces(): Promise<void> {
  const db = await getDb();

  // 1. Get IDs of races that have at least one entry in the experiences table
  const racesWithExp = await db
    .selectDistinct({ raceId: experiences.race_id })
    .from(experiences);

  const withExpIds = racesWithExp
    .map(r => r.raceId)
    .filter((id): id is number => id !== null);

  if (withExpIds.length > 0) {
    // Mark races with experiences as available
    await db.update(races)
      .set({ available: true })
      .where(inArray(races.id, withExpIds));

    // Mark races without experiences as unavailable
    await db.update(races)
      .set({ available: false })
      .where(notInArray(races.id, withExpIds));
  } else {
    // If no races have experiences, mark all as unavailable
    await db.update(races).set({ available: false });
  }
}
