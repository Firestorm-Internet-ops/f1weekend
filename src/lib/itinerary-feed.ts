/**
 * Fills itinerary gaps with live-feed experiences (races whose experiences
 * come from GetYourGuide / Viator / Tiqets, not the database).
 *
 * Where the fan is decides what fits:
 *  - between two sessions → at the circuit: near-circuit things only, and
 *    the experience plus a round trip must fit the gap;
 *  - before the first / after the last session → in the city: near or city
 *    tier, plus one trip to or from the circuit;
 *  - a free day (no sessions picked) → anything incl. day trips.
 * Pure functions, unit-tested.
 */
import { estimateTravelMins, RACE_TRAFFIC_FACTOR } from '@/lib/nearby';
import type { FeedCard } from '@/lib/providers/nearby-feed';
import { titleSimilarity, tokenize } from '@/lib/providers/match';
import type { FeedSuggestion } from '@/types/itinerary';

export type GapKind = 'between-sessions' | 'before-sessions' | 'after-sessions' | 'free-day';

/** Minutes an experience of unknown length is assumed to take. */
export const UNKNOWN_DURATION_MINS = 180;
/** Gaps shorter than this get no suggestions. */
export const MIN_GAP_MINS = 60;

const toMins = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

/** Race-day minutes between the circuit and the experience. */
export function circuitTravelMins(card: Pick<FeedCard, 'circuitKm'> & Partial<Pick<FeedCard, 'circuitMins'>>): number | null {
  if (card.circuitMins != null) return card.circuitMins;
  return card.circuitKm == null ? null : Math.round(estimateTravelMins(card.circuitKm) * RACE_TRAFFIC_FACTOR);
}

/** Total minutes the experience needs in this gap, or null if it can't be placed. */
export function minutesNeeded(card: FeedCard, kind: GapKind): number | null {
  const duration = card.durationHours ? Math.round(card.durationHours * 60) : UNKNOWN_DURATION_MINS;
  if (kind === 'free-day') return duration;
  const travel = circuitTravelMins(card);
  if (travel == null) return null;
  return duration + (kind === 'between-sessions' ? 2 * travel : travel);
}

export function fits(card: FeedCard, kind: GapKind, gapMins: number): boolean {
  const tier = card.nearby.tier;
  if (kind === 'between-sessions' && tier !== 'near') return false;
  if ((kind === 'before-sessions' || kind === 'after-sessions') && tier !== 'near' && tier !== 'city') return false;
  if (kind === 'free-day' && !['near', 'city', 'daytrip'].includes(tier)) return false;
  const need = minutesNeeded(card, kind);
  return need != null && need <= gapMins;
}

export function toSuggestion(card: FeedCard): FeedSuggestion {
  const best = card.offers[0];
  return {
    key: card.key,
    title: card.title,
    imageUrl: card.imageUrl,
    nearbyLabel: card.travelLabel ?? card.nearbyLabel,
    circuitKm: card.circuitKm,
    durationHours: card.durationHours,
    rating: card.rating,
    reviewCount: card.reviewCount,
    provider: best.provider,
    productId: best.productId,
    priceAmount: best.priceAmount,
    priceCurrency: best.priceCurrency,
    otherSites: card.offers.length - 1,
  };
}

/** What has been suggested so far in one itinerary (so nothing repeats). */
export interface PickState {
  keys: Set<string>;
  tokens: Set<string>[];
}

export function newPickState(): PickState {
  return { keys: new Set(), tokens: [] };
}

/** Titles this alike are the same attraction from another seller (three Petronas Towers tickets). */
const SAME_ATTRACTION = 0.5;

/**
 * Up to `limit` suggestions for a gap, in feed order (nearest, then most
 * popular), skipping anything already suggested or too similar to it
 * (`state`, updated in place).
 * On free days at least one slot goes to a day trip when one fits.
 */
export function pickForGap(
  cards: FeedCard[],
  gap: { start: string; end: string; kind: GapKind },
  state: PickState,
  limit = 3
): FeedSuggestion[] {
  const gapMins = toMins(gap.end) - toMins(gap.start);
  if (gapMins < MIN_GAP_MINS) return [];
  const taken = [...state.tokens];
  const distinct = (c: FeedCard) => {
    const t = tokenize(c.title);
    if (taken.some((u) => titleSimilarity(t, u) >= SAME_ATTRACTION)) return false;
    taken.push(t);
    return true;
  };
  const candidates = cards.filter((c) => !state.keys.has(c.key) && c.offers.length > 0 && fits(c, gap.kind, gapMins));
  const picked: FeedCard[] = [];
  const wantTrip = gap.kind === 'free-day' && candidates.some((c) => c.nearby.tier === 'daytrip');
  for (const c of candidates) {
    if (picked.length >= limit) break;
    // On a free day keep the last slot for a day trip.
    if (wantTrip && picked.length === limit - 1 && c.nearby.tier !== 'daytrip' && !picked.some((p) => p.nearby.tier === 'daytrip')) continue;
    if (distinct(c)) picked.push(c);
  }
  for (const c of picked) {
    state.keys.add(c.key);
    state.tokens.push(tokenize(c.title));
  }
  return picked.map(toSuggestion);
}

export function gapLabel(kind: GapKind, start: string, end: string): string {
  const span = `${start}–${end}`;
  switch (kind) {
    case 'between-sessions': return `Between sessions · ${span} · near the circuit`;
    case 'before-sessions': return `Before the track action · ${span}`;
    case 'after-sessions': return `After the sessions · ${span}`;
    case 'free-day': return `Free day · ${span}`;
  }
}
