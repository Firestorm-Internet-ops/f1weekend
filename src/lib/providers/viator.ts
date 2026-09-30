/**
 * Viator Partner API v2 adapter.
 * Docs: https://docs.viator.com/partner-api/technical/
 * Auth: exp-api-key header (VIATOR_API_KEY).
 */
import type { NormalizedOffer, ProviderAdapter, SearchQuery } from './types';
import { haversineKm } from './match';

const BASE = 'https://api.viator.com/partner';
const PAGE_SIZE = 50; // API maximum per page

function headers(): Record<string, string> {
  return {
    'exp-api-key': process.env.VIATOR_API_KEY ?? '',
    Accept: 'application/json;version=2.0',
    'Accept-Language': 'en-US',
    'Content-Type': 'application/json',
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** POST with two retries on rate limits (429) and server errors, 1 s then 2 s apart. */
async function post<T>(path: string, body: unknown): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${BASE}${path}`, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
    if (res.ok) return res.json() as Promise<T>;
    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt >= 2) throw new Error(`Viator ${path} → HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    await sleep(1000 * 2 ** attempt);
  }
}

interface ViatorProduct {
  productCode: string;
  title: string;
  images?: { isCover?: boolean; variants?: { width: number; height: number; url: string }[] }[];
  reviews?: { totalReviews?: number; combinedAverageRating?: number };
  duration?: { fixedDurationInMinutes?: number; variableDurationFromMinutes?: number; variableDurationToMinutes?: number };
  confirmationType?: string;
  pricing?: { summary?: { fromPrice?: number; fromPriceBeforeDiscount?: number }; currency?: string };
  productUrl: string;
  flags?: string[];
  tags?: number[];
}

function durationHours(d: ViatorProduct['duration']): number | null {
  const mins = d?.fixedDurationInMinutes ?? d?.variableDurationToMinutes ?? d?.variableDurationFromMinutes;
  return mins ? Math.round((mins / 60) * 10) / 10 : null;
}

function coverImage(p: ViatorProduct): string | null {
  const img = p.images?.find((i) => i.isCover) ?? p.images?.[0];
  const variants = [...(img?.variants ?? [])].sort((a, b) => b.width - a.width);
  return variants.find((v) => v.width <= 800)?.url ?? variants[0]?.url ?? null;
}

/**
 * Drops only our per-click campaign param. pid/mcid/medium on productUrl are
 * this account's affiliate IDs and are kept.
 */
export function cleanViatorUrl(url: string): string {
  try {
    const u = new URL(url);
    for (const k of ['campaign']) u.searchParams.delete(k);
    return u.toString();
  } catch {
    return url;
  }
}

export function normalizeViator(p: ViatorProduct): NormalizedOffer {
  const flags = p.flags ?? [];
  const price = p.pricing?.summary?.fromPrice ?? null;
  const before = p.pricing?.summary?.fromPriceBeforeDiscount ?? null;
  return {
    provider: 'viator',
    productId: p.productCode,
    title: p.title,
    url: cleanViatorUrl(p.productUrl),
    priceAmount: price,
    priceCurrency: p.pricing?.currency ?? 'EUR',
    originalPrice: before && price && before > price ? before : null,
    rating: p.reviews?.combinedAverageRating != null ? Math.round(p.reviews.combinedAverageRating * 10) / 10 : null,
    reviewCount: p.reviews?.totalReviews ?? 0,
    durationHours: durationHours(p.duration),
    lat: null, // not in search results; search() uses the destination centre
    lng: null,
    imageUrl: coverImage(p),
    flags: {
      instantConfirmation: p.confirmationType === 'INSTANT',
      skipTheLine: flags.includes('SKIP_THE_LINE'),
      freeCancellation: flags.includes('FREE_CANCELLATION'),
    },
    categories: (p.tags ?? []).map(String),
    raw: p,
  };
}

interface ViatorDestination {
  destinationId: number;
  name: string;
  type?: string;
  center?: { latitude: number; longitude: number };
}

let destinationsCache: Promise<ViatorDestination[]> | null = null;

/** All Viator destinations (≈3,400), with centre coordinates. Cached per process. */
function allDestinations(): Promise<ViatorDestination[]> {
  destinationsCache ??= fetch(`${BASE}/destinations`, { headers: headers() })
    .then(async (res) => {
      if (!res.ok) throw new Error(`Viator /destinations → HTTP ${res.status}`);
      const j = (await res.json()) as { destinations?: ViatorDestination[] } | ViatorDestination[];
      return Array.isArray(j) ? j : j.destinations ?? [];
    })
    .catch((err) => {
      destinationsCache = null;
      throw err;
    });
  return destinationsCache;
}

/** Destinations whose centre is within radiusKm of the point, nearest first. */
export async function destinationsNear(lat: number, lng: number, radiusKm: number) {
  return (await allDestinations())
    // Places, not parks or regions: those centres can be far from where tours start.
    .filter((d) => d.center && ['CITY', 'TOWN', 'NEIGHBORHOOD', 'ISLAND'].includes(d.type ?? 'CITY'))
    .map((d) => ({ ...d, km: haversineKm(lat, lng, d.center!.latitude, d.center!.longitude) }))
    .filter((d) => d.km <= radiusKm)
    .sort((a, b) => a.km - b.km);
}

async function searchDestination(destination: string, limit: number, currency: string): Promise<ViatorProduct[]> {
  const out: ViatorProduct[] = [];
  for (let start = 1; out.length < limit; start += PAGE_SIZE) {
    const res = await post<{ products?: ViatorProduct[]; totalCount?: number }>('/products/search', {
      filtering: { destination },
      sorting: { sort: 'TRAVELER_RATING', order: 'DESCENDING' },
      pagination: { start, count: Math.min(PAGE_SIZE, limit - out.length) },
      currency,
    });
    const products = res.products ?? [];
    out.push(...products);
    if (products.length === 0 || start + PAGE_SIZE > (res.totalCount ?? 0)) break;
  }
  return out;
}

export const viator: ProviderAdapter = {
  id: 'viator',
  isConfigured: () => Boolean(process.env.VIATOR_API_KEY),

  /**
   * Best-rated products in every Viator destination whose centre is within
   * radiusKm. Search results carry no coordinates (product locations are
   * Google place IDs), so each product gets its destination's centre.
   */
  async search(q: SearchQuery): Promise<NormalizedOffer[]> {
    const perDestination = q.limit ?? 100;
    const currency = q.currency ?? 'EUR';
    const dests = await destinationsNear(q.lat, q.lng, q.radiusKm ?? 50);
    const byCode = new Map<string, NormalizedOffer>();
    const errors: string[] = [];
    for (const d of dests) {
      // One destination failing (e.g. Batam) mustn't drop Viator from the whole race.
      let products: ViatorProduct[];
      try {
        products = await searchDestination(String(d.destinationId), perDestination, currency);
      } catch (err) {
        errors.push(`${d.name}: ${(err as Error).message.slice(0, 120)}`);
        continue;
      }
      for (const p of products) {
        if (byCode.has(p.productCode)) continue;
        const n = normalizeViator(p);
        n.lat = d.center!.latitude;
        n.lng = d.center!.longitude;
        n.locationName = d.name;
        n.approximateLocation = true;
        byCode.set(p.productCode, n);
      }
    }
    if (errors.length > 0 && errors.length === dests.length) throw new Error(`Viator: every destination failed. ${errors[0]}`);
    if (errors.length > 0) console.warn(`[viator] ${errors.length}/${dests.length} destinations failed:`, errors.join(' | '));
    return [...byCode.values()];
  },
};
