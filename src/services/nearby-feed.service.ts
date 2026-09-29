import { unstable_cache } from 'next/cache';
import { ALL_SEARCH_ADAPTERS, PROVIDER_NAMES, type NormalizedOffer } from '@/lib/providers';
import { buildNearbyFeed, type FeedCard } from '@/lib/providers/nearby-feed';
import type { Race } from '@/types/race';

/** Refreshed from the providers every 6 hours. */
const FEED_TTL = 6 * 3600;
/** Search radius around the circuit; the nearby rules then drop anything > 2 h away. */
const RADIUS_KM = 100;

const CURRENCY_BY_COUNTRY: Record<string, string> = { MY: 'MYR' };

export interface NearbyFeed {
  cards: FeedCard[];
  currency: string;
  fetchedAt: string;
  /** Providers that failed this time (the feed still shows the others). */
  failed: string[];
}

export async function fetchNearbyOffers(race: Pick<Race, 'city' | 'circuitLat' | 'circuitLng' | 'countryCode'>) {
  const currency = CURRENCY_BY_COUNTRY[race.countryCode] ?? 'EUR';
  const query = { city: race.city, lat: race.circuitLat, lng: race.circuitLng, radiusKm: RADIUS_KM, currency };
  const failed: string[] = [];
  const results = await Promise.all(
    Object.values(ALL_SEARCH_ADAPTERS).map(async (adapter) => {
      if (!adapter.isConfigured()) {
        failed.push(PROVIDER_NAMES[adapter.id]);
        return [] as NormalizedOffer[];
      }
      try {
        return await adapter.search(query);
      } catch (err) {
        console.error(`[nearby-feed] ${adapter.id} failed:`, (err as Error).message);
        failed.push(PROVIDER_NAMES[adapter.id]);
        return [] as NormalizedOffer[];
      }
    })
  );
  return { offers: results.flat(), currency, failed };
}

export async function getNearbyFeed(race: Race): Promise<NearbyFeed> {
  return unstable_cache(
    async (): Promise<NearbyFeed> => {
      const { offers, currency, failed } = await fetchNearbyOffers(race);
      const cards = buildNearbyFeed(offers, {
        slug: race.slug,
        lat: race.circuitLat,
        lng: race.circuitLng,
        placeWords: [race.city, race.country],
      });
      return { cards, currency, fetchedAt: new Date().toISOString(), failed };
    },
    [`nearby-feed:${race.slug}:${race.circuitLat},${race.circuitLng}:v2`],
    { revalidate: FEED_TTL, tags: ['nearby-feed', `nearby-feed:${race.slug}`] }
  )();
}

/** The card for one product, for the click redirect. */
export async function findFeedOffer(race: Race, provider: string, productId: string) {
  const feed = await getNearbyFeed(race);
  for (const card of feed.cards) {
    const offer = card.offers.find((o) => o.provider === provider && o.productId === productId);
    if (offer) return { card, offer };
  }
  return null;
}
