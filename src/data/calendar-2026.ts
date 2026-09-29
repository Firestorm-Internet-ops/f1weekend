/**
 * The 2026 calendar as published by F1 — the source of truth for race order,
 * dates and venues. The races table in the database is older (e.g. Bahrain
 * still on 12 April at Sakhir), so race.service applies these values over it.
 * scripts/sync-calendar-2026.ts writes them into the database.
 *
 * Dates are the weekend's first and last day (local). raceDate = last day.
 */

export interface CalendarVenue {
  circuitName: string;
  city: string;
  country: string;
  countryCode: string;
  circuitLat: number;
  circuitLng: number;
  timezone: string;
  flag: string;
  /** Track image for the new venue: a /public path (shown once the file exists) or an https URL. */
  trackImage?: string;
  /** Where the race was held before, for the "moved" note (e.g. "Sakhir, Bahrain"). */
  movedFrom: string;
}

export interface CalendarRace {
  slug: string;
  round: number;
  name: string;
  startDate: string;
  raceDate: string;
  /** Set when the race moved from the venue stored in the database. */
  venue?: CalendarVenue;
  /** Experiences come live from GetYourGuide, Viator and Tiqets instead of the database list. */
  liveExperiences?: boolean;
}

export const CALENDAR_2026: CalendarRace[] = [
  { slug: 'melbourne-2026', round: 1, name: 'Australian Grand Prix', startDate: '2026-03-06', raceDate: '2026-03-08' },
  { slug: 'shanghai-2026', round: 2, name: 'Chinese Grand Prix', startDate: '2026-03-13', raceDate: '2026-03-15' },
  { slug: 'japan-2026', round: 3, name: 'Japanese Grand Prix', startDate: '2026-03-27', raceDate: '2026-03-29' },
  { slug: 'miami-2026', round: 4, name: 'Miami Grand Prix', startDate: '2026-05-01', raceDate: '2026-05-03' },
  { slug: 'canada-2026', round: 5, name: 'Grand Prix du Canada', startDate: '2026-05-22', raceDate: '2026-05-24' },
  { slug: 'monaco-2026', round: 6, name: 'Grand Prix de Monaco', startDate: '2026-06-05', raceDate: '2026-06-07' },
  { slug: 'barcelona-2026', round: 7, name: 'Gran Premio de Barcelona-Catalunya', startDate: '2026-06-12', raceDate: '2026-06-14' },
  { slug: 'austria-2026', round: 8, name: 'Austrian Grand Prix', startDate: '2026-06-26', raceDate: '2026-06-28' },
  { slug: 'britain-2026', round: 9, name: 'British Grand Prix', startDate: '2026-07-03', raceDate: '2026-07-05' },
  { slug: 'belgium-2026', round: 10, name: 'Belgian Grand Prix', startDate: '2026-07-17', raceDate: '2026-07-19' },
  { slug: 'hungary-2026', round: 11, name: 'Hungarian Grand Prix', startDate: '2026-07-24', raceDate: '2026-07-26' },
  { slug: 'netherlands-2026', round: 12, name: 'Dutch Grand Prix', startDate: '2026-08-21', raceDate: '2026-08-23' },
  { slug: 'italy-2026', round: 13, name: "Gran Premio d'Italia", startDate: '2026-09-04', raceDate: '2026-09-06' },
  { slug: 'madrid-2026', round: 14, name: 'Gran Premio de España', startDate: '2026-09-11', raceDate: '2026-09-13' },
  { slug: 'azerbaijan-2026', round: 15, name: 'Azerbaijan Grand Prix', startDate: '2026-09-24', raceDate: '2026-09-26' },
  {
    slug: 'bahrain-2026', round: 16, name: 'Bahrain Grand Prix', startDate: '2026-10-02', raceDate: '2026-10-04',
    venue: {
      circuitName: 'Sepang International Circuit',
      city: 'Kuala Lumpur',
      country: 'Malaysia',
      countryCode: 'MY',
      circuitLat: 2.7608,
      circuitLng: 101.7382,
      timezone: 'Asia/Kuala_Lumpur',
      flag: '🇲🇾',
      movedFrom: 'Sakhir, Bahrain',
      trackImage: 'https://media.formula1.com/image/upload/c_fit,h_704/q_auto/v1740000001/common/f1/2026/track/2026trackkualalumpurdetailed.webp',
    },
    liveExperiences: true,
  },
  { slug: 'singapore-2026', round: 17, name: 'Singapore Grand Prix', startDate: '2026-10-09', raceDate: '2026-10-11', liveExperiences: true },
  { slug: 'usa-2026', round: 18, name: 'United States Grand Prix', startDate: '2026-10-23', raceDate: '2026-10-25', liveExperiences: true },
  { slug: 'mexico-2026', round: 19, name: 'Gran Premio de la Ciudad de México', startDate: '2026-10-30', raceDate: '2026-11-01', liveExperiences: true },
  { slug: 'brazil-2026', round: 20, name: 'Grande Prêmio de São Paulo', startDate: '2026-11-06', raceDate: '2026-11-08', liveExperiences: true },
  { slug: 'las-vegas-2026', round: 21, name: 'Las Vegas Grand Prix', startDate: '2026-11-19', raceDate: '2026-11-21', liveExperiences: true },
  { slug: 'qatar-2026', round: 22, name: 'Qatar Grand Prix', startDate: '2026-11-27', raceDate: '2026-11-29', liveExperiences: true },
  { slug: 'abu-dhabi-2026', round: 23, name: 'Abu Dhabi Grand Prix', startDate: '2026-12-04', raceDate: '2026-12-06', liveExperiences: true },
];

