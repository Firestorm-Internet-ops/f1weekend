/**
 * Standings, past winners at a circuit and race-day weather for the "unique
 * data" race pages. Free, keyless sources: Jolpica (api.jolpi.ca, results and
 * standings) and Open-Meteo (historical weather and forecasts). Cached; a
 * failure returns null so the page just leaves that section out.
 */
import { unstable_cache } from 'next/cache';
import type { RaceDayWeather, Win } from '@/lib/unique-data';

const JOLPICA = 'https://api.jolpi.ca/ergast/f1';
const TIMEOUT = 8000;

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(TIMEOUT) });
  if (!res.ok) throw new Error(`${new URL(url).host} → HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

async function orNull<T>(what: string, f: () => Promise<T>): Promise<T | null> {
  try {
    return await f();
  } catch (err) {
    console.error(`[race-stats] ${what} failed:`, (err as Error).message);
    return null;
  }
}

// ─── Standings and form (Jolpica) ─────────────────────────────────

export interface Standings {
  season: number;
  round: number;
  drivers: { position: number; name: string; team: string; points: number; wins: number }[];
  teams: { position: number; team: string; points: number; wins: number }[];
  /** Winners of the season's latest races, newest first. */
  recent: { round: number; race: string; driver: string; team: string }[];
}

interface JDriver { givenName: string; familyName: string }
interface JConstructor { name: string }

const fetchStandings = unstable_cache(
  async (season: number): Promise<Standings> => {
    const [d, c, r] = await Promise.all([
      getJson<{ MRData: { StandingsTable: { StandingsLists: { round: string; DriverStandings: { position: string; points: string; wins: string; Driver: JDriver; Constructors: JConstructor[] }[] }[] } } }>(`${JOLPICA}/${season}/driverStandings.json`),
      getJson<{ MRData: { StandingsTable: { StandingsLists: { ConstructorStandings: { position: string; points: string; wins: string; Constructor: JConstructor }[] }[] } } }>(`${JOLPICA}/${season}/constructorStandings.json`),
      getJson<{ MRData: { RaceTable: { Races: { round: string; raceName: string; Results: { Driver: JDriver; Constructor: JConstructor }[] }[] } } }>(`${JOLPICA}/${season}/results/1.json?limit=100`),
    ]);
    const dl = d.MRData.StandingsTable.StandingsLists[0];
    const cl = c.MRData.StandingsTable.StandingsLists[0];
    if (!dl || !cl) throw new Error(`no ${season} standings yet`);
    return {
      season,
      round: Number(dl.round),
      drivers: dl.DriverStandings.slice(0, 5).map((s) => ({
        position: Number(s.position), name: `${s.Driver.givenName} ${s.Driver.familyName}`, team: s.Constructors[0]?.name ?? '', points: Number(s.points), wins: Number(s.wins),
      })),
      teams: cl.ConstructorStandings.slice(0, 5).map((s) => ({ position: Number(s.position), team: s.Constructor.name, points: Number(s.points), wins: Number(s.wins) })),
      recent: r.MRData.RaceTable.Races.slice(-3).reverse().map((x) => ({
        round: Number(x.round), race: x.raceName, driver: `${x.Results[0].Driver.givenName} ${x.Results[0].Driver.familyName}`, team: x.Results[0].Constructor.name,
      })),
    };
  },
  ['race-stats:standings:v1'],
  { revalidate: 6 * 3600 }
);

export function getStandings(season: number): Promise<Standings | null> {
  return orNull('standings', () => fetchStandings(season));
}

export interface CircuitHistory {
  wins: (Win & { date: string })[];
}

const fetchCircuitHistory = unstable_cache(
  async (circuitId: string, n: number): Promise<CircuitHistory> => {
    const j = await getJson<{ MRData: { RaceTable: { Races: { season: string; date: string; Results: { Driver: JDriver; Constructor: JConstructor }[] }[] } } }>(
      `${JOLPICA}/circuits/${circuitId}/results/1.json?limit=200`
    );
    const wins = j.MRData.RaceTable.Races.slice(-n).reverse().map((x) => ({
      season: Number(x.season), date: x.date, driver: `${x.Results[0].Driver.givenName} ${x.Results[0].Driver.familyName}`, team: x.Results[0].Constructor.name,
    }));
    return { wins };
  },
  ['race-stats:circuit:v1'],
  { revalidate: 24 * 3600 }
);

/** The last `n` winners at a circuit (Jolpica circuitId, e.g. "interlagos"), newest first. */
export function getCircuitHistory(circuitId: string, n = 10): Promise<CircuitHistory | null> {
  return orNull('circuit history', () => fetchCircuitHistory(circuitId, n));
}

// ─── Weather (Open-Meteo) ─────────────────────────────────────────

interface Daily { time: string[]; precipitation_sum: (number | null)[]; temperature_2m_max: (number | null)[]; temperature_2m_min: (number | null)[]; precipitation_probability_max?: (number | null)[] }

const fetchRaceDayWeather = unstable_cache(
  async (lat: number, lng: number, timezone: string, days: { season: number; date: string }[]): Promise<RaceDayWeather[]> => {
    // One archive call per race day (each a single date), in parallel.
    return Promise.all(days.map(async ({ season, date }) => {
      const q = new URLSearchParams({ latitude: String(lat), longitude: String(lng), start_date: date, end_date: date, daily: 'precipitation_sum,temperature_2m_max,temperature_2m_min', timezone });
      const j = await getJson<{ daily: Daily }>(`https://archive-api.open-meteo.com/v1/archive?${q}`);
      return { season, date, rainMm: j.daily.precipitation_sum[0], maxC: j.daily.temperature_2m_max[0], minC: j.daily.temperature_2m_min[0] };
    }));
  },
  ['race-stats:weather-history:v1'],
  { revalidate: 30 * 24 * 3600 }
);

