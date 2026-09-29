/**
 * GetYourGuide Partner API v1 adapter (search around a point).
 * Auth: X-ACCESS-TOKEN header (GYG_API_KEY).
 * Coordinates are the activity's location — for many tours the city it runs from.
 */
import type { NormalizedOffer, ProviderAdapter, SearchQuery } from './types';
import { stripGygTracking } from './affiliate-url';

const BASE = 'https://api.getyourguide.com/1';
const PAGE_SIZE = 100;

interface GygTour {
  tour_id: number;
  title: string;
  url: string;
  overall_rating?: number;
  number_of_ratings?: number;
  coordinates?: { lat: number; long: number };
  price?: { values?: { amount?: number; special?: { original_price?: number } } };
  durations?: { duration: number; unit: string }[];
  pictures?: { ssl_url?: string; url?: string }[];
  categories?: { name: string }[];
  locations?: { name?: string }[];
  bestseller?: boolean;
  has_pick_up?: boolean;
}

function durationHours(d: GygTour['durations']): number | null {
  const first = d?.[0];
  if (!first) return null;
  const unit = first.unit.toLowerCase();
  const h = unit.startsWith('minute') ? first.duration / 60 : unit.startsWith('day') ? first.duration * 8 : first.duration;
  return Math.round(h * 10) / 10;
}

export function normalizeGyg(t: GygTour, currency: string): NormalizedOffer {
  const price = t.price?.values?.amount ?? null;
  const before = t.price?.values?.special?.original_price ?? null;
  const pic = t.pictures?.[0]?.ssl_url ?? t.pictures?.[0]?.url ?? null;
  return {
    provider: 'getyourguide',
    productId: String(t.tour_id),
    title: t.title,
    url: stripGygTracking(t.url),
    priceAmount: price,
    priceCurrency: currency,
    originalPrice: before && price && before > price ? before : null,
    rating: t.overall_rating != null ? Math.round(t.overall_rating * 10) / 10 : null,
    reviewCount: t.number_of_ratings ?? 0,
    durationHours: durationHours(t.durations),
    lat: t.coordinates?.lat ?? null,
    lng: t.coordinates?.long ?? null,
    // GYG gives the city the tour runs from for most tours.
    locationName: t.locations?.[0]?.name ?? null,
    approximateLocation: true,
    imageUrl: pic ? pic.replace('[format_id]', '97') : null,
    flags: {},
    categories: (t.categories ?? []).map((c) => c.name),
    raw: { bestseller: t.bestseller ?? false, hasPickUp: t.has_pick_up ?? false },
  };
}

export const getyourguide: ProviderAdapter = {
  id: 'getyourguide',
  isConfigured: () => Boolean(process.env.GYG_API_KEY),

  /** Most popular activities within radiusKm of the point. */
  async search(q: SearchQuery): Promise<NormalizedOffer[]> {
    const limit = q.limit ?? 300;
    const currency = q.currency ?? 'EUR';
    const out: NormalizedOffer[] = [];
    for (let offset = 0; out.length < limit; offset += PAGE_SIZE) {
      const qs = new URLSearchParams({
        cnt_language: 'en', currency, limit: String(Math.min(PAGE_SIZE, limit - out.length)), offset: String(offset),
        sortfield: 'popularity', sortdirection: 'DESC',
      });
      for (const c of [q.lat, q.lng, q.radiusKm ?? 50]) qs.append('coordinates[]', String(c));
      const res = await fetch(`${BASE}/tours?${qs}`, { headers: { 'X-ACCESS-TOKEN': process.env.GYG_API_KEY ?? '', accept: 'application/json' } });
      if (!res.ok) throw new Error(`GetYourGuide /tours → HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
      const j = (await res.json()) as { data?: { tours?: GygTour[] }; _metadata?: { totalCount?: number } };
      const tours = j.data?.tours ?? [];
      out.push(...tours.map((t) => normalizeGyg(t, currency)));
      if (tours.length === 0 || offset + PAGE_SIZE >= (j._metadata?.totalCount ?? 0)) break;
    }
    return out;
  },
};
