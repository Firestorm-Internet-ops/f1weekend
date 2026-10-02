/**
 * "Unique data" race pages (SEO experiment, src/data/seo-experiments.ts):
 * numbers nobody else publishes, worked out from our own sources: the live
 * tours (price guide, session-gap planner), the F1 timetable, race-day
 * weather history (Open-Meteo) and results (Jolpica). Pure functions, tested.
 */
import { gapFitLabel, weekendGaps } from '@/lib/providers/feed-enrich';
import { recommendedScore, type FeedCard, type FeedCategory } from '@/lib/providers/nearby-feed';
import type { Session } from '@/types/race';

// ─── Tour price guide ─────────────────────────────────────────────

export interface PriceBand {
  category: FeedCategory;
  count: number;
  /** Lower quartile, median and upper quartile of "from" prices. */
  low: number;
  median: number;
  high: number;
  currency: string;
}

function quantile(sorted: number[], q: number): number {
  const i = (sorted.length - 1) * q;
  const lo = Math.floor(i), hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

/** Typical "from" price per kind of tour (categories with at least `min` priced tours), cheapest kind first. */
export function priceGuide(cards: FeedCard[], min = 5): PriceBand[] {
  const by = new Map<FeedCategory, { prices: number[]; currency: string }>();
  for (const c of cards) {
    const o = c.offers[0];
    if (!o || o.priceAmount == null || o.priceAmount <= 0) continue;
    const e = by.get(c.category) ?? { prices: [], currency: o.priceCurrency };
    if (o.priceCurrency !== e.currency) continue; // one currency per band
    e.prices.push(o.priceAmount);
    by.set(c.category, e);
  }
  const bands: PriceBand[] = [];
  for (const [category, { prices, currency }] of by) {
    if (prices.length < min) continue;
    const s = [...prices].sort((a, b) => a - b);
    bands.push({ category, count: s.length, low: quantile(s, 0.25), median: quantile(s, 0.5), high: quantile(s, 0.75), currency });
  }
  return bands.sort((a, b) => a.median - b.median);
}

// ─── Session-gap planner ──────────────────────────────────────────

export interface GapPlan {
  label: string;
  /** Tours that fit this gap (first gap of the weekend they fit). */
  count: number;
  top: FeedCard[];
}

/**
 * For each free slot of the race weekend, how many tours fit it and the three
 * best (recommended order). A tour counts towards the first slot it fits.
 */
export function gapPlanner(cards: FeedCard[], sessions: Session[], perGap = 3): GapPlan[] {
  // No timetable yet: nothing to plan around (not every tour "fits Thursday").
  if (sessions.length === 0) return [];
  const gaps = weekendGaps(sessions);
  if (gaps.length === 0) return [];
  const plans = new Map<string, FeedCard[]>(gaps.map((g) => [g.label, []]));
  for (const c of cards) {
    const label = gapFitLabel(c, gaps);
    if (label) plans.get(label)?.push(c);
  }
  return gaps
    .map((g) => {
      const list = (plans.get(g.label) ?? []).sort((a, b) => recommendedScore(b) - recommendedScore(a));
      return { label: g.label, count: list.length, top: list.slice(0, perGap) };
    })
    .filter((p) => p.count > 0);
}

// ─── Race-day weather history ─────────────────────────────────────

export interface RaceDayWeather {
  season: number;
  date: string;
  rainMm: number | null;
  maxC: number | null;
  minC: number | null;
}

/** Rain on the day at all (≥ 1 mm) and a downpour (≥ 10 mm). */
export const WET_MM = 1;
export const HEAVY_MM = 10;

export interface WeatherSummary {
  years: number;
  wet: number;
  heavy: number;
  heavyYears: number[];
  avgMaxC: number | null;
  avgMinC: number | null;
}

const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);

export function weatherSummary(days: RaceDayWeather[]): WeatherSummary {
  const known = days.filter((d) => d.rainMm != null);
  return {
    years: known.length,
    wet: known.filter((d) => d.rainMm! >= WET_MM).length,
    heavy: known.filter((d) => d.rainMm! >= HEAVY_MM).length,
    heavyYears: known.filter((d) => d.rainMm! >= HEAVY_MM).map((d) => d.season).sort((a, b) => a - b),
    avgMaxC: avg(days.flatMap((d) => (d.maxC == null ? [] : [d.maxC]))),
    avgMinC: avg(days.flatMap((d) => (d.minC == null ? [] : [d.minC]))),
  };
}

// ─── Form guide ───────────────────────────────────────────────────

export interface Win {
  season: number;
  driver: string;
  team: string;
}

/** Wins per team, most first (ties: most recent win first). */
export function winsByTeam(wins: Win[]): { team: string; wins: number; last: number }[] {
  const m = new Map<string, { wins: number; last: number }>();
  for (const w of wins) {
    const e = m.get(w.team) ?? { wins: 0, last: 0 };
    m.set(w.team, { wins: e.wins + 1, last: Math.max(e.last, w.season) });
  }
  return [...m.entries()].map(([team, e]) => ({ team, ...e })).sort((a, b) => b.wins - a.wins || b.last - a.last);
}

// ─── Formatting ───────────────────────────────────────────────────

export function money(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Math.round(amount));
  } catch {
    return `${currency} ${Math.round(amount)}`;
  }
}
