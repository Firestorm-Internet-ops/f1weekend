import { unstable_cache } from 'next/cache';
import { getDb } from '@/lib/db';
import { experiences, experience_windows, experience_windows_map } from '@/lib/db/schema';
import { eq, and, asc, desc, inArray, ne, isNotNull } from 'drizzle-orm';
import { getRaceBySlug } from '@/services/race.service';
import type { Experience, Category, ExperienceFilter, FAQItem } from '@/types/experience';

const CACHE_TTL = 3600; // 1 hour

function mapExperience(r: typeof experiences.$inferSelect): Experience {
  return {
    id: r.id,
    raceId: r.race_id ?? 0,
    title: r.title ?? '',
    slug: r.slug ?? '',
    description: r.description ?? '',
    shortDescription: r.short_description ?? '',
    abstract: r.abstract ?? null,
    category: (r.category ?? 'culture') as Category,
    durationHours: Number(r.duration_hours),
    durationLabel: r.duration_label ?? '',
    priceAmount: Number(r.price_amount),
    priceCurrency: r.price_currency ?? 'AUD',
    priceLabel: r.price_label ?? '',
    rating: Number(r.rating),
    reviewCount: r.review_count ?? 0,
    imageUrl: r.image_url ?? null,
    imageEmoji: r.image_emoji ?? '',
    affiliatePartner: r.affiliate_partner ?? '',
    affiliateUrl: r.affiliate_url ?? '',
    isFeatured: r.is_featured ?? false,
    tag: r.tag ?? null,
    sortOrder: r.sort_order ?? 0,
    highlights: (r.highlights as string[] | null) ?? null,
    includes: (r.includes as string[] | null) ?? null,
    excludes: (r.excludes as string[] | null) ?? null,
    importantInfo: r.important_info ?? null,
    photos: (r.photos as string[] | null) ?? null,
    reviewsSnapshot: (r.reviews_snapshot as import('@/types/experience').ReviewSnapshot[] | null) ?? null,
    f1Context: r.f1_context ?? null,
    meetingPoint: r.meeting_point ?? null,
    bestseller: r.bestseller ?? null,
    originalPrice: r.original_price !== null ? Number(r.original_price) : null,
    discountPct: r.discount_pct ?? null,
    hasPickUp: r.has_pick_up ?? null,
    mobileVoucher: r.mobile_voucher ?? null,
    instantConfirmation: r.instant_confirmation ?? null,
    skipTheLine: r.skip_the_line ?? null,
    optionsSnapshot: (r.options_snapshot as import('@/types/experience').OptionSnapshot[] | null) ?? null,
    gygCategories: (r.gyg_categories as string[] | null) ?? null,
    seoKeywords: (r.seo_keywords as string[] | null) ?? null,
    f1WindowsLabel: r.f1_windows_label ?? null,
    lat: r.lat !== null && r.lat !== undefined ? Number(r.lat) : null,
    lng: r.lng !== null && r.lng !== undefined ? Number(r.lng) : null,
    languages: (r.languages as string[] | null) ?? null,
    distanceKm: r.distance_km !== null && r.distance_km !== undefined ? Number(r.distance_km) : null,
    neighborhood: r.neighborhood ?? null,
    travelMins: r.travel_mins ?? null,
    guideArticle: r.guide_article ?? null,
    faqItems: (r.faq_items as FAQItem[] | null) ?? null,
  };
}

function popularityScore(r: typeof experiences.$inferSelect): number {
  let score = 0;
  if (r.is_featured) score += 1000;
  if (r.bestseller) score += 300;
  score += Math.min((r.review_count ?? 0) / 10, 200);
  score += (Number(r.rating) ?? 0) * 20;
  score -= (r.sort_order ?? 99) * 2;
  return score;
}

function applySortOrder(query: typeof experiences.$inferSelect[], sort?: ExperienceFilter['sort']) {
  switch (sort) {
    case 'price-low':
      return [...query].sort((a, b) => Number(a.price_amount) - Number(b.price_amount));
    case 'price-high':
      return [...query].sort((a, b) => Number(b.price_amount) - Number(a.price_amount));
    case 'duration-short':
      return [...query].sort((a, b) => Number(a.duration_hours) - Number(b.duration_hours));
    case 'rating':
      return [...query].sort((a, b) => Number(b.rating) - Number(a.rating));
    case 'popular':
    default:
      return [...query].sort((a, b) => popularityScore(b) - popularityScore(a));
  }
}

export async function getExperiencesByRace(
  raceId: number,
  filters?: { category?: Category; sort?: ExperienceFilter['sort'] }
): Promise<Experience[]> {
  const cacheKey = filters?.category
    ? `exp:race:${raceId}:cat:${filters.category}`
    : `exp:race:${raceId}`;

  const fetch = unstable_cache(
    async () => {
      const db = await getDb();
      const conditions = [eq(experiences.race_id, raceId), eq(experiences.is_active, true)];
      if (filters?.category) {
        conditions.push(eq(experiences.category, filters.category));
      }
      return db
        .select()
        .from(experiences)
        .where(and(...conditions))
        .orderBy(desc(experiences.is_featured), asc(experiences.sort_order));
    },
    [cacheKey],
    { revalidate: CACHE_TTL, tags: ['experiences', `exp:race:${raceId}`] }
  );

  const rows = await fetch();
  return applySortOrder(rows, filters?.sort).map(mapExperience);
}

export async function getExperienceById(id: number): Promise<Experience | null> {
  const fetch = unstable_cache(
    async () => {
      const db = await getDb();
      return db
        .select()
        .from(experiences)
        .where(and(eq(experiences.id, id), eq(experiences.is_active, true)))
        .limit(1);
    },
    [`exp:id:${id}`],
    { revalidate: CACHE_TTL, tags: ['experiences'] }
  );
  const rows = await fetch();
  return rows[0] ? mapExperience(rows[0]) : null;
}

