/**
 * Live "things to do near the circuit" feed: every GetYourGuide, Viator and
 * Tiqets product around a race, one card per experience, nearest first.
 * Pure functions here; fetching and caching live in services/nearby-feed.service.ts.
 */
import { applyNearbyRules, haversineKm as haversine, nearbyLabel, type NearbyInfo, type NearbyTier } from '@/lib/nearby';
import { scorePair, MATCH_THRESHOLDS } from './match';
import type { NormalizedOffer, ProviderId } from './types';

export interface FeedOffer {
  provider: ProviderId;
  productId: string;
  url: string;
  priceAmount: number | null;
  priceCurrency: string;
  rating: number | null;
  reviewCount: number;
  freeCancellation: boolean;
}

export type FeedCategory = 'food' | 'nightlife' | 'daytrip' | 'adventure' | 'attraction' | 'culture';

export const FEED_CATEGORY_LABELS: Record<FeedCategory, string> = {
  food: '🍜 Food & drink',
  culture: '🏛 Sightseeing & culture',
  attraction: '🎟 Attractions & tickets',
  adventure: '🧗 Adventure & outdoors',
  nightlife: '🌙 Nightlife',
  daytrip: '🚐 Day trips',
};

const OUT_OF_TOWN = /\b(day trip|day tour|excursion|from [a-z ]+:|highlands|malacca|melaka|genting|cameron|selangor|port dickson|fraser)\b/i;

// Checked in this order: the first group with a match wins.
const CATEGORY_RULES: [FeedCategory, RegExp][] = [
  ['food', /\b(food|tasting|culinary|cooking|cook|street eats|dinner|lunch|brunch|breakfast|cafe|coffee|market|chocolate|wine|durian|hawker)\b/i],
  ['nightlife', /\b(night|nightlife|bar|bars|pub|club|rooftop|cocktail|evening|fireflies)\b/i],
  ['daytrip', /\b(day trip|highlands|malacca|melaka|genting|cameron|taman negara)\b/i],
  ['adventure', /\b(kayak|hike|hiking|trek|trekking|zipline|zip line|atv|rafting|kart|karting|go-kart|dive|diving|snorkel|climb|climbing|cycling|bike|biking|rainforest|jungle|waterfall|paintball|skydive|surf|segway|outdoor|adventure)\b/i],
  ['attraction', /\b(ticket|tickets|entry|admission|pass|aquarium|aquaria|zoo|bird park|theme park|water park|lagoon|tower|observation|skydeck|sky xperience|illusion|museum of illusions)\b/i],
];

/** Category from the title (and GetYourGuide's category names when present). */
export function categorize(o: Pick<NormalizedOffer, 'title' | 'categories' | 'durationHours'>, tier?: NearbyTier): FeedCategory {
  // Out-of-town outings are day trips whatever else the title mentions ("…with Lunch");
  // a 10-hour city tour is not.
  if (tier === 'daytrip') return 'daytrip';
  if ((o.durationHours ?? 0) >= 7 && OUT_OF_TOWN.test(o.title)) return 'daytrip';
  const text = `${o.title} ${o.categories.filter((c) => /[a-z]/i.test(c)).join(' ')}`;
  for (const [cat, re] of CATEGORY_RULES) {
    if (re.test(text)) return cat;
  }
  return 'culture';
}

export interface FeedCard {
  /** "<provider>:<productId>" of the card's main (most reviewed) product. */
  key: string;
  title: string;
  imageUrl: string | null;
  durationHours: number | null;
  lat: number | null;
  lng: number | null;
  locationName: string | null;
  approximateLocation: boolean;
  nearby: NearbyInfo;
  /** e.g. "5 min from Kuala Lumpur" / "Day trip · 1h 30 from Putrajaya". */
  nearbyLabel: string | null;
  /** Straight-line km from the circuit. */
  circuitKm: number | null;
  rating: number | null;
  reviewCount: number;
  /** Every site selling it, cheapest first. */
  offers: FeedOffer[];
  category: FeedCategory;
}

export interface FeedRace {
  slug: string;
  lat: number;
  lng: number;
  /** Place names that appear in most titles and say nothing about the product. */
  placeWords?: string[];
}

/** Travel services, not things to do. */
const NOT_AN_EXPERIENCE = /\b(airport|lounge|e-?sim|sim card|pocket wi-?fi)\b/i;

export function isExperience(o: Pick<NormalizedOffer, 'title'>): boolean {
  return !NOT_AN_EXPERIENCE.test(o.title);
}

