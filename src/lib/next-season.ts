/**
 * Next season's calendar from Jolpica (F1's race data), mapped onto our race
 * keys, so a race page can move on to next year's weekend as soon as F1
 * publishes it. Pure functions; fetching lives in services/season.service.ts.
 */
import type { JolpicaRace } from './jolpica';

/** Jolpica circuitId → our race key (URL /races/<key>). */
export const CIRCUIT_KEYS: Record<string, string> = {
  albert_park: 'melbourne',
  shanghai: 'shanghai',
  suzuka: 'japan',
  miami: 'miami',
  villeneuve: 'canada',
  monaco: 'monaco',
  catalunya: 'barcelona',
  red_bull_ring: 'austria',
  silverstone: 'britain',
  spa: 'belgium',
  hungaroring: 'hungary',
  zandvoort: 'netherlands',
  monza: 'italy',
  madring: 'madrid',
  baku: 'azerbaijan',
  bahrain: 'bahrain',
  sepang: 'bahrain', // 2026: the Bahrain GP ran at Sepang
  jeddah: 'saudi',
  marina_bay: 'singapore',
  americas: 'usa',
  rodriguez: 'mexico',
  interlagos: 'brazil',
  vegas: 'las-vegas',
  losail: 'qatar',
  yas_marina: 'abu-dhabi',
};

export interface SeasonRace {
  key: string;
  season: number;
  round: number;
  name: string;
  /** First day of the weekend (FP1), YYYY-MM-DD. */
  startDate: string;
  raceDate: string;
}

function minusDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/** Jolpica races → our races. Circuits we have no page for are left out (and reported by /api/schedule-check). */
export function toSeasonRaces(season: number, races: JolpicaRace[]): SeasonRace[] {
  return races.flatMap((r) => {
    const key = CIRCUIT_KEYS[r.Circuit?.circuitId ?? ''];
    if (!key || !r.date) return [];
    return [{
      key,
      season,
      round: Number(r.round) || 0,
      name: r.raceName,
      startDate: r.FirstPractice?.date ?? minusDays(r.date, 2),
      raceDate: r.date,
    }];
  });
}

/** Races in a Jolpica season we can't place on a page (new circuits). */
export function unmappedRaces(races: JolpicaRace[]): string[] {
  return races.filter((r) => !CIRCUIT_KEYS[r.Circuit?.circuitId ?? '']).map((r) => `${r.raceName} (${r.Circuit?.circuitId})`);
}
