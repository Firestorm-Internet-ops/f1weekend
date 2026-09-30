import { unstable_cache } from 'next/cache';
import { ALL_SEARCH_ADAPTERS, PROVIDER_NAMES, type NormalizedOffer } from '@/lib/providers';
import { buildNearbyFeed, type FeedCard } from '@/lib/providers/nearby-feed';
import type { Race } from '@/types/race';
import { RACE_BASES, raceKey } from '@/lib/nearby';
import { editorialPicks, withGapLabels } from '@/lib/providers/feed-enrich';
import { getSessionsByRace } from '@/services/race.service';

/** Refreshed from the providers every 6 hours. */
const FEED_TTL = 6 * 3600;
/** Search radius around the circuit; the nearby rules then drop anything > 2 h away. */
const RADIUS_KM = 100;

/** Prices in the host country's currency; EUR where we have no mapping. */
const CURRENCY_BY_COUNTRY: Record<string, string> = {
  MY: 'MYR', SG: 'SGD', US: 'USD', MX: 'MXN', BR: 'BRL', QA: 'QAR', AE: 'AED',
  AU: 'AUD', CN: 'CNY', JP: 'JPY', CA: 'CAD', GB: 'GBP', HU: 'HUF', AZ: 'AZN', MC: 'EUR',
};

export interface NearbyFeed {
  cards: FeedCard[];
  /** Airport and circuit transfers (Getting There page), best first. */
  transfers: FeedCard[];
  currency: string;
  fetchedAt: string;
  /** Providers that failed this time (the feed still shows the others). */
  failed: string[];
}

async function searchAll(query: { city: string; lat: number; lng: number; radiusKm: number; currency: string }) {
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
        console.error(`[nearby-feed] ${adapter.id} (${query.currency}) failed:`, (err as Error).message.slice(0, 200));
        failed.push(PROVIDER_NAMES[adapter.id]);
        return [] as NormalizedOffer[];
      }
    })
  );
  return { offers: results.flat(), failed };
}

/**
 * All providers around the circuit, in the local currency. Some sites reject
 * some currencies (Qatari riyal, Brazilian real): then the whole race is
 * fetched in US dollars, so every price on a card is in the same currency.
 */
export async function fetchNearbyOffers(race: Pick<Race, 'city' | 'circuitLat' | 'circuitLng' | 'countryCode'>) {
  const local = CURRENCY_BY_COUNTRY[race.countryCode] ?? 'EUR';
  const base = { city: race.city, lat: race.circuitLat, lng: race.circuitLng, radiusKm: RADIUS_KM };
  const first = await searchAll({ ...base, currency: local });
  if (first.failed.length === 0 || local === 'USD') return { ...first, currency: local };
  const usd = await searchAll({ ...base, currency: 'USD' });
  return usd.failed.length < first.failed.length ? { ...usd, currency: 'USD' } : { ...first, currency: local };
}

/** A list missing a site is only reused this long, then fetched again (not for FEED_TTL). */
const PARTIAL_TTL_MS = 10 * 60 * 1000;
const partialFeeds = new Map<string, { feed: NearbyFeed; until: number }>();

/** Thrown inside the cache so a list missing a site isn't stored for 6 hours. */
class PartialFeed extends Error {
  constructor(readonly feed: NearbyFeed) {
    super(`partial feed: ${feed.failed.join(', ')} failed`);
  }
}

export async function getNearbyFeed(race: Race): Promise<NearbyFeed> {
  const key = `nearby-feed:${race.slug}:${race.circuitLat},${race.circuitLng}:v10`;
  const recent = partialFeeds.get(key);
  if (recent && recent.until > Date.now()) return recent.feed;
  try {
    return await buildCachedFeed(race, key);
  } catch (err) {
    if (!(err instanceof PartialFeed)) throw err;
    // Show what we have, try the missing site again in 10 minutes.
    partialFeeds.set(key, { feed: err.feed, until: Date.now() + PARTIAL_TTL_MS });
    return err.feed;
  }
}

function buildCachedFeed(race: Race, key: string): Promise<NearbyFeed> {
  return unstable_cache(
    async (): Promise<NearbyFeed> => {
      const { offers, currency, failed } = await fetchNearbyOffers(race);
      const feedRace = {
        slug: race.slug,
        lat: race.circuitLat,
        lng: race.circuitLng,
        placeWords: [race.city, race.country],
        city: race.city,
        places: RACE_BASES[raceKey(race.slug)] ?? [],
      };
      const cards = buildNearbyFeed(offers, feedRace);
      const transfers = buildNearbyFeed(offers, feedRace, 'transfers').slice(0, 8);
      const feed = { cards, transfers, currency, fetchedAt: new Date().toISOString(), failed };
      if (failed.length > 0) throw new PartialFeed(feed);
      return feed;
    },
    [key],
    { revalidate: FEED_TTL, tags: ['nearby-feed', `nearby-feed:${race.slug}`] }
  )();
}

/**
 * The feed as the race pages show it: each card says which session gap it
 * fits (from this race's timetable), plus three editorial picks.
 */
export async function getWeekendFeed(race: Race): Promise<NearbyFeed & { picks: FeedCard[] }> {
  const [feed, sessions] = await Promise.all([getNearbyFeed(race), getSessionsByRace(race.id)]);
  const cards = withGapLabels(feed.cards, sessions);
  return { ...feed, cards, picks: editorialPicks(cards) };
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