/** Races in the database that are not on the 2026 calendar: kept reachable by URL, never listed or featured. */
export const OFF_CALENDAR_2026 = new Set(['saudi-2026']);

const BY_SLUG = new Map(CALENDAR_2026.map((r) => [r.slug, r]));

export function calendarEntry(slug: string): CalendarRace | undefined {
  return BY_SLUG.get(slug);
}

export function isOffCalendar(slug: string): boolean {
  return OFF_CALENDAR_2026.has(slug);
}

/** Races whose experiences come live from providers: always listed, whatever the database's `available` flag says. */
export const LIVE_EXPERIENCE_SLUGS = CALENDAR_2026.filter((r) => r.liveExperiences).map((r) => r.slug);

/** The race moved venue after its content was written (Bahrain GP → Sepang): stored pages describe the old venue. */
export function hasMovedVenue(slug: string): boolean {
  return BY_SLUG.get(slug)?.venue != null;
}

export function hasLiveExperiences(slug: string): boolean {
  return BY_SLUG.get(slug)?.liveExperiences === true;
}

/**
 * The race the site should lead with on `today` (YYYY-MM-DD): the first one
 * whose weekend hasn't finished, restricted to slugs in `candidates`
 * (races that exist on the site). After the season, the last race.
 */
/** Track time zone per race: a race stays "next" until race day has ended there. */
export const TRACK_TIMEZONES: Record<string, string> = {
  'melbourne-2026': 'Australia/Melbourne', 'shanghai-2026': 'Asia/Shanghai', 'japan-2026': 'Asia/Tokyo',
  'miami-2026': 'America/New_York', 'canada-2026': 'America/Toronto', 'monaco-2026': 'Europe/Monaco',
  'barcelona-2026': 'Europe/Madrid', 'austria-2026': 'Europe/Vienna', 'britain-2026': 'Europe/London',
  'belgium-2026': 'Europe/Brussels', 'hungary-2026': 'Europe/Budapest', 'netherlands-2026': 'Europe/Amsterdam',
  'italy-2026': 'Europe/Rome', 'madrid-2026': 'Europe/Madrid', 'azerbaijan-2026': 'Asia/Baku',
  'bahrain-2026': 'Asia/Kuala_Lumpur', 'singapore-2026': 'Asia/Singapore', 'usa-2026': 'America/Chicago',
  'mexico-2026': 'America/Mexico_City', 'brazil-2026': 'America/Sao_Paulo', 'las-vegas-2026': 'America/Los_Angeles',
  'qatar-2026': 'Asia/Qatar', 'abu-dhabi-2026': 'Asia/Dubai',
};

/** YYYY-MM-DD of `now` in a time zone (UTC when unknown). */
export function localDate(now: Date, timezone = 'UTC'): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

/** True once race day is over at the track (e.g. Las Vegas's Saturday-night race counts until midnight in Las Vegas). */
export function isRaceOver(race: Pick<CalendarRace, 'slug' | 'raceDate'> & { timezone?: string }, now: Date | string): boolean {
  const today = typeof now === 'string' ? now : localDate(now, race.timezone ?? TRACK_TIMEZONES[race.slug]);
  return today > race.raceDate;
}

/**
 * The race the site leads with: the first one on the calendar whose race day
 * isn't over yet at the track. `now` may be a date string (YYYY-MM-DD) for tests.
 */
export function nextCalendarRace(now: Date | string, candidates?: Set<string>): CalendarRace | undefined {
  const pool = candidates ? CALENDAR_2026.filter((r) => candidates.has(r.slug)) : CALENDAR_2026;
  return pool.find((r) => !isRaceOver(r, now)) ?? pool[pool.length - 1];
}

/** Calendar order for any list of races; unknown slugs go last, off-calendar ones are removed. */
export function sortByCalendar<T extends { slug: string; raceDate?: string }>(list: T[]): T[] {
  return list
    .filter((r) => !isOffCalendar(r.slug))
    .sort((a, b) => {
      const ra = BY_SLUG.get(a.slug)?.round ?? 999;
      const rb = BY_SLUG.get(b.slug)?.round ?? 999;
      return ra - rb || (a.raceDate ?? '').localeCompare(b.raceDate ?? '');
    });
}
