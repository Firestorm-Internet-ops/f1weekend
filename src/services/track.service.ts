import { unstable_cache } from 'next/cache';
import { fetchRaceways, renderTrackSvg } from '@/lib/track-outline';
import type { Race } from '@/types/race';

/** Circuit layouts change rarely: keep a drawn outline for 30 days. */
const TRACK_TTL = 30 * 24 * 3600;
/** After a failed fetch, don't make page views wait on OpenStreetMap again for 10 minutes. */
const BACKOFF_MS = 10 * 60 * 1000;
let lastFailureAt = 0;

/**
 * SVG outline of the circuit drawn from OpenStreetMap, or null.
 * Fetch failures are not cached (the next request retries); "no circuit
 * mapped here" is.
 */
export async function getTrackSvg(race: Pick<Race, 'slug' | 'circuitLat' | 'circuitLng' | 'circuitName'>): Promise<string | null> {
  if (Date.now() - lastFailureAt < BACKOFF_MS) return null;
  try {
    return await unstable_cache(
      async () => renderTrackSvg(await fetchRaceways(race.circuitLat, race.circuitLng, 4000), { title: `${race.circuitName} layout` }),
      [`track-svg:${race.slug}:${race.circuitLat},${race.circuitLng}:v1`],
      { revalidate: TRACK_TTL, tags: ['track-svg'] }
    )();
  } catch (err) {
    lastFailureAt = Date.now();
    console.warn('[track] OpenStreetMap outline unavailable:', (err as Error).message);
    return null;
  }
}
