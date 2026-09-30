/**
 * What makes the live feed more than a provider listing:
 *  - honest travel times: curated "zones" per race (how fans really get from
 *    the city to the circuit) instead of one road-speed formula for everything;
 *  - day trips named by where they go ("Malacca"), not "In Kuala Lumpur";
 *  - no venue repeated near the top (three Batu Caves tours in a row);
 *  - which session gap each experience fits ("Fits Fri before FP1 12:30");
 *  - three editorial picks for the weekend.
 * Pure functions, unit-tested.
 */
import { haversineKm, raceKey, type LatLng } from '@/lib/nearby';
import { titleSimilarity, tokenize } from './match';
import type { FeedCard, FeedCategory } from './nearby-feed';
import type { Session } from '@/types/race';

// ─── Travel zones ─────────────────────────────────────────────────

export interface TravelZone extends LatLng {
  /** Place name shown on the card ("Kuala Lumpur"). */
  name: string;
  radiusKm: number;
  /** Typical race-day minutes from the zone to the circuit. */
  mins: number;
  /** How ("by KLIA Ekspres + shuttle"). */
  how: string;
}

/**
 * Where fans stay when the circuit is out of town, with realistic race-day
 * times to the circuit. City-centre circuits (Singapore, Las Vegas) need none.
 */
export const RACE_ZONES: Record<string, TravelZone[]> = {
  bahrain: [ // Sepang, 2026
    { name: 'Kuala Lumpur', lat: 3.1579, lng: 101.7116, radiusKm: 15, mins: 60, how: 'by KLIA Ekspres + shuttle' },
    { name: 'Putrajaya', lat: 2.9264, lng: 101.6964, radiusKm: 10, mins: 30, how: 'by car' },
  ],
  usa: [{ name: 'Austin', lat: 30.2672, lng: -97.7431, radiusKm: 12, mins: 45, how: 'by race shuttle' }],
  mexico: [{ name: 'Mexico City centre', lat: 19.4326, lng: -99.1332, radiusKm: 9, mins: 40, how: 'by metro or car' }],
  brazil: [{ name: 'São Paulo centre', lat: -23.5614, lng: -46.6559, radiusKm: 9, mins: 60, how: 'by train (CPTM line 9) or car' }],
  qatar: [{ name: 'Doha', lat: 25.2854, lng: 51.531, radiusKm: 12, mins: 35, how: 'by car or metro + shuttle' }],
  'abu-dhabi': [{ name: 'Abu Dhabi city', lat: 24.4539, lng: 54.3773, radiusKm: 12, mins: 35, how: 'by car or shuttle' }],
};

export function zoneFor(p: { lat?: number | null; lng?: number | null } | null | undefined, raceSlug: string): TravelZone | null {
  if (p?.lat == null || p?.lng == null) return null;
  const here = { lat: p.lat, lng: p.lng };
  return (RACE_ZONES[raceKey(raceSlug)] ?? []).find((z) => haversineKm(here, z) <= z.radiusKm) ?? null;
}

const hm = (mins: number) => (mins >= 60 ? `${Math.floor(mins / 60)}h${mins % 60 ? ` ${String(mins % 60).padStart(2, '0')}` : ''}` : `${mins} min`);

export function zoneLabel(z: TravelZone): string {
  return `~${hm(z.mins)} from the circuit ${z.how}`;
}

// ─── Day-trip destinations ────────────────────────────────────────

