/**
 * Live "things to do near the circuit" feed: every GetYourGuide, Viator and
 * Tiqets product around a race, one card per experience, nearest first.
 * Pure functions here; fetching and caching live in services/nearby-feed.service.ts.
 */
import { applyNearbyRules, estimateTravelMins, haversineKm as haversine, nearbyLabel, RACE_TRAFFIC_FACTOR, type NearbyInfo, type NearbyTier } from '@/lib/nearby';
import { scorePair, MATCH_THRESHOLDS } from './match';
import { destinationOf, diversify, mixSites, zoneFor, zoneLabel } from './feed-enrich';
import type { NormalizedOffer, ProviderId } from './types';
import { landmarkIn } from '@/data/landmarks';

export interface FeedOffer {
  provider: ProviderId;
  productId: string;
  url: string;
  priceAmount: number | null;
  priceCurrency: string;
  rating: number | null;
  reviewCount: number;
  freeCancellation: boolean;
  instantConfirmation: boolean;
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

const OUT_OF_TOWN = /\b(day trip|day tour|excursion|from [a-z ]+:|highlands|malacca|melaka|genting|cameron|selangor|port dickson|fraser|grand canyon|hoover dam|antelope canyon|zion|death valley|valley of fire|teotihuacan|puebla|hill country|fredericksburg|sentosa|bintan|batam|johor|desert safari|dubai)\b/i;
/** Anything this long is a day out, wherever it starts. */
const DAY_OUT_HOURS = 9;

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
  if ((o.durationHours ?? 0) >= DAY_OUT_HOURS) return 'daytrip';
  if ((o.durationHours ?? 0) >= 7 && OUT_OF_TOWN.test(o.title)) return 'daytrip';
  if (/\b(day trip|grand canyon|hoover dam|antelope canyon|zion|death valley)\b/i.test(o.title)) return 'daytrip';
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
  /** Estimated race-day minutes from the circuit (traffic included). */
  circuitMins: number | null;
  /** The one travel line the card shows, e.g. "~1h from the circuit by KLIA Ekspres + shuttle" or "Day trip to Malacca". */
  travelLabel: string | null;
  /** Where a day trip goes ("Malacca"), when the title says. */
  destination?: string | null;
  /** The first session gap it fits, e.g. "Fits Fri before FP1 12:30" (set per page from the timetable). */
  fitsLabel?: string | null;
  rating: number | null;
  reviewCount: number;
  /** Every site selling it, cheapest first. */
  offers: FeedOffer[];
  category: FeedCategory;
  /** Includes a hotel pick-up (so where it's "located" matters less). */
  pickUp?: boolean;
}

export interface FeedRace {
  slug: string;
  lat: number;
  lng: number;
  /** Place names that appear in most titles and say nothing about the product. */
  placeWords?: string[];
  /** Race city, used when a place name is a venue rather than a town. */
  city?: string;
  /** Named places (where fans stay) used to fix approximate locations, e.g. Putrajaya. */
  places?: { name: string; lat: number; lng: number }[];
}

/**
 * Providers often file a tour under the town it's sold in, not where it
 * happens: GetYourGuide puts "Putrajaya Tour: …" in Sepang. When a title
 * starts with a known place and the approximate point is more than 5 km from
 * it, the place wins.
 */
export function relocateByTitle<T extends Pick<NormalizedOffer, 'title' | 'lat' | 'lng' | 'locationName' | 'approximateLocation'>>(
  o: T,
  places: { name: string; lat: number; lng: number }[]
): T {
  if (!o.approximateLocation) return o;
  const start = o.title.replace(/^from\s+/i, '').toLowerCase();
  const place = places.find((p) => start.startsWith(p.name.toLowerCase()));
  if (!place) return o;
  if (o.lat != null && o.lng != null && haversine({ lat: o.lat, lng: o.lng }, place) <= 5) return o;
  return { ...o, lat: place.lat, lng: place.lng, locationName: place.name };
}

/** Race-day minutes assumed for a tour known only to be "in the city". */
const APPROX_CITY_MINS = 30;

const hm = (mins: number) => (mins >= 60 ? `${Math.floor(mins / 60)}h${mins % 60 ? ` ${String(mins % 60).padStart(2, '0')}` : ''}` : `${mins} min`);

/**
 * Moves a tour with an approximate location (a city centre) to the landmark
 * its title names, e.g. "Sentosa: …" → Sentosa. Exact locations are kept.
 */
