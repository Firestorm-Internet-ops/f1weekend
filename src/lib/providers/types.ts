/**
 * Provider-neutral shapes for experiences sold by several booking sites.
 * One experience (editorial page, slug) can have many offers — one per
 * provider product. See docs/next-steps.html, "Multi-provider".
 */

export const PROVIDER_IDS = ['getyourguide', 'viator', 'tiqets'] as const;
export type ProviderId = typeof PROVIDER_IDS[number];

export type ClickSource = 'feed' | 'itinerary' | 'featured' | 'map' | 'guide';

export interface OfferFlags {
  instantConfirmation?: boolean;
  skipTheLine?: boolean;
  freeCancellation?: boolean;
}

/** One provider product, normalised. Produced by adapters, stored in experience_offers. */
export interface NormalizedOffer {
  provider: ProviderId;
  productId: string;
  title: string;
  /** Clean product URL, without our tracking params. */
  url: string;
  priceAmount: number | null;
  priceCurrency: string;
  originalPrice: number | null;
  /** 0–5 scale. */
  rating: number | null;
  reviewCount: number;
  durationHours: number | null;
  lat: number | null;
  lng: number | null;
  imageUrl: string | null;
  flags: OfferFlags;
  categories: string[];
  /** Original payload, kept for re-processing. */
  raw: unknown;
}

/** An offer as the site reads it (DB row, or synthesised from the experience's own GYG columns). */
export interface Offer {
  /** experience_offers.id; null when synthesised from legacy experience columns. */
  id: number | null;
  experienceId: number;
  provider: ProviderId;
  productId: string | null;
  url: string;
  priceAmount: number | null;
  priceCurrency: string;
  originalPrice: number | null;
  rating: number | null;
  reviewCount: number;
  flags: OfferFlags;
  isPrimary: boolean;
}

export interface SearchQuery {
  city: string;
  lat: number;
  lng: number;
  radiusKm?: number;
  query?: string;
  currency?: string;
  limit?: number;
}

export interface ProviderAdapter {
  id: ProviderId;
  /** True when the API key this adapter needs is present. */
  isConfigured(): boolean;
  search(q: SearchQuery): Promise<NormalizedOffer[]>;
}

export interface AffiliateContext {
  experienceId: number;
  source: ClickSource;
}