/** Out-of-town destinations as fans know them, matched in titles. */
const DESTINATIONS: [RegExp, string][] = [
  [/\b(malacca|melaka)\b/i, 'Malacca'],
  [/\bgenting\b/i, 'Genting Highlands'],
  [/\bcameron highlands?\b/i, 'Cameron Highlands'],
  [/\bfraser'?s? hill\b/i, "Fraser's Hill"],
  [/\bkuala selangor\b|\bfireflies\b/i, 'Kuala Selangor'],
  [/\bport dickson\b/i, 'Port Dickson'],
  [/\btaman negara\b/i, 'Taman Negara'],
  [/\bsentosa\b/i, 'Sentosa'],
  [/\bbintan\b/i, 'Bintan'],
  [/\bbatam\b/i, 'Batam'],
  [/\bjohor\b/i, 'Johor Bahru'],
  [/\bsan antonio\b/i, 'San Antonio'],
  [/\bfredericksburg\b|\bhill country\b/i, 'Texas Hill Country'],
  [/\bteotihuac[aá]n\b/i, 'Teotihuacán'],
  [/\bpuebla\b/i, 'Puebla'],
  [/\bgrand canyon\b/i, 'Grand Canyon'],
  [/\bhoover dam\b/i, 'Hoover Dam'],
  [/\bantelope canyon\b/i, 'Antelope Canyon'],
  [/\bzion\b/i, 'Zion'],
  [/\bdeath valley\b/i, 'Death Valley'],
  [/\bvalley of fire\b/i, 'Valley of Fire'],
  [/\bsanto?s\b|\bguaruj[aá]\b/i, 'Santos coast'],
  [/\bdesert safari\b|\bdunes?\b/i, 'the desert'],
  [/\bdubai\b/i, 'Dubai'],
  [/\babu dhabi\b/i, 'Abu Dhabi'],
];

/** "Malacca" for "From Kuala Lumpur: Malacca Heritage Day Trip". */
export function destinationOf(title: string): string | null {
  for (const [re, name] of DESTINATIONS) if (re.test(title)) return name;
  return null;
}

// ─── One card per venue near the top ──────────────────────────────

/** Landmarks sold by many tours; a card about one is "that venue". */
const LANDMARKS: [RegExp, string][] = [
  [/\bbatu caves?\b/i, 'batu-caves'],
  [/\b(petronas|twin towers|klcc)\b/i, 'petronas'],
  [/\b(kl tower|menara)\b/i, 'kl-tower'],
  [/\bputrajaya\b/i, 'putrajaya'],
  [/\bthean hou\b/i, 'thean-hou'],
  [/\baquaria\b/i, 'aquaria'],
  [/\bsunway lagoon\b/i, 'sunway-lagoon'],
  [/\bgardens by the bay\b/i, 'gardens-by-the-bay'],
  [/\bmarina bay sands\b|\bskypark\b/i, 'mbs'],
  [/\buniversal studios\b/i, 'universal'],
  [/\bnight safari\b/i, 'night-safari'],
  [/\bsingapore flyer\b/i, 'flyer'],
  [/\bsphere\b/i, 'sphere'],
  [/\bhigh roller\b/i, 'high-roller'],
];

export function venueKey(title: string): string | null {
  for (const [re, key] of LANDMARKS) if (re.test(title)) return key;
  for (const [re, name] of DESTINATIONS) if (re.test(title)) return `trip:${name}`;
  return null;
}

/** Same venue: a known landmark, or titles this alike. */
const SAME_TITLE = 0.5;

/**
 * Keeps the order but moves a card down when its venue already appears in
 * the first `top` cards, so the top of the list shows different places.
 */
export function diversify(cards: FeedCard[], top = 24): FeedCard[] {
  const lead: FeedCard[] = [];
  const later: FeedCard[] = [];
  const keys = new Set<string>();
  const tokens: Set<string>[] = [];
  for (const c of cards) {
    const key = venueKey(c.title);
    const t = tokenize(c.title);
    const repeat = (key != null && keys.has(key)) || tokens.some((u) => titleSimilarity(t, u) >= SAME_TITLE);
    if (lead.length < top && !repeat) {
      lead.push(c);
      if (key) keys.add(key);
      tokens.push(t);
    } else {
      later.push(c);
    }
  }
  return [...lead, ...later];
}

// ─── A mix of booking sites ───────────────────────────────────────

/** The site a card books on (the cheapest offer, shown as "on GetYourGuide"). */
const siteOf = (c: FeedCard) => c.offers[0]?.provider ?? c.key.split(':')[0];

/**
 * GetYourGuide tours carry the most reviews, so ranking by reviews alone
 * fills the first page with one site. Keeps the order, but never shows more
 * than `maxRun` cards in a row from the same site: the next card from another
 * site (within `lookahead` places) moves up instead.
 */
export function mixSites(cards: FeedCard[], maxRun = 2, lookahead = 30): FeedCard[] {
  const rest = [...cards];
  const out: FeedCard[] = [];
  while (rest.length > 0) {
    const run = out.slice(-maxRun).map(siteOf);
    const blocked = run.length === maxRun && run.every((x) => x === run[0]) ? run[0] : null;
    let i = 0;
    if (blocked && siteOf(rest[0]) === blocked) {
      const j = rest.slice(0, lookahead).findIndex((c) => siteOf(c) !== blocked);
      if (j > 0) i = j;
    }
    out.push(rest.splice(i, 1)[0]);
  }
  return out;
}

// ─── Session gaps ─────────────────────────────────────────────────

type Day = Session['dayOfWeek'];
const DAY_SHORT: Record<string, string> = { Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun' };
const F1_TYPES = new Set(['practice', 'qualifying', 'sprint', 'race']);
const DAY_START = 8 * 60;
const DAY_END = 23 * 60;
/** Be back this long before a session starts (security, finding your seat). */
const ARRIVE_EARLY = 45;
/** An experience of unknown length is assumed to take this long. */
const UNKNOWN_MINS = 180;

const toMins = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

export interface WeekendGap {
  day: Day | 'Thursday';
  start: number;
  end: number;
  /** Where you start and end: "city" = mornings/evenings, "circuit" = between sessions, "free" = no F1 that day. */
  from: 'city' | 'circuit' | 'free';
  label: string;
}

const sessionName = (s: Session) => (s.sessionType === 'race' ? 'the race' : s.shortName || s.name);

/** Free time around the F1 sessions, day by day, the free Thursday (no sessions) last. */
export function weekendGaps(sessions: Session[]): WeekendGap[] {
  const f1 = sessions.filter((s) => F1_TYPES.has(s.sessionType));
  const gaps: WeekendGap[] = [];
  for (const day of ['Thursday', 'Friday', 'Saturday', 'Sunday'] as const) {
    const today = f1.filter((s) => s.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
    const short = DAY_SHORT[day];
    if (today.length === 0) {
      if (day === 'Thursday') gaps.push({ day, start: DAY_START, end: 22 * 60, from: 'free', label: 'Fits Thursday, before the track action' });
      continue;
    }
    const first = today[0];
    gaps.push({ day, start: DAY_START, end: toMins(first.startTime) - ARRIVE_EARLY, from: 'city', label: `Fits ${short} before ${sessionName(first)} ${first.startTime}` });
    for (let i = 0; i < today.length - 1; i++) {
      const a = today[i], b = today[i + 1];
      gaps.push({ day, start: toMins(a.endTime), end: toMins(b.startTime) - ARRIVE_EARLY, from: 'circuit', label: `Fits ${short} between ${sessionName(a)} and ${sessionName(b)}` });
    }
    const last = today[today.length - 1];
    gaps.push({ day, start: toMins(last.endTime), end: DAY_END, from: 'city', label: `Fits ${short} after ${sessionName(last)} (ends ${last.endTime})` });
  }
  // Race-weekend gaps first; the free Thursday is the fallback (mostly day trips),
  // otherwise every card would just say "Fits Thursday".
  return gaps.filter((g) => g.end - g.start >= 60).sort((a, b) => Number(a.from === 'free') - Number(b.from === 'free'));
}

/** The first gap of the weekend an experience fits, as a card line. */
export function gapFitLabel(card: Pick<FeedCard, 'durationHours' | 'circuitMins' | 'category' | 'nearby'>, gaps: WeekendGap[]): string | null {
  const duration = card.durationHours ? Math.round(card.durationHours * 60) : UNKNOWN_MINS;
  const travel = card.circuitMins;
  for (const g of gaps) {
    const len = g.end - g.start;
    if (card.category === 'daytrip' || card.nearby.tier === 'daytrip') {
      if (g.from === 'free' && duration <= len) return g.label;
      continue;
    }
    if (g.from === 'free') {
      if (duration <= len) return g.label;
      continue;
    }
    if (travel == null) continue;
    // Between sessions you leave from and return to the circuit; mornings and
    // evenings you're in town and make one trip to or from the circuit.
    const need = g.from === 'circuit' ? duration + 2 * travel : duration + travel;
    if (need <= len) return g.label;
  }
  return null;
}

export function withGapLabels(cards: FeedCard[], sessions: Session[]): FeedCard[] {
  const gaps = weekendGaps(sessions);
  if (gaps.length === 0) return cards;
  return cards.map((c) => ({ ...c, fitsLabel: gapFitLabel(c, gaps) }));
}

// ─── Editorial picks ──────────────────────────────────────────────

/**
 * Three picks for the weekend: well reviewed (4.5★+, 100+ reviews), fitting a
 * session gap, each a different kind of thing and a different venue.
 * `cards` are in recommended order.
 */
export function editorialPicks(cards: FeedCard[], n = 3): FeedCard[] {
  const picks: FeedCard[] = [];
  const cats = new Set<FeedCategory>();
  const venues = new Set<string>();
  for (const c of cards) {
    if (picks.length >= n) break;
    if ((c.rating ?? 0) < 4.5 || c.reviewCount < 100 || !c.fitsLabel || !c.imageUrl) continue;
    if (cats.has(c.category)) continue;
    const v = venueKey(c.title) ?? c.key;
    if (venues.has(v)) continue;
    picks.push(c);
    cats.add(c.category);
    venues.add(v);
  }
  return picks;
}