/** Rain and temperatures on each past race day at the circuit. */
export function getRaceDayWeather(lat: number, lng: number, timezone: string, days: { season: number; date: string }[]): Promise<RaceDayWeather[] | null> {
  if (days.length === 0) return Promise.resolve([]);
  return orNull('weather history', () => fetchRaceDayWeather(lat, lng, timezone, days));
}

export interface ForecastDay {
  date: string;
  rainMm: number | null;
  rainChance: number | null;
  maxC: number | null;
  minC: number | null;
}

const fetchForecast = unstable_cache(
  async (lat: number, lng: number, timezone: string, start: string, end: string): Promise<ForecastDay[]> => {
    const q = new URLSearchParams({ latitude: String(lat), longitude: String(lng), start_date: start, end_date: end, daily: 'precipitation_sum,precipitation_probability_max,temperature_2m_max,temperature_2m_min', timezone });
    const j = await getJson<{ daily: Daily }>(`https://api.open-meteo.com/v1/forecast?${q}`);
    return j.daily.time.map((date, i) => ({
      date, rainMm: j.daily.precipitation_sum[i], rainChance: j.daily.precipitation_probability_max?.[i] ?? null, maxC: j.daily.temperature_2m_max[i], minC: j.daily.temperature_2m_min[i],
    }));
  },
  ['race-stats:forecast:v1'],
  { revalidate: 3 * 3600 }
);

/** Forecast for the race weekend, once it's within Open-Meteo's 16-day range; null before that. */
export async function getWeekendForecast(lat: number, lng: number, timezone: string, start: string, end: string, now = new Date()): Promise<ForecastDay[] | null> {
  const daysAhead = (Date.parse(`${end}T00:00:00Z`) - now.getTime()) / 86_400_000;
  if (daysAhead > 15 || daysAhead < -1) return null;
  return orNull('forecast', () => fetchForecast(lat, lng, timezone, start, end));
}
