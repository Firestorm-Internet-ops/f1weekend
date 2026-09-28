import { unstable_cache } from 'next/cache';
import { getDb } from '@/lib/db';
import { experience_offers } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { toProviderId, sortOffers, type Offer, type OfferFlags } from '@/lib/providers';
import type { Experience } from '@/types/experience';

const CACHE_TTL = 3600;

function mapOffer(r: typeof experience_offers.$inferSelect): Offer {
  return {
    id: r.id,
    experienceId: r.experience_id,
    provider: toProviderId(r.provider),
    productId: r.product_id,
    url: r.url,
    priceAmount: r.price_amount !== null ? Number(r.price_amount) : null,
    priceCurrency: r.price_currency ?? 'EUR',
    originalPrice: r.original_price !== null ? Number(r.original_price) : null,
    rating: r.rating !== null ? Number(r.rating) : null,
    reviewCount: r.review_count ?? 0,
    flags: (r.flags as OfferFlags | null) ?? {},
    isPrimary: r.is_primary ?? false,
  };
}

/** The experience's own booking link as an offer (used until/unless experience_offers has rows). */
export function legacyOffer(exp: Experience): Offer | null {
  if (!exp.affiliateUrl) return null;
  return {
    id: null,
    experienceId: exp.id,
    provider: toProviderId(exp.affiliatePartner),
    productId: null,
    url: exp.affiliateUrl,
    priceAmount: exp.priceAmount || null,
    priceCurrency: exp.priceCurrency,
    originalPrice: exp.originalPrice,
    rating: exp.rating || null,
    reviewCount: exp.reviewCount,
    flags: {
      instantConfirmation: exp.instantConfirmation ?? undefined,
      skipTheLine: exp.skipTheLine ?? undefined,
    },
    isPrimary: true,
  };
}

async function fetchOfferRows(experienceId: number) {
  return unstable_cache(
    async () => {
      const db = await getDb();
      return db
        .select()
        .from(experience_offers)
        .where(and(eq(experience_offers.experience_id, experienceId), eq(experience_offers.is_active, true)));
    },
    [`offers:exp:${experienceId}`],
    { revalidate: CACHE_TTL, tags: ['experiences', 'offers'] }
  )();
}

/**
 * All active offers for an experience. Falls back to the experience's own
 * affiliate columns when the offers table has no rows for it — or does not
 * exist yet (before scripts/migrate-add-experience-offers.ts has run).
 */
export async function getOffersForExperience(exp: Experience): Promise<Offer[]> {
  let rows: Awaited<ReturnType<typeof fetchOfferRows>> = [];
  try {
    rows = await fetchOfferRows(exp.id);
  } catch (err) {
    console.warn('[offers] falling back to experience columns:', (err as Error).message);
  }
  if (rows.length > 0) return sortOffers(rows.map(mapOffer));
  const legacy = legacyOffer(exp);
  return legacy ? [legacy] : [];
}
