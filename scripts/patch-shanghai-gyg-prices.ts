/**
 * Fetch real CNY prices from GYG API for all Shanghai experiences.
 *
 * Updates per experience:
 *   price_amount    — CNY amount from tour.price.values.amount
 *   price_currency  — 'CNY'
 *   price_label     — '¥NNN' (rounded integer)
 *   original_price  — CNY amount from special.original_price if present
 *   options_snapshot — re-mapped option prices to CNY amounts
 *
 * Usage:
 *   npm run db:patch-shanghai-prices
 *   npm run db:patch-shanghai-prices -- --force   (re-process even if already CNY)
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

const FORCE = process.argv.includes('--force');

if (!GYG_API_KEY) {
  console.error('[patch-prices] GYG_API_KEY is not set in .env');
  process.exit(1);
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function gygHeaders() {
  return {
    Accept: 'application/json',
    'X-ACCESS-TOKEN': GYG_API_KEY,
  };
}

interface GYGTour {
  price?: {
    values?: {
      amount?: number;
      special?: { original_price?: number };
    };
  };
}

interface GYGTourResponse {
  data?: { tours?: GYGTour[] };
}

interface GYGOption {
  option_id?: number;
  title?: string;
  description?: string;
  skip_the_line?: boolean;
  free_sale?: boolean;
  mobile_voucher?: boolean;
  cond_language?: { language_live?: string[] };
  price?: { values?: { amount?: number } };
  meeting_point?: string;
  meeting_point_description?: string;
}

interface GYGOptionsResponse {
  tour_options?: GYGOption[];
  data?: {
    tour_options?: GYGOption[];
    options?: GYGOption[];
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

interface ExperienceRow {
  id: number;
  title: string;
  affiliate_product_id: string;
  price_amount: number;
  price_currency: string;
  price_label: string;
  original_price: number | null;
  options_snapshot: string | null;
}

async function fetchTourDetails(tourId: string): Promise<GYGTourResponse | null> {
  const url = `${GYG_BASE}/tours/${tourId}?cnt_language=en&currency=CNY&preformatted=full`;
  const res = await fetch(url, { headers: gygHeaders() });
  if (!res.ok) {
    console.error(`  [GYG] tours/${tourId} → ${res.status} ${res.statusText}`);
    return null;
  }
  return res.json() as Promise<GYGTourResponse>;
}

async function fetchTourOptions(tourId: string): Promise<GYGOptionsResponse | null> {
  const url = `${GYG_BASE}/tours/${tourId}/options?cnt-language=en&currency=CNY`;
  const res = await fetch(url, { headers: gygHeaders() });
  if (!res.ok) {
    console.error(`  [GYG] tours/${tourId}/options → ${res.status} ${res.statusText}`);
    return null;
  }
  return res.json() as Promise<GYGOptionsResponse>;
}

async function main() {
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
  });

  console.log(`[patch-prices] Connected to ${DB_HOST}:${DB_PORT}/${DB_NAME}`);
  console.log(`[patch-prices] Mode: ${FORCE ? 'FORCE (re-process all)' : 'skip if already CNY'}\n`);

  const currencyFilter = FORCE ? '' : ` AND e.price_currency != 'CNY'`;
  const [rows] = await conn.execute<mysql.RowDataPacket[]>(
    `SELECT e.id, e.title, e.affiliate_product_id, e.price_amount, e.price_currency,
            e.price_label, e.original_price, e.options_snapshot
     FROM experiences e
     WHERE e.race_id = (SELECT id FROM races WHERE slug = 'shanghai-2026')
       AND e.affiliate_product_id IS NOT NULL${currencyFilter}
     ORDER BY e.sort_order`,
  );

  const experiences = rows as ExperienceRow[];
  console.log(`[patch-prices] Found ${experiences.length} Shanghai experiences to patch\n`);

  if (experiences.length === 0) {
    console.log('[patch-prices] Nothing to do. Use --force to re-run all.');
    await conn.end();
    return;
  }

  let patched = 0;
  let errors = 0;

  for (let i = 0; i < experiences.length; i++) {
    const exp = experiences[i];
    const prefix = `[${i + 1}/${experiences.length}]`;
    // Strip 't' prefix → numeric tour ID (e.g. 't68420' → '68420')
    const tourId = exp.affiliate_product_id.replace(/^t/, '');
    console.log(`${prefix} ${exp.title} (tour: ${tourId})`);
    console.log(`  Before: ${exp.price_currency} ${exp.price_amount} (${exp.price_label})`);

    const [tourResp, optionsResp] = await Promise.all([
      fetchTourDetails(tourId),
      fetchTourOptions(tourId),
    ]);

    if (!tourResp) {
      errors++;
      console.log(`  ✗ Failed to fetch tour details\n`);
      await delay(500);
      continue;
    }

    const tour = tourResp.data?.tours?.[0];
    const cnyAmount = tour?.price?.values?.amount;

    if (!cnyAmount) {
      errors++;
      console.log(`  ✗ No CNY price in response\n`);
      await delay(500);
      continue;
    }

    const cnyRounded = Math.round(cnyAmount);
    const priceLabel = `¥${cnyRounded}`;
    const originalPrice = tour?.price?.values?.special?.original_price ?? null;

    // Rebuild options_snapshot with CNY prices
    let newOptionsSnapshot: string | null = exp.options_snapshot;
    const rawOptions =
      optionsResp?.tour_options ??
      optionsResp?.data?.tour_options ??
      optionsResp?.data?.options ??
      [];

    if (rawOptions.length > 0) {
      const options: OptionSnapshot[] = rawOptions
        .filter((o): o is GYGOption & { option_id: number } => Boolean(o.option_id))
        .map((o) => ({
          optionId: o.option_id!,
          title: o.title ?? '',
          description: o.description ?? '',
          price: o.price?.values?.amount ?? cnyAmount,
          skipTheLine: o.skip_the_line ?? false,
          instantConfirmation: o.free_sale ?? false,
          languages: o.cond_language?.language_live ?? [],
          meetingPoint: o.meeting_point_description ?? o.meeting_point ?? '',
        }));
      newOptionsSnapshot = JSON.stringify(options);
    }

    await conn.execute(
      `UPDATE experiences
       SET price_amount = ?, price_currency = 'CNY', price_label = ?,
           original_price = ?, options_snapshot = ?
       WHERE id = ?`,
      [cnyAmount, priceLabel, originalPrice, newOptionsSnapshot, exp.id],
    );

    patched++;
    console.log(`  ✓ After: CNY ${cnyAmount} (${priceLabel})${originalPrice ? ` | orig: ¥${Math.round(originalPrice)}` : ''}\n`);

    await delay(300);
  }

  await conn.end();
  console.log(`[patch-prices] Done — patched:${patched} errors:${errors}`);
}

main().catch((err) => {
  console.error('[patch-prices] Fatal:', err);
  process.exit(1);
});
