/**
 * Enrichment script: pulls live data from GYG API for each experience.
 * Run after migrate-add-tour-detail.ts:
 *   npx tsx --env-file=.env scripts/enrich-from-gyg.ts
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

const DB_HOST = process.env.DATABASE_HOST ?? 'localhost';
const DB_PORT = Number(process.env.DATABASE_PORT) || 3306;
const DB_USER = process.env.DATABASE_USER ?? 'root';
const DB_PASS = process.env.DATABASE_PASSWORD ?? '';
const DB_NAME = process.env.DATABASE_NAME ?? 'pitlane';
const GYG_API_KEY = process.env.GYG_API_KEY ?? '';
const GYG_BASE = 'https://api.getyourguide.com/1';

// GYG format_id 97 = 1024×500 wide landscape (ideal hero banner)
const PHOTO_FORMAT = '97';

if (!GYG_API_KEY) {
  console.error('[enrich] GYG_API_KEY is not set in .env');
  process.exit(1);
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function resolvePhotoUrl(url: string): string {
  return url.replace('[format_id]', PHOTO_FORMAT);
}

// Actual GYG v1 /tours/{id} response shape
interface GYGTour {
  tour_id?: number;
  title?: string;
  abstract?: string;
  pictures?: { url?: string; ssl_url?: string }[];
  coordinates?: { lat?: number; long?: number };
  locations?: {
    location_id?: number;
    type?: string;
    name?: string;
    city?: string;
    country?: string;
    coordinates?: { lat?: number; long?: number };
  }[];
  url?: string;
  highlights?: string[];
  inclusions?: string;
  exclusions?: string;
  bestseller?: boolean;
  has_pick_up?: boolean;
  mobile_voucher?: boolean;
  categories?: { name?: string }[];
  price?: {
    values?: {
      amount?: number;
      special?: { original_price?: number; savings?: number };
    };
  };
}

interface GYGTourResponse {
  data?: {
    tours?: GYGTour[];
  };
}

// GYG v1 /tours/{id}/options response shape — actual field is data.tour_options
interface GYGOption {
  option_id?: number;
  title?: string;
  description?: string;
  // Actual API response fields (richer tier may add more):
  highlights?: string[];
  inclusions?: string[];
  includes?: string[];
  included?: string[];
  exclusions?: string[];
  excludes?: string[];
  excluded?: string[];
  know_before_you_go?: string;
  important_information?: string;
  pictures?: { url?: string; ssl_url?: string }[];
  meeting_point?: string;
  meeting_point_description?: string;
  skip_the_line?: boolean;
  free_sale?: boolean;
  mobile_voucher?: boolean;
  cond_language?: { language_live?: string[] };
  price?: { values?: { amount?: number } };
}

interface GYGOptionsResponse {
  tour_options?: GYGOption[];   // actual root-level shape from API
  data?: {
    tour_options?: GYGOption[]; // nested fallback
    options?: GYGOption[];      // nested alias fallback
  };
}

// Actual GYG v1 /reviews/tour/{id} response shape
interface GYGReviewItem {
  review_id?: number;
  reviewer_name?: string;
  reviewer_nationality?: string;
  reviewer_country?: string;
  review_rating?: number;
  comment?: string;
  review_date?: string;
}

interface GYGReviewsResponse {
  data?: {
    reviews?: {
      outline?: { rating: number; number_of_reviews: number }[];
      review_items?: GYGReviewItem[];
    };
  };
}

interface OptionSnapshot {
  optionId: number;
  title: string;
  description: string;
  price: number;
  skipTheLine: boolean;
  instantConfirmation: boolean;
  languages: string[];
  meetingPoint: string;
}

function gygHeaders() {
  return {
    'Accept': 'application/json',
    'X-ACCESS-TOKEN': GYG_API_KEY,
  };
}

async function fetchTourDetails(tourId: string): Promise<GYGTourResponse | null> {
  const url = `${GYG_BASE}/tours/${tourId}?cnt_language=en&currency=AUD&preformatted=full`;
  const res = await fetch(url, { headers: gygHeaders() });
  if (!res.ok) {
    console.error(`  [GYG] tours/${tourId} → ${res.status} ${res.statusText}`);
    return null;
  }
  return res.json() as Promise<GYGTourResponse>;
}

async function fetchTourOptions(tourId: string): Promise<GYGOptionsResponse | null> {
  const url = `${GYG_BASE}/tours/${tourId}/options?cnt-language=en&currency=AUD`;
  const res = await fetch(url, { headers: gygHeaders() });
  if (!res.ok) {
    console.error(`  [GYG] tours/${tourId}/options → ${res.status} ${res.statusText}`);
    return null;
  }
  return res.json() as Promise<GYGOptionsResponse>;
}

async function fetchTourReviews(tourId: string): Promise<GYGReviewsResponse | null> {
  const url = `${GYG_BASE}/reviews/tour/${tourId}?cnt_language=en&currency=AUD&limit=20&sort_direction=DESC&sort_field=rating`;
  const res = await fetch(url, { headers: gygHeaders() });
  if (!res.ok) {
    console.error(`  [GYG] reviews/tour/${tourId} → ${res.status} ${res.statusText}`);
    return null;
  }
  return res.json() as Promise<GYGReviewsResponse>;
}

function extractPhotos(source: { pictures?: { url?: string; ssl_url?: string }[] }, maxCount = 10): string[] {
  return (source.pictures ?? [])
    .slice(0, maxCount)
    .map((p) => resolvePhotoUrl(p.ssl_url ?? p.url ?? ''))
    .filter(Boolean);
}

function dedupePhotos(photos: string[]): string[] {
  return [...new Set(photos)];
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, '').trim();
}

function parseInclusionString(s: string | undefined): string[] {
  if (!s) return [];
  const clean = stripHtml(s);
  const lines = clean.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  return lines.length > 1 ? lines : [clean];
}

async function main() {
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
  });

  console.log(`[enrich] Connected to ${DB_HOST}:${DB_PORT}/${DB_NAME}`);

  type ExperienceRow = {
    id: number;
    title: string;
    duration_label: string;
    category: string;
    affiliate_product_id: string;
    image_url: string | null;
  };

  const [rows] = await conn.execute<mysql.RowDataPacket[]>(
    `SELECT id, title, duration_label, category, affiliate_product_id, image_url, abstract
     FROM experiences
     WHERE affiliate_product_id IS NOT NULL AND affiliate_product_id != ''
     ORDER BY sort_order ASC`
  );

  const experiences = rows as ExperienceRow[];
  console.log(`[enrich] Found ${experiences.length} experiences to enrich`);

  for (let i = 0; i < experiences.length; i++) {
    const exp = experiences[i];
    const prefix = `[${i + 1}/${experiences.length}]`;

    // Strip 't' prefix → numeric tour ID
    const tourId = exp.affiliate_product_id.replace(/^t/, '');
    console.log(`${prefix} ${exp.title} (tour: ${tourId})`);

    // Fetch tour details
    const tourData = await fetchTourDetails(tourId);
    await delay(500);

    // Fetch options (highlights, inclusions, more photos, meeting point)
    const optionsData = await fetchTourOptions(tourId);
    await delay(500);

    // Fetch reviews
    const reviewData = await fetchTourReviews(tourId);
    await delay(500);

    // Parse tour data — v1 API returns data.tours[0]
    const tour = tourData?.data?.tours?.[0];
    const tourPhotos = tour ? extractPhotos(tour, 10) : [];

    // Parse options — root-level tour_options first (actual API shape), then nested fallbacks
    const allOptions =
      optionsData?.tour_options ??
      optionsData?.data?.tour_options ??
      optionsData?.data?.options ??
      [];
    const option = allOptions[0];
    const allOptionPhotos = allOptions.flatMap((opt: GYGOption) => extractPhotos(opt, 5));
    const photos = dedupePhotos([...tourPhotos, ...allOptionPhotos]).slice(0, 12);

    // highlights: prefer tour-level array, fall back to options
    const highlights =
      (tour?.highlights && Array.isArray(tour.highlights) && tour.highlights.length > 0)
        ? tour.highlights
        : (option?.highlights ?? []);

    // inclusions: prefer options arrays, fall back to tour-level string
    const optionIncludes = option?.inclusions ?? option?.includes ?? option?.included ?? [];
    const includes =
      optionIncludes.length > 0
        ? optionIncludes
        : parseInclusionString(tour?.inclusions);

    // exclusions: prefer options arrays, fall back to tour-level string
    const optionExcludes = option?.exclusions ?? option?.excludes ?? option?.excluded ?? [];
    const excludes =
      optionExcludes.length > 0
        ? optionExcludes
        : parseInclusionString(tour?.exclusions);

    const importantInfo = option?.know_before_you_go ?? option?.important_information ?? '';
    const meetingPoint = option?.meeting_point ?? option?.meeting_point_description ?? '';

    // Aggregate languages across all options
    const languages = [...new Set(
      allOptions.flatMap((opt: GYGOption) => opt.cond_language?.language_live ?? [])
    )].filter(Boolean);

    // Build options snapshot from all options
    const optionsSnapshot: OptionSnapshot[] = allOptions.map((opt: GYGOption) => ({
      optionId: opt.option_id ?? 0,
      title: opt.title ?? '',
      description: opt.description ?? '',
      price: opt.price?.values?.amount ?? 0,
      skipTheLine: opt.skip_the_line ?? false,
      instantConfirmation: opt.free_sale ?? false,
      languages: opt.cond_language?.language_live ?? [],
      meetingPoint: opt.meeting_point ?? opt.meeting_point_description ?? '',
    }));

    // Parse reviews — v1 API returns data.reviews.review_items
    type ReviewSnapshot = { author: string; rating: number; text: string; date: string; country?: string };
    const reviewItems = reviewData?.data?.reviews?.review_items ?? [];
    const reviewsSnapshot: ReviewSnapshot[] = reviewItems
      .filter((r) => r.comment && r.comment.trim())
      .slice(0, 20)
      .map((r) => ({
        author: r.reviewer_name ?? 'Anonymous',
        rating: r.review_rating ?? 5,
        text: r.comment ?? '',
        date: r.review_date ?? '',
        country: r.reviewer_nationality ?? r.reviewer_country ?? undefined,
      }));

    // GYG categories
    const gygCategories =
      tour?.categories && tour.categories.length > 0
        ? tour.categories.map((c: { name?: string }) => c.name ?? '').filter(Boolean)
        : null;

    // Build update — always overwrite image_url with photos[0] if available
    const updateFields: Record<string, unknown> = {
      abstract:             tour?.abstract ?? null,
      photos:               photos.length > 0 ? JSON.stringify(photos) : null,
      reviews_snapshot:     reviewsSnapshot.length > 0 ? JSON.stringify(reviewsSnapshot) : null,
      highlights:           highlights.length > 0 ? JSON.stringify(highlights) : null,
      includes:             includes.length > 0 ? JSON.stringify(includes) : null,
      excludes:             excludes.length > 0 ? JSON.stringify(excludes) : null,
      important_info:       importantInfo || null,
      meeting_point:        meetingPoint || null,
      // New tour-detail fields
      bestseller:           tour?.bestseller ?? null,
      original_price:       tour?.price?.values?.special?.original_price ?? null,
      discount_pct:         tour?.price?.values?.special?.savings ?? null,
      has_pick_up:          tour?.has_pick_up ?? null,
      mobile_voucher:       optionsSnapshot[0]?.skipTheLine !== undefined ? (option?.mobile_voucher ?? null) : null,
      instant_confirmation: optionsSnapshot[0]?.instantConfirmation ?? null,
      skip_the_line:        optionsSnapshot.some((o) => o.skipTheLine) || null,
      options_snapshot:     optionsSnapshot.length > 0 ? JSON.stringify(optionsSnapshot) : null,
      gyg_categories:       gygCategories ? JSON.stringify(gygCategories) : null,
      lat:                  tour?.coordinates?.lat ?? null,
      lng:                  tour?.coordinates?.long ?? null,
      languages:            languages.length > 0 ? JSON.stringify(languages) : null,
      ...(photos.length > 0 ? { image_url: photos[0] } : {}),
    };

    const setClauses = Object.keys(updateFields)
      .map((k) => `\`${k}\` = ?`)
      .join(', ');
    const values: (string | number | boolean | null)[] = [
      ...Object.values(updateFields).map((v) => (v === undefined ? null : v as string | number | boolean | null)),
      exp.id,
    ];

    await conn.execute(
      `UPDATE experiences SET ${setClauses} WHERE id = ?`,
      values
    );

    console.log(
      `  ✓ highlights:${highlights.length} includes:${includes.length} excludes:${excludes.length}` +
      ` photos:${photos.length} reviews:${reviewsSnapshot.length}` +
      ` options:${optionsSnapshot.length} bestseller:${tour?.bestseller ? 'yes' : 'no'}` +
      ` skip-the-line:${optionsSnapshot.some((o) => o.skipTheLine) ? 'yes' : 'no'}`
    );
  }

  await conn.end();
  console.log('[enrich] Done');
}

main().catch((err) => {
  console.error('[enrich] Failed:', err);
  process.exit(1);
});
