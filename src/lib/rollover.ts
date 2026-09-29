import { isRaceOver } from '@/data/calendar-2026';
import { raceKey } from '@/lib/race-url';
import type { SeasonRace } from '@/lib/next-season';
import type { Race } from '@/types/race';

/**
 * Season rollover: once a race weekend is over and F1 has published next
 * season's calendar, the race moves on to next year's weekend (dates, round,
 * name; its stored venue again if this season's was a one-off move).
 */
export function rollForward(race: Race, next: SeasonRace[], now: Date): Race {
  if (!isRaceOver(race, now)) return race;
  const entry = next.find((e) => e.key === raceKey(race.slug) && e.raceDate > race.raceDate);
  if (!entry) return race;
  return {
    ...race,
    ...(race.storedVenue ?? {}),
    venueMoved: false,
    venueNote: undefined,
    trackImage: undefined,
    storedVenue: undefined,
    season: entry.season,
    round: entry.round,
    name: entry.name || race.storedVenue?.name || race.name,
    raceDate: entry.raceDate,
    startDate: entry.startDate,
    rolledFrom: race.season,
  };
}