export async function getExperienceBySlug(slug: string): Promise<Experience | null> {
  const fetch = unstable_cache(
    async () => {
      const db = await getDb();
      return db
        .select()
        .from(experiences)
        .where(and(eq(experiences.slug, slug), eq(experiences.is_active, true)))
        .limit(1);
    },
    [`exp:slug:${slug}`],
    { revalidate: CACHE_TTL, tags: ['experiences', `exp:${slug}`] }
  );
  const rows = await fetch();
  return rows[0] ? mapExperience(rows[0]) : null;
}

export async function getExperiencesByWindow(
  windowSlug: string,
  raceId: number,
  sort?: ExperienceFilter['sort']
): Promise<Experience[]> {
  const fetch = unstable_cache(
    async () => {
      const db = await getDb();
      // Step 1: find window by slug
      const [window] = await db
        .select()
        .from(experience_windows)
        .where(
          and(
            eq(experience_windows.slug, windowSlug),
            eq(experience_windows.race_id, raceId)
          )
        )
        .limit(1);

      if (!window) return [];

      // Step 2: get experience IDs from junction table
      const mappings = await db
        .select({ experienceId: experience_windows_map.experience_id })
        .from(experience_windows_map)
        .where(eq(experience_windows_map.window_id, window.id));

      if (mappings.length === 0) return [];

      const expIds = mappings.map((m) => m.experienceId).filter((id): id is number => id !== null);

      // Step 3: fetch those experiences
      return db
        .select()
        .from(experiences)
        .where(
          and(
            inArray(experiences.id, expIds),
            eq(experiences.is_active, true)
          )
        )
        .orderBy(desc(experiences.is_featured), asc(experiences.sort_order));
    },
    [`exp:race:${raceId}:win:${windowSlug}`],
    { revalidate: CACHE_TTL, tags: ['experiences', `exp:race:${raceId}`] }
  );

  const rows = await fetch();
  return applySortOrder(rows, sort).map(mapExperience);
}

export async function getFeaturedExperiences(raceId: number): Promise<Experience[]> {
  const fetch = unstable_cache(
    async () => {
      const db = await getDb();
      return db
        .select()
        .from(experiences)
        .where(
          and(
            eq(experiences.race_id, raceId),
            eq(experiences.is_featured, true),
            eq(experiences.is_active, true),
            isNotNull(experiences.guide_article)
          )
        )
        .orderBy(asc(experiences.sort_order));
    },
    [`exp:race:${raceId}:featured:guided`],
    { revalidate: CACHE_TTL, tags: ['experiences', `exp:race:${raceId}`] }
  );
  const rows = await fetch();
  return rows.map(mapExperience);
}

export async function getMostPopularExperiences(raceId: number, limit = 6): Promise<Experience[]> {
  const fetch = unstable_cache(
    async () => {
      const db = await getDb();
      return db
        .select()
        .from(experiences)
        .where(
          and(
            eq(experiences.race_id, raceId),
            eq(experiences.is_active, true),
            isNotNull(experiences.guide_article)
          )
        )
        .orderBy(desc(experiences.review_count), desc(experiences.rating))
        .limit(limit);
    },
    [`exp:race:${raceId}:popular:guided`],
    { revalidate: CACHE_TTL, tags: ['experiences', `exp:race:${raceId}`] }
  );
  const rows = await fetch();
  return rows.map(mapExperience);
}

export async function getTopRatedExperiences(raceId: number, limit = 6): Promise<Experience[]> {
  const fetch = unstable_cache(
    async () => {
      const db = await getDb();
      return db
        .select()
        .from(experiences)
        .where(
          and(
            eq(experiences.race_id, raceId),
            eq(experiences.is_active, true),
            isNotNull(experiences.guide_article)
          )
        )
        .orderBy(desc(experiences.rating), desc(experiences.review_count))
        .limit(limit);
    },
    [`exp:race:${raceId}:top-rated:guided`],
    { revalidate: CACHE_TTL, tags: ['experiences', `exp:race:${raceId}`] }
  );
  const rows = await fetch();
  return rows.map(mapExperience);
}

export async function getExperiencesByCategory(
  raceId: number,
  category: Category,
  sort?: ExperienceFilter['sort']
): Promise<Experience[]> {
  return getExperiencesByRace(raceId, { category, sort });
}

export async function getSuggestedExperiences(
  raceId: number,
  excludeSlug: string,
  limit = 4
): Promise<Experience[]> {
  const fetch = unstable_cache(
    async () => {
      const db = await getDb();
      return db
        .select()
        .from(experiences)
        .where(
          and(
            eq(experiences.race_id, raceId),
            eq(experiences.is_active, true),
            ne(experiences.slug, excludeSlug)
          )
        )
        .orderBy(desc(experiences.is_featured), asc(experiences.sort_order))
        .limit(limit);
    },
    [`suggestions:${raceId}:${excludeSlug}`],
    { revalidate: CACHE_TTL, tags: ['experiences', `exp:race:${raceId}`] }
  );
  const rows = await fetch();
  return rows.map(mapExperience);
}

export async function queryExperiences(filter: ExperienceFilter): Promise<Experience[]> {
  const race = await getRaceBySlug(filter.raceSlug);
  if (!race) return [];

  if (filter.windowSlug) {
    const exps = await getExperiencesByWindow(filter.windowSlug, race.id, filter.sort);
    if (filter.category) {
      return exps.filter((e) => e.category === filter.category);
    }
    return exps;
  }

  if (filter.category) {
    return getExperiencesByCategory(race.id, filter.category, filter.sort);
  }

  return getExperiencesByRace(race.id, { sort: filter.sort });
}
