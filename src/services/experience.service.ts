import { db } from '@/lib/db';
import { experiences, experience_windows, experience_windows_map } from '@/lib/db/schema';
import { eq, and, asc, desc, inArray } from 'drizzle-orm';
import { redis } from '@/lib/redis';
import { getRaceBySlug } from '@/services/race.service';
import type { Experience, Category, ExperienceFilter } from '@/types/experience';

const CACHE_TTL = 3600; // 1 hour

async function cached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached) as T;
  } catch {
    // Redis unavailable — fall through to DB
  }

  const result = await fetcher();

  try {
    await redis.set(key, JSON.stringify(result), 'EX', CACHE_TTL);
  } catch {
    // Redis unavailable — ignore
  }

  return result;
}

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
  };
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
      return [...query].sort((a, b) => {
        if ((b.is_featured ? 1 : 0) !== (a.is_featured ? 1 : 0)) {
          return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
        }
        return (a.sort_order ?? 0) - (b.sort_order ?? 0);
      });
  }
}

export async function getExperiencesByRace(
  raceId: number,
  filters?: { category?: Category; sort?: ExperienceFilter['sort'] }
): Promise<Experience[]> {
  const cacheKey = filters?.category
    ? `exp:race:${raceId}:cat:${filters.category}`
    : `exp:race:${raceId}`;

  // Cache the default-ordered DB results; apply sort in-memory after cache lookup
  const rows = await cached(cacheKey, async () => {
    const conditions = [eq(experiences.race_id, raceId), eq(experiences.is_active, true)];
    if (filters?.category) {
      conditions.push(eq(experiences.category, filters.category));
    }

    return db
      .select()
      .from(experiences)
      .where(and(...conditions))
      .orderBy(desc(experiences.is_featured), asc(experiences.sort_order));
  });

  return applySortOrder(rows, filters?.sort).map(mapExperience);
}

export async function getExperienceById(id: number): Promise<Experience | null> {
  const rows = await cached(`exp:id:${id}`, () =>
    db
      .select()
      .from(experiences)
      .where(and(eq(experiences.id, id), eq(experiences.is_active, true)))
      .limit(1)
  );
  return rows[0] ? mapExperience(rows[0]) : null;
}

export async function getExperienceBySlug(slug: string): Promise<Experience | null> {
  const rows = await cached(`exp:slug:${slug}`, () =>
    db
      .select()
      .from(experiences)
      .where(and(eq(experiences.slug, slug), eq(experiences.is_active, true)))
      .limit(1)
  );
  return rows[0] ? mapExperience(rows[0]) : null;
}

export async function getExperiencesByWindow(
  windowSlug: string,
  raceId: number,
  sort?: ExperienceFilter['sort']
): Promise<Experience[]> {
  // Cache the default-ordered DB results; apply sort in-memory after cache lookup
  const rows = await cached(`exp:race:${raceId}:win:${windowSlug}`, async () => {
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
  });

  return applySortOrder(rows, sort).map(mapExperience);
}

export async function getFeaturedExperiences(raceId: number): Promise<Experience[]> {
  const rows = await cached(`exp:race:${raceId}:featured`, () =>
    db
      .select()
      .from(experiences)
      .where(
        and(
          eq(experiences.race_id, raceId),
          eq(experiences.is_featured, true),
          eq(experiences.is_active, true)
        )
      )
      .orderBy(asc(experiences.sort_order))
  );
  return rows.map(mapExperience);
}

export async function getExperiencesByCategory(
  raceId: number,
  category: Category,
  sort?: ExperienceFilter['sort']
): Promise<Experience[]> {
  return getExperiencesByRace(raceId, { category, sort });
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
