/**
 * Viator Partner API v2 adapter.
 * Docs: https://docs.viator.com/partner-api/technical/
 * Auth: exp-api-key header (VIATOR_API_KEY).
 */
import type { NormalizedOffer, ProviderAdapter, SearchQuery } from './types';

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

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Viator ${path} → HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.json() as Promise<T>;
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
    lat: null, // not in search results; needs /locations/bulk
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

async function findDestinationId(city: string): Promise<string | null> {
  const res = await post<{ destinations?: { results?: { id: number; name: string; parentDestinationId?: number; parentDestinationName?: string }[] } }>(
    '/search/freetext',
    { searchTerm: city, searchTypes: [{ searchType: 'DESTINATIONS', pagination: { start: 1, count: 5 } }], currency: 'EUR' }
  );
  const results = res.destinations?.results ?? [];
  const exact = results.find((d) => d.name.toLowerCase() === city.toLowerCase());
  if (exact) return String(exact.id);
  // e.g. "Monaco" returns "Monaco-Ville" whose parent is Monaco (948)
  const parent = results.find((d) => d.parentDestinationName?.toLowerCase() === city.toLowerCase());
  if (parent?.parentDestinationId) return String(parent.parentDestinationId);
  return results[0] ? String(results[0].id) : null;
}

export const viator: ProviderAdapter = {
  id: 'viator',
  isConfigured: () => Boolean(process.env.VIATOR_API_KEY),

  async search(q: SearchQuery): Promise<NormalizedOffer[]> {
    const destination = await findDestinationId(q.city);
    if (!destination) return [];
    const limit = q.limit ?? 200;
    const out: NormalizedOffer[] = [];
    for (let start = 1; out.length < limit; start += PAGE_SIZE) {
      const res = await post<{ products?: ViatorProduct[]; totalCount?: number }>('/products/search', {
        filtering: { destination },
        sorting: { sort: 'TRAVELER_RATING', order: 'DESCENDING' },
        pagination: { start, count: Math.min(PAGE_SIZE, limit - out.length) },
        currency: q.currency ?? 'EUR',
      });
      const products = res.products ?? [];
      out.push(...products.map(normalizeViator));
      if (products.length === 0 || start + PAGE_SIZE > (res.totalCount ?? 0)) break;
    }
    return out;
  },
};