const TIER_ORDER: Record<NearbyTier, number> = { near: 0, city: 1, unknown: 2, daytrip: 3, 'too-far': 4 };

const popularity = (o: NormalizedOffer) => (o.rating ?? 0) * Math.log10(o.reviewCount + 1);

function toFeedOffer(o: NormalizedOffer): FeedOffer {
  return {
    provider: o.provider,
    productId: o.productId,
    url: o.url,
    priceAmount: o.priceAmount,
    priceCurrency: o.priceCurrency,
    rating: o.rating,
    reviewCount: o.reviewCount,
    freeCancellation: o.flags.freeCancellation ?? false,
  };
}

/**
 * Groups the same product sold on different sites. Most-reviewed products
 * lead; a product joins a group when it clears the auto-match score against
 * the group's lead and the group has nothing from its site yet.
 */
export function groupSameProducts(offers: NormalizedOffer[], placeWords: string[] = []): NormalizedOffer[][] {
  const groups: NormalizedOffer[][] = [];
  for (const o of [...offers].sort((a, b) => popularity(b) - popularity(a))) {
    const home = groups.find((g) =>
      !g.some((x) => x.provider === o.provider) &&
      scorePair(o, { id: 0, title: g[0].title, durationHours: g[0].durationHours, lat: g[0].lat, lng: g[0].lng }, placeWords).score >= MATCH_THRESHOLDS.AUTO
    );
    if (home) home.push(o);
    else groups.push([o]);
  }
  return groups;
}

export function buildNearbyFeed(offers: NormalizedOffer[], race: FeedRace): FeedCard[] {
  const circuit = { lat: race.lat, lng: race.lng };
  const groups = groupSameProducts(offers.filter((o) => o.url && isExperience(o)), race.placeWords);

  const items = groups.map((g) => {
    const lead = g[0];
    // Prefer an exact point (Tiqets venue) over a city centre for the pin.
    const located = g.find((o) => o.lat != null && !o.approximateLocation) ?? lead;
    return { group: g, lead, located, lat: located.lat ?? undefined, lng: located.lng ?? undefined };
  });

  // Agreed nearby rules: drop > 2 h, keep at most 3 day trips (the most popular ones).
  const { visible } = applyNearbyRules(items, race.slug, circuit);
  // Nearest first (near → city → no location → day trips); equal travel time → most popular first.
  const sorted = [...visible].sort((a, b) =>
    TIER_ORDER[a.nearby.tier] - TIER_ORDER[b.nearby.tier] ||
    (a.nearby.travelMins ?? Infinity) - (b.nearby.travelMins ?? Infinity) ||
    popularity(b.item.lead) - popularity(a.item.lead));

  return sorted.map(({ item, nearby }) => {
    const { group, lead, located } = item;
    const reviewTotal = group.reduce((n, o) => n + o.reviewCount, 0);
    const rated = group.filter((o) => o.rating != null && o.reviewCount > 0);
    const rating = rated.length
      ? Math.round((rated.reduce((n, o) => n + o.rating! * o.reviewCount, 0) / rated.reduce((n, o) => n + o.reviewCount, 0)) * 10) / 10
      : lead.rating;
    return {
      key: `${lead.provider}:${lead.productId}`,
      title: lead.title,
      imageUrl: group.find((o) => o.imageUrl)?.imageUrl ?? null,
      durationHours: lead.durationHours,
      lat: located.lat,
      lng: located.lng,
      locationName: located.locationName ?? null,
      approximateLocation: located.approximateLocation ?? false,
      nearby,
      nearbyLabel: nearbyLabel(nearby),
      circuitKm: located.lat != null && located.lng != null
        ? Math.round(haversine(circuit, { lat: located.lat, lng: located.lng }))
        : null,
      rating,
      reviewCount: reviewTotal,
      offers: group.map(toFeedOffer).sort((a, b) => (a.priceAmount ?? Infinity) - (b.priceAmount ?? Infinity)),
      category: categorize(lead, nearby.tier),
    };
  });
}

export function feedStats(cards: FeedCard[]) {
  const byProvider: Record<ProviderId, number> = { getyourguide: 0, viator: 0, tiqets: 0 };
  for (const c of cards) for (const o of c.offers) byProvider[o.provider]++;
  return { cards: cards.length, byProvider, multiSite: cards.filter((c) => c.offers.length > 1).length };
}
