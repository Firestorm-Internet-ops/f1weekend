/**
 * Matches provider offers to existing experiences (same product sold on
 * several sites). Pure functions, no I/O.
 *
 * Score 0–1 = title similarity (weighted most) + duration + distance.
 *   ≥ AUTO   → attach as an offer automatically
 *   ≥ REVIEW → goes to the review list; a person decides
 *   below    → no match (a possible new experience)
 * Conservative on purpose: a wrong match sends fans to a different product.
 */
import type { NormalizedOffer } from './types';

export const MATCH_THRESHOLDS = { AUTO: 0.75, REVIEW: 0.5 } as const;

export interface MatchTarget {
  id: number;
  title: string;
  durationHours: number | null;
  lat: number | null;
  lng: number | null;
}

export type MatchDecision = 'auto' | 'review' | 'none';

export interface MatchResult {
  offer: NormalizedOffer;
  target: MatchTarget | null;
  score: number;
  decision: MatchDecision;
  parts: { title: number; duration: number | null; distance: number | null };
}

// Words every listing uses; they say nothing about which product it is.
const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for', 'from', 'with', 'by', 'de', 'la', 'le', 'du', 'des', 'et',
  'tour', 'tours', 'ticket', 'tickets', 'entry', 'entrance', 'admission', 'guided', 'guide', 'private', 'small', 'group',
  'experience', 'visit', 'trip', 'day', 'half', 'full', 'hour', 'hours', 'h', 'min', 'minutes', 'including', 'included',
  'optional', 'skip', 'line', 'the', 'best', 'top', 'your', 'our', 'combo', 'pass', 'access', 'fast', 'track', 'option',
]);

const tokenCache = new Map<string, Set<string>>();

// Place words (the city itself) appear in nearly every title for that race.
export function tokenize(title: string, ignore: string[] = []): Set<string> {
  const key = `${title}\u0000${ignore.join('|')}`;
  const hit = tokenCache.get(key);
  if (hit) return hit;
  const tokens = tokenizeUncached(title, ignore);
  if (tokenCache.size > 5000) tokenCache.clear();
  tokenCache.set(key, tokens);
  return tokens;
}

function tokenizeUncached(title: string, ignore: string[]): Set<string> {
  const ignored = new Set(ignore.flatMap((w) => w.toLowerCase().split(/\s+/)));
  const words = title
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w) && !ignored.has(w))
    .map((w) => (w.length > 4 && w.endsWith('s') ? w.slice(0, -1) : w)); // crude plural fold
  return new Set(words);
}

/**
 * Jaccard, blended with the overlap coefficient when both titles have at
 * least 3 distinctive words, so a short title contained in a long one still
 * scores well — but a single shared word ("walking") never does.
 */
export function titleSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const w of a) if (b.has(w)) inter++;
  const jaccard = inter / (a.size + b.size - inter);
  if (inter < 2 || Math.min(a.size, b.size) < 3) return jaccard;
  const overlap = inter / Math.min(a.size, b.size);
  return 0.5 * jaccard + 0.5 * overlap;
}

const isPrivate = (title: string) => /\bprivate\b/i.test(title);

export function durationSimilarity(a: number | null, b: number | null): number | null {
  if (!a || !b) return null;
  return Math.min(a, b) / Math.max(a, b);
}

export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** 1 at the same spot, 0 at ≥ 3 km apart. */
export function distanceSimilarity(offer: NormalizedOffer, target: MatchTarget): number | null {
  if (offer.lat == null || offer.lng == null || target.lat == null || target.lng == null) return null;
  const km = haversineKm(offer.lat, offer.lng, target.lat, target.lng);
  return Math.max(0, 1 - km / 3);
}

export function scorePair(offer: NormalizedOffer, target: MatchTarget, placeWords: string[] = []): MatchResult['parts'] & { score: number } {
  const title = titleSimilarity(tokenize(offer.title, placeWords), tokenize(target.title, placeWords));
  const duration = durationSimilarity(offer.durationHours, target.durationHours);
  const distance = distanceSimilarity(offer, target);
  // Weights for the signals we have; missing signals don't count against a pair.
  let score = title * 0.7;
  let weight = 0.7;
  if (duration !== null) { score += duration * 0.15; weight += 0.15; }
  if (distance !== null) { score += distance * 0.15; weight += 0.15; }
  score /= weight;
  // Title similarity is the gate: two museum tickets 100 m apart are not the same product.
  if (title < 0.35) score = Math.min(score, title);
  // Never auto-attach when the format clearly differs: a 9 h tour isn't the 4 h one,
  // and a private tour isn't a shared one. A person can still approve it.
  const differs = (duration !== null && duration < 0.6) || isPrivate(offer.title) !== isPrivate(target.title);
  if (differs) score = Math.min(score, MATCH_THRESHOLDS.AUTO - 0.01);
  return { title, duration, distance, score: Math.round(score * 1000) / 1000 };
}

export function decide(score: number): MatchDecision {
  if (score >= MATCH_THRESHOLDS.AUTO) return 'auto';
  if (score >= MATCH_THRESHOLDS.REVIEW) return 'review';
  return 'none';
}

/** Best target for each offer. At most one offer per provider is auto-attached to a target (highest score wins). */
export function matchOffers(offers: NormalizedOffer[], targets: MatchTarget[], placeWords: string[] = []): MatchResult[] {
  const results: MatchResult[] = offers.map((offer) => {
    let best: MatchResult = { offer, target: null, score: 0, decision: 'none', parts: { title: 0, duration: null, distance: null } };
    for (const target of targets) {
      const { score, ...parts } = scorePair(offer, target, placeWords);
      if (score > best.score) best = { offer, target, score, decision: decide(score), parts };
    }
    return best;
  });

  // One product per provider per experience: demote weaker auto-matches to review.
  const taken = new Map<string, MatchResult>();
  for (const r of [...results].sort((a, b) => b.score - a.score)) {
    if (r.decision !== 'auto' || !r.target) continue;
    const key = `${r.offer.provider}:${r.target.id}`;
    if (taken.has(key)) r.decision = 'review';
    else taken.set(key, r);
  }
  return results;
}
