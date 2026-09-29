/**
 * F1 session times from Jolpica (api.jolpi.ca), the free, keyless successor
 * of the Ergast API. It publishes FP1–FP3, sprint qualifying, sprint,
 * qualifying and race start times (UTC) for every round of the season.
 * Support races, press conferences and parades are not in any public API;
 * those stay in src/data/timetables-2026.ts or the database.
 *
 * Pure functions here are unit-tested; fetching is in fetchSeasonSchedule().
 */
import type { Session } from '@/types/race';

const BASE = 'https://api.jolpi.ca/ergast/f1';

interface JolpicaSessionTime { date: string; time?: string }

export interface JolpicaRace {
  round: string;
  raceName: string;
  date: string;
  time?: string;
  Circuit: { circuitId: string; circuitName: string; Location: { lat: string; long: string; locality: string; country: string } };
  FirstPractice?: JolpicaSessionTime;
  SecondPractice?: JolpicaSessionTime;
  ThirdPractice?: JolpicaSessionTime;
  SprintQualifying?: JolpicaSessionTime;
  SprintShootout?: JolpicaSessionTime; // 2023 name for sprint qualifying
  Sprint?: JolpicaSessionTime;
  Qualifying?: JolpicaSessionTime;
}

/** One F1 track session, start in UTC. */
export interface F1Session {
  key: 'FP1' | 'FP2' | 'FP3' | 'SQ' | 'SPR' | 'Q' | 'RACE';
  name: string;
  type: Session['sessionType'];
  startUtc: string; // ISO
  durationMins: number;
}

const SESSION_DEFS: { field: keyof JolpicaRace | 'race'; key: F1Session['key']; name: string; type: Session['sessionType']; mins: number }[] = [
  { field: 'FirstPractice', key: 'FP1', name: 'Practice 1', type: 'practice', mins: 60 },
  { field: 'SecondPractice', key: 'FP2', name: 'Practice 2', type: 'practice', mins: 60 },
  { field: 'ThirdPractice', key: 'FP3', name: 'Practice 3', type: 'practice', mins: 60 },
  { field: 'SprintQualifying', key: 'SQ', name: 'Sprint Qualifying', type: 'qualifying', mins: 45 },
  { field: 'SprintShootout', key: 'SQ', name: 'Sprint Qualifying', type: 'qualifying', mins: 45 },
  { field: 'Sprint', key: 'SPR', name: 'Sprint', type: 'sprint', mins: 60 },
  { field: 'Qualifying', key: 'Q', name: 'Qualifying', type: 'qualifying', mins: 60 },
  { field: 'race', key: 'RACE', name: 'Grand Prix', type: 'race', mins: 120 },
];

/** Sessions with a published start time, in weekend order. Sessions without a time yet are skipped. */
export function sessionsOf(race: JolpicaRace): F1Session[] {
  const out: F1Session[] = [];
  const seen = new Set<string>();
  for (const d of SESSION_DEFS) {
    const t: JolpicaSessionTime | undefined = d.field === 'race' ? { date: race.date, time: race.time } : (race[d.field] as JolpicaSessionTime | undefined);
    if (!t?.date || !t.time || seen.has(d.key)) continue;
    seen.add(d.key);
    out.push({ key: d.key, name: d.name, type: d.type, startUtc: `${t.date}T${t.time.endsWith('Z') ? t.time : `${t.time}Z`}`, durationMins: d.mins });
  }
  return out.sort((a, b) => a.startUtc.localeCompare(b.startUtc));
}

function km(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const r = (x: number) => (x * Math.PI) / 180;
  const h = Math.sin(r(bLat - aLat) / 2) ** 2 + Math.cos(r(aLat)) * Math.cos(r(bLat)) * Math.sin(r(bLng - aLng) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

const dayDiff = (a: string, b: string) => Math.abs(Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86_400_000;

/**
 * The Jolpica race for one of our races: race day within a day of ours
 * (UTC dates shift for night races) and circuit within 100 km. Round numbers
 * aren't trusted — cancellations and moves renumber the season.
 */
export function findJolpicaRace(
  races: JolpicaRace[],
  ours: { raceDate: string; circuitLat: number; circuitLng: number }
): JolpicaRace | undefined {
  return races.find((r) => {
    if (dayDiff(r.date, ours.raceDate) > 1) return false;
    const lat = Number(r.Circuit?.Location?.lat);
    const lng = Number(r.Circuit?.Location?.long);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(ours.circuitLat)) return true;
    return km(lat, lng, ours.circuitLat, ours.circuitLng) <= 100;
  });
}

/** "2026-10-02T04:30:00Z" in Asia/Kuala_Lumpur → { day: 'Friday', time: '12:30' }. */
export function toLocal(isoUtc: string, timeZone: string): { day: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone, weekday: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(isoUtc));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return { day: get('weekday'), time: `${get('hour')}:${get('minute')}` };
}

const addMins = (hhmm: string, mins: number) => {
  const [h, m] = hhmm.split(':').map(Number);
  const t = (h * 60 + m + mins) % (24 * 60);
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
};

const WEEKEND_DAYS = new Set(['Thursday', 'Friday', 'Saturday', 'Sunday']);

/** Jolpica sessions as our Session rows, in the race's local time (ids negative: not database rows). */
export function toSessionRows(sessions: F1Session[], raceId: number, timeZone: string): Session[] {
  return sessions.flatMap((s, i) => {
    const { day, time } = toLocal(s.startUtc, timeZone);
    if (!WEEKEND_DAYS.has(day)) return [];
    return [{
      id: -(100 + i),
      raceId,
      name: s.name,
      shortName: s.key,
      dayOfWeek: day as Session['dayOfWeek'],
      startTime: time,
      endTime: addMins(time, s.durationMins),
      sessionType: s.type,
    }];
  });
}

const F1_TYPES = new Set<Session['sessionType']>(['practice', 'qualifying', 'sprint', 'race']);

/** Stored sessions with the F1 track sessions replaced by Jolpica's; support races and events are kept. */
export function mergeSessions(stored: Session[], fromJolpica: Session[]): Session[] {
  if (fromJolpica.length === 0) return stored;
  const DAY = { Thursday: 0, Friday: 1, Saturday: 2, Sunday: 3 } as const;
  return [...stored.filter((s) => !F1_TYPES.has(s.sessionType)), ...fromJolpica].sort(
    (a, b) => DAY[a.dayOfWeek] - DAY[b.dayOfWeek] || a.startTime.localeCompare(b.startTime)
  );
}

export async function fetchSeasonSchedule(season: number): Promise<JolpicaRace[]> {
  const res = await fetch(`${BASE}/${season}/races/?limit=100`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8000), // never hold a page on the timing API
  });
  if (!res.ok) throw new Error(`Jolpica ${season} → HTTP ${res.status}`);
  const j = (await res.json()) as { MRData?: { RaceTable?: { Races?: JolpicaRace[] } } };
  return j.MRData?.RaceTable?.Races ?? [];
}