export function placeByLandmark<T extends Pick<NormalizedOffer, 'title' | 'lat' | 'lng' | 'locationName' | 'approximateLocation'>>(
  o: T,
  raceKeyOrSlug: string
): T {
  if (!o.approximateLocation) return o;
  const place = landmarkIn(o.title, raceKeyOrSlug.replace(/-\d{4}$/, ''));
  if (!place) return o;
  return { ...o, lat: place.lat, lng: place.lng, locationName: place.name, approximateLocation: false };
}

/** Race-day travel from the circuit, rounded to 5 min. */
export function raceDayMinsFromCircuit(km: number): number {
  return Math.max(5, Math.round((estimateTravelMins(km) * RACE_TRAFFIC_FACTOR) / 5) * 5);
}

/** Card travel line: time from the circuit for near/city, the day-trip label otherwise. */
export function travelLabelFor(nearby: NearbyInfo, circuitMins: number | null): string | null {
  if (nearby.tier === 'daytrip') return nearbyLabel(nearby);
  if (circuitMins == null) return null;
  return `${nearby.tier === 'near' ? '' : '~'}${hm(circuitMins)} from the circuit`;
}

/**
 * "Recommended" order: well-reviewed experiences first, closer ones favoured.
 * Ratings are smoothed toward 4.2 so a single 5★ review doesn't beat
 * thousands of 4.6★ ones, and more reviews count more (log scale).
 */
export function recommendedScore(c: { rating: number | null; reviewCount: number; nearby: NearbyInfo }): number {
  const n = c.reviewCount;
  const smoothed = ((c.rating ?? 4.2) * n + 4.2 * 10) / (n + 10);
  const weight = { near: 1.25, city: 1, daytrip: 0.9, unknown: 0.8, 'too-far': 0.5 }[c.nearby.tier];
  return smoothed * Math.log10(n + 10) * weight;
}

/** Travel services, not things to do. */
const NOT_AN_EXPERIENCE = /\b(airport|lounge|e-?sim|sim card|pocket wi-?fi|spa van)\b|^private transfer|\btransfers? (from|to|between)\b/i;

/**
 * Getting to and from the airport or circuit (Getting There page): the ride
 * is the product — "Airport Private Transfer", "Shuttle to Sepang", "KLIA
 * Ekspres". Not a ticket that includes one ("Sunway Lagoon with Round-Trip
 * Transfer"): that stays an experience.
 */
const TRANSFER_PRODUCT = /(\b(private|shared|airport|hotel|one-?way|round-?trip|door to door)\b[^,:]{0,30}\btransfers?\b|\btransfers? (from|to|between)\b|\bshuttle\b|\bklia ekspres\b|\bairport (train|express|bus)\b)/i;
const WITH_TRANSFER = /(\bwith|\+|\band|\bincl\.?|\bincluding)\s+(a\s+)?(round-?trip |roundtrip |return |private |hotel )?transfers?\b/i;
const NOT_TRANSFER = /\b(lounge|e-?sim|sim card|wi-?fi|fast track|luggage storage|day trip|sightseeing)\b/i;

export function isTransfer(o: Pick<NormalizedOffer, 'title'>): boolean {
  return TRANSFER_PRODUCT.test(o.title) && !WITH_TRANSFER.test(o.title) && !NOT_TRANSFER.test(o.title);
}

