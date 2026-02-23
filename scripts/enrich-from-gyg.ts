/**
 * Enrichment script: pulls live data from GYG API for each experience.
 * Run after migrate-add-enrichment.ts:
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
}

interface GYGOptionsResponse {
  data?: {
    tour_options?: GYGOption[]; // actual field name from API
    options?: GYGOption[];      // fallback alias
  };
}

// Actual GYG v1 /reviews/tour/{id} response shape
interface GYGReviewItem {
  review_id?: number;
  reviewer_name?: string;
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

function gygHeaders() {
  return {
    'Accept': 'application/json',
    'X-ACCESS-TOKEN': GYG_API_KEY,
  };
}

async function fetchTourDetails(tourId: string): Promise<GYGTourResponse | null> {
  const url = `${GYG_BASE}/tours/${tourId}?cnt_language=en&currency=AUD`;
  const res = await fetch(url, { headers: gygHeaders() });
  if (!res.ok) {
    console.error(`  [GYG] tours/${tourId} → ${res.status} ${res.statusText}`);
    return null;
  }
  return res.json() as Promise<GYGTourResponse>;
}

async function fetchTourOptions(tourId: string): Promise<GYGOptionsResponse | null> {
  const url = `${GYG_BASE}/tours/${tourId}/options?cnt_language=en&currency=AUD`;
  const res = await fetch(url, { headers: gygHeaders() });
  if (!res.ok) {
    console.error(`  [GYG] tours/${tourId}/options → ${res.status} ${res.statusText}`);
    return null;
  }
  return res.json() as Promise<GYGOptionsResponse>;
}

async function fetchTourReviews(tourId: string): Promise<GYGReviewsResponse | null> {
  const url = `${GYG_BASE}/reviews/tour/${tourId}?cnt_language=en&currency=AUD&limit=5&sort_direction=DESC&sort_field=rating`;
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
    `SELECT id, title, duration_label, category, affiliate_product_id, image_url
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

    // Parse options — actual field is data.tour_options (data.options as fallback)
    const option = optionsData?.data?.tour_options?.[0] ?? optionsData?.data?.options?.[0];
    const optionPhotos = option ? extractPhotos(option, 10) : [];
    const photos = dedupePhotos([...tourPhotos, ...optionPhotos]).slice(0, 5);

    const highlights = option?.highlights ?? [];
    const includes = option?.inclusions ?? option?.includes ?? option?.included ?? [];
    const excludes = option?.exclusions ?? option?.excludes ?? option?.excluded ?? [];
    const importantInfo = option?.know_before_you_go ?? option?.important_information ?? '';
    const meetingPoint = option?.meeting_point ?? option?.meeting_point_description ?? '';

    // Parse reviews — v1 API returns data.reviews.review_items
    type ReviewSnapshot = { author: string; rating: number; text: string; date: string };
    const reviewItems = reviewData?.data?.reviews?.review_items ?? [];
    const reviewsSnapshot: ReviewSnapshot[] = reviewItems
      .filter((r) => r.comment && r.comment.trim())
      .slice(0, 5)
      .map((r) => ({
        author: r.reviewer_name ?? 'Anonymous',
        rating: r.review_rating ?? 5,
        text: r.comment ?? '',
        date: r.review_date ?? '',
      }));

    // Build update — always overwrite image_url with photos[0] if available
    const updateFields: Record<string, unknown> = {
      photos:           photos.length > 0 ? JSON.stringify(photos) : null,
      reviews_snapshot: reviewsSnapshot.length > 0 ? JSON.stringify(reviewsSnapshot) : null,
      highlights:       highlights.length > 0 ? JSON.stringify(highlights) : null,
      includes:         includes.length > 0 ? JSON.stringify(includes) : null,
      excludes:         excludes.length > 0 ? JSON.stringify(excludes) : null,
      important_info:   importantInfo || null,
      meeting_point:    meetingPoint || null,
      ...(photos.length > 0 ? { image_url: photos[0] } : {}),
    };

    const setClauses = Object.keys(updateFields)
      .map((k) => `\`${k}\` = ?`)
      .join(', ');
    const values: (string | number | null)[] = [
      ...Object.values(updateFields).map((v) => (v === undefined ? null : v as string | number | null)),
      exp.id,
    ];

    await conn.execute(
      `UPDATE experiences SET ${setClauses} WHERE id = ?`,
      values
    );

    console.log(
      `  ✓ photos:${photos.length} highlights:${highlights.length} includes:${includes.length} excludes:${excludes.length} reviews:${reviewsSnapshot.length} meeting:${meetingPoint ? 'yes' : 'no'}`
    );
  }

  await conn.end();
  console.log('[enrich] Done');
}

main().catch((err) => {
  console.error('[enrich] Failed:', err);
  process.exit(1);
});
