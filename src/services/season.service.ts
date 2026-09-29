import { unstable_cache } from 'next/cache';
import { fetchSeasonSchedule } from '@/lib/jolpica';
import { toSeasonRaces, type SeasonRace } from '@/lib/next-season';

/** The season our hand-checked calendar covers (src/data/calendar-2026.ts). */
export const CALENDAR_SEASON = 2026;

/**
 * Next season's races from Jolpica, refreshed every 12 hours. Empty until F1
 * publishes the calendar (or while the API is unreachable), in which case
 * finished races simply stay on their last weekend.
 */
export async function getNextSeasonRaces(): Promise<SeasonRace[]> {
  const season = CALENDAR_SEASON + 1;
  return unstable_cache(
    async () => {
      try {
        return toSeasonRaces(season, await fetchSeasonSchedule(season));
      } catch (err) {
        console.error(`[season] ${season} calendar unavailable:`, (err as Error).message.slice(0, 200));
        return [];
      }
    },
    [`season-races:${season}`],
    { revalidate: 12 * 3600, tags: ['races', 'season'] }
  )();
}
