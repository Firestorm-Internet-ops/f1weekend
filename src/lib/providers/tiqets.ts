/**
 * Tiqets API v2 adapter.
 * Docs: https://api.tiqets.com/v2/docs
 * Auth: "Authorization: Token <TIQETS_API_KEY>".
 */
import type { NormalizedOffer, ProviderAdapter, SearchQuery } from './types';
import { haversineKm } from './match';

/** Text search is fuzzy and worldwide ("Monaco" also finds "Moco Museum" in Barcelona); keep results within this range. */
const MAX_TEXT_RESULT_KM = 40;

const BASE = 'https://api.tiqets.com/v2';
const PAGE_SIZE = 100;

interface TiqetsProduct {
  id: string;
  title: string;
  product_url: string;
  city_name?: string;
  venue?: { name?: string } | null;
  geolocation?: { lat: number; lng: number } | null;
  ratings?: { total?: number; average?: number } | null;
  currency?: string;
  price?: number | null;
  prediscount_price?: number | null;
  duration?: string | null; // "HH:MM"
  images?: { large?: string; medium?: string }[];
  instant_ticket_delivery?: boolean;
  skip_line?: boolean;
  cancellation?: { policy?: string } | null;
  sale_status?: string;
  tag_ids?: string[];
}

function durationHours(d: string | null | undefined): number | null {
  const m = d?.match(/^(\d+):(\d{2})/);
  if (!m) return null;
  return Math.round((Number(m[1]) + Number(m[2]) / 60) * 10) / 10;
}

/**
 * Drops only our per-click campaign param. The partner param the API puts on
 * product_url is this account's affiliate ID and is kept.
 */
export function cleanTiqetsUrl(url: string): string {
  try {
    const u = new URL(url);
    for (const k of ['tq_campaign']) u.searchParams.delete(k);
    return u.toString();
  } catch {
    return url;
  }
}

export function normalizeTiqets(p: TiqetsProduct): NormalizedOffer {
  const price = p.price ?? null;
  const before = p.prediscount_price ?? null;
  const policy = p.cancellation?.policy;
  return {
    provider: 'tiqets',
    productId: String(p.id),
    title: p.title,
    url: cleanTiqetsUrl(p.product_url),
    priceAmount: price,
    priceCurrency: p.currency ?? 'EUR',
    originalPrice: before && price && before > price ? before : null,
    rating: p.ratings?.average ?? null,
    reviewCount: p.ratings?.total ?? 0,
    durationHours: durationHours(p.duration),
    lat: p.geolocation?.lat ?? null,
    lng: p.geolocation?.lng ?? null,
    locationName: p.venue?.name ?? p.city_name ?? null,
    approximateLocation: false,
    imageUrl: p.images?.[0]?.large ?? p.images?.[0]?.medium ?? null,
    flags: {
      instantConfirmation: p.instant_ticket_delivery ?? undefined,
      skipTheLine: p.skip_line ?? undefined,
      freeCancellation: policy ? policy !== 'never' : undefined,
    },
    categories: p.tag_ids ?? [],
    raw: p,
  };
}

async function list(params: Record<string, string>, limit: number): Promise<TiqetsProduct[]> {
  const out: TiqetsProduct[] = [];
  for (let page = 1; out.length < limit; page++) {
    const qs = new URLSearchParams({ lang: 'en', page_size: String(PAGE_SIZE), page: String(page), ...params });
    const res = await fetch(`${BASE}/products?${qs}`, {
      headers: { Authorization: `Token ${process.env.TIQETS_API_KEY ?? ''}`, Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Tiqets /products → HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const j = (await res.json()) as { products?: TiqetsProduct[]; pagination?: { total?: number } };
    const products = j.products ?? [];
    out.push(...products);
    if (products.length < PAGE_SIZE || page * PAGE_SIZE >= (j.pagination?.total ?? 0)) break;
  }
  return out.slice(0, limit);
}

export const tiqets: ProviderAdapter = {
  id: 'tiqets',
  isConfigured: () => Boolean(process.env.TIQETS_API_KEY),

  /** Products within radiusKm of the point, plus products that name the city (tours from nearby towns). */
  async search(q: SearchQuery): Promise<NormalizedOffer[]> {
    const limit = q.limit ?? 300;
    const currency = q.currency ?? 'EUR';
    const [near, named] = await Promise.all([
      list({ lat: String(q.lat), lng: String(q.lng), max_distance: String(q.radiusKm ?? 15), currency }, limit),
      list({ query: q.query ?? q.city, currency }, limit),
    ]);
    const cityWord = new RegExp(`\\b${q.city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    const nearEnough = (p: TiqetsProduct) =>
      p.geolocation
        ? haversineKm(q.lat, q.lng, p.geolocation.lat, p.geolocation.lng) <= Math.max(MAX_TEXT_RESULT_KM, q.radiusKm ?? 0)
        : cityWord.test(p.title);
    const byId = new Map<string, TiqetsProduct>();
    // Out-of-season products are kept: the race weekend may fall in season.
    for (const p of [...near, ...named.filter(nearEnough)]) byId.set(String(p.id), p);
    return [...byId.values()].map(normalizeTiqets);
  },
};