export function isExperience(o: Pick<NormalizedOffer, 'title'>): boolean {
  return !NOT_AN_EXPERIENCE.test(o.title) && !isTransfer(o);
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
    instantConfirmation: o.flags.instantConfirmation ?? false,
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

export function buildNearbyFeed(offers: NormalizedOffer[], race: FeedRace, kind: 'experiences' | 'transfers' = 'experiences'): FeedCard[] {
  const circuit = { lat: race.lat, lng: race.lng };
  const places = race.places ?? [];
  const keep = kind === 'transfers' ? isTransfer : isExperience;
  const groups = groupSameProducts(
    offers.filter((o) => o.url && keep(o)).map((o) => placeByLandmark(relocateByTitle(o, places), race.slug)),
    race.placeWords
  );

  const items = groups.map((g) => {
    const lead = g[0];
    // Prefer an exact point (Tiqets venue) over a city centre for the pin.
    const located = g.find((o) => o.lat != null && !o.approximateLocation) ?? lead;
    return { group: g, lead, located, lat: located.lat ?? undefined, lng: located.lng ?? undefined };
  });

  // Agreed nearby rules: drop > 2 h, keep at most 3 day trips (the most popular ones).
  const { visible } = applyNearbyRules(items, race.slug, circuit);
  const cards = visible.map(({ item, nearby: measured }) => {
    const { group, lead, located } = item;
    // Only a city centre to go on (GetYourGuide, Viator): the tour could be
    // anywhere in the city, so it's never "near the circuit" and never "5 min away".
    const approximate = located.approximateLocation ?? false;
    const nearby: NearbyInfo = approximate && measured.tier === 'near' ? { ...measured, tier: 'city' } : measured;
    const pickUp = group.some((o) => (o.raw as { hasPickUp?: boolean } | null)?.hasPickUp === true);
    const reviewTotal = group.reduce((n, o) => n + o.reviewCount, 0);
    const km = located.lat != null && located.lng != null ? haversine(circuit, { lat: located.lat, lng: located.lng }) : null;
    const circuitKm = km == null ? null : Math.round(km);
    const category = categorize(lead, nearby.tier);
    // A day trip goes somewhere: a named place in the title, or where the
    // product itself is (a venue in Melaka). A 10-hour city tour is not one.
    const destination = category === 'daytrip' || nearby.tier === 'daytrip'
      ? destinationOf(lead.title) ?? (nearby.tier === 'daytrip' ? located.locationName ?? null : null)
      : null;
    const isTrip = destination != null || nearby.tier === 'daytrip';
    // Out-of-town circuits: the realistic way in from where fans stay beats a road-speed guess.
    const zone = !isTrip && nearby.tier !== 'near' ? zoneFor(located, race.slug) : null;
    // Somewhere in the city: allow a typical cross-town trip rather than the distance to its centre.
    const circuitMins = zone ? zone.mins : km == null ? null : Math.max(raceDayMinsFromCircuit(km), approximate ? APPROX_CITY_MINS : 0);
    const cityName = located.locationName ?? race.city ?? 'the city';
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
      circuitKm,
      circuitMins,
      // Day trips say where they go ("Day trip to Malacca"), not "~2 h from the circuit".
      travelLabel: isTrip
        ? destination
          ? `Day trip to ${destination}`
          : `Day trip from ${located.approximateLocation && located.locationName ? located.locationName : race.city ?? located.locationName ?? 'the city'}`
        : zone
          ? zoneLabel(zone)
          : approximate
            ? pickUp ? `Hotel pick-up in ${cityName}` : `Across ${cityName}`
            : travelLabelFor(nearby, circuitMins),
      destination,
      rating,
      reviewCount: reviewTotal,
      offers: group.map(toFeedOffer).sort((a, b) => (a.priceAmount ?? Infinity) - (b.priceAmount ?? Infinity)),
      category,
      pickUp,
    } satisfies FeedCard;
  });

  // Recommended order; ties (e.g. no reviews yet) → nearest first. Then no
  // venue twice near the top, and no more than two cards in a row from one site.
  return mixSites(diversify(cards.sort((a, b) =>
    recommendedScore(b) - recommendedScore(a) ||
    TIER_ORDER[a.nearby.tier] - TIER_ORDER[b.nearby.tier] ||
    (a.circuitMins ?? Infinity) - (b.circuitMins ?? Infinity))));
}

/** Nearest-first order (the "Nearest" sort). */
export function byNearest(a: FeedCard, b: FeedCard): number {
  return (a.circuitMins ?? Infinity) - (b.circuitMins ?? Infinity) || recommendedScore(b) - recommendedScore(a);
}

/**
 * Title without a leading "<race city>: " — the page already says where you
 * are ("Kuala Lumpur: Batu Caves Tour" → "Batu Caves Tour").
 */
export function displayTitle(title: string, cities: string[]): string {
  for (const c of cities) {
    const re = new RegExp(`^${c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:\\s*`, 'i');
    if (re.test(title)) {
      const rest = title.replace(re, '');
      return rest.charAt(0).toUpperCase() + rest.slice(1);
    }
  }
  return title;
}

export function feedStats(cards: FeedCard[]) {
  const byProvider: Record<ProviderId, number> = { getyourguide: 0, viator: 0, tiqets: 0 };
  for (const c of cards) for (const o of c.offers) byProvider[o.provider]++;
  return { cards: cards.length, byProvider, multiSite: cards.filter((c) => c.offers.length > 1).length };
}
