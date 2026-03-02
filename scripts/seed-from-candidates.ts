/**
 * Seed From Candidates — seed-from-candidates.ts
 *
 * Reads approved candidates from the JSON output of select-candidates.ts and
 * inserts them into the `experiences` and `experience_windows_map` DB tables.
 *
 * Idempotent: clears existing experiences for the race before inserting.
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/seed-from-candidates.ts --race bahrain-2026
 *   npx tsx --env-file=.env scripts/seed-from-candidates.ts --race bahrain-2026 --dry-run
 */

import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(process.cwd(), 'scripts', 'output');

const DB_HOST = process.env.DATABASE_HOST ?? 'localhost';
const DB_PORT = Number(process.env.DATABASE_PORT) || 3306;
const DB_USER = process.env.DATABASE_USER ?? 'root';
const DB_PASS = process.env.DATABASE_PASSWORD ?? '';
const DB_NAME = process.env.DATABASE_NAME ?? 'pitlane';
const GYG_PARTNER_ID = process.env.GYG_PARTNER_ID ?? '';

// ── CLI args ─────────────────────────────────────────────────────────────────
const raceArgIdx = process.argv.indexOf('--race');
const raceSlug = raceArgIdx !== -1 ? process.argv[raceArgIdx + 1] : null;
const DRY_RUN = process.argv.includes('--dry-run');

if (!raceSlug) {
  console.error('[seed-candidates] Usage: --race <slug>  e.g. --race bahrain-2026');
  process.exit(1);
}

if (!GYG_PARTNER_ID) {
  console.warn('[seed-candidates] Warning: GYG_PARTNER_ID is not set — affiliate URLs will use PLACEHOLDER');
}

// ── Types ────────────────────────────────────────────────────────────────────
interface Candidate {
  tour_id: number | string;
  affiliate_product_id: string;
  title: string;
  abstract: string;
  category_suggestion: string;
  overall_rating: number;
  number_of_ratings: number;
  price_local: number;
  currency: string;
  duration_hours: number | null;
  duration_label: string;
  image_url: string;
  gyg_url: string;
  suggested_windows: string[];
  approved: boolean;
  override_category: string;
  is_featured: boolean;
  sort_order_override: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100);
}

function buildAffiliateUrl(tourId: number | string, experienceSlug: string): string {
  const baseUrl = `https://www.getyourguide.com/activity-t${tourId}/`;
  const partnerId = GYG_PARTNER_ID || 'PLACEHOLDER';
  return `${baseUrl}?partner_id=${partnerId}&utm_medium=online_publisher&utm_source=f1weekend.co&utm_content=${experienceSlug}&utm_term=experience&cmp=share_to_earn`;
}

function formatPriceLabel(amount: number, currency: string): string | null {
  if (!amount || amount <= 0) return null;
  // Format by currency
  const formatted = amount.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return `From ${currency} ${formatted}`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const candidatesFile = path.join(OUTPUT_DIR, `${raceSlug}-candidates.json`);
  if (!fs.existsSync(candidatesFile)) {
    console.error(`[seed-candidates] File not found: ${candidatesFile}`);
    console.error(`  Run discover then select first.`);
    process.exit(1);
  }

  const allCandidates: Candidate[] = JSON.parse(fs.readFileSync(candidatesFile, 'utf-8'));
  const approved = allCandidates
    .filter(c => c.approved)
    .sort((a, b) => {
      // Featured items first, then by sort_order_override, then by rank
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      const aOrder = a.sort_order_override || 999;
      const bOrder = b.sort_order_override || 999;
      return aOrder - bOrder;
    });

  console.log(`\n=== Seed From Candidates: ${raceSlug} ===`);
  console.log(`  Candidates file: ${candidatesFile}`);
  console.log(`  Total candidates: ${allCandidates.length}`);
  console.log(`  Approved: ${approved.length}`);
  console.log(`  Dry run: ${DRY_RUN}`);

  if (approved.length === 0) {
    console.error('\n[seed-candidates] No approved candidates. Run select-candidates.ts first.');
    process.exit(1);
  }

  if (DRY_RUN) {
    console.log('\n--- DRY RUN: Would insert these experiences ---');
    approved.forEach((c, i) => {
      const cat = c.override_category || c.category_suggestion;
      const slug = slugify(c.title);
      console.log(
        `  ${String(i + 1).padStart(2)}. [${cat.padEnd(9)}] ${c.is_featured ? '★ ' : '  '}${c.title.slice(0, 50).padEnd(50)} | ${c.duration_label} | ${c.overall_rating.toFixed(1)}★ (${c.number_of_ratings})`
      );
      console.log(`      slug: ${slug}`);
      console.log(`      windows: ${c.suggested_windows.join(', ')}`);
    });
    console.log(`\n${approved.length} experiences would be inserted (${approved.filter(c => c.is_featured).length} featured)`);
    return;
  }

  // ── DB connection ─────────────────────────────────────────────────────────
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
  });
  console.log(`\n[seed-candidates] Connected to ${DB_HOST}:${DB_PORT}/${DB_NAME}`);

  try {
    // 1. Look up race_id
    const [raceRows] = await conn.execute<mysql.RowDataPacket[]>(
      'SELECT id FROM races WHERE slug = ? LIMIT 1',
      [raceSlug]
    );
    if (!raceRows.length) {
      console.error(`[seed-candidates] Race not found in DB: ${raceSlug}`);
      console.error(`  Run seed-${raceSlug}.ts first to create the race row.`);
      process.exit(1);
    }
    const raceId = raceRows[0].id as number;
    console.log(`  Race: ${raceSlug} (id=${raceId})`);

    // 2. Load experience windows for this race
    const [windowRows] = await conn.execute<mysql.RowDataPacket[]>(
      'SELECT id, slug FROM experience_windows WHERE race_id = ?',
      [raceId]
    );
    const windowMap: Record<string, number> = {};
    for (const w of windowRows) {
      windowMap[w.slug as string] = w.id as number;
    }
    console.log(`  Loaded ${windowRows.length} experience windows: ${Object.keys(windowMap).join(', ')}`);

    // 3. Clear existing experiences for this race
    const [existing] = await conn.execute<mysql.RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM experiences WHERE race_id = ?',
      [raceId]
    );
    const existingCount = (existing[0] as { count: number }).count;
    if (existingCount > 0) {
      console.log(`\n  Clearing ${existingCount} existing experiences for ${raceSlug}...`);
      // Delete window mappings first (FK constraint)
      await conn.execute(
        `DELETE ewm FROM experience_windows_map ewm
         INNER JOIN experiences e ON e.id = ewm.experience_id
         WHERE e.race_id = ?`,
        [raceId]
      );
      await conn.execute('DELETE FROM experiences WHERE race_id = ?', [raceId]);
      console.log('  Cleared.');
    }

    // 4. Insert approved experiences
    console.log(`\n  Inserting ${approved.length} experiences...`);
    let inserted = 0;
    let featuredInserted = 0;
    let windowMapsInserted = 0;

    for (let i = 0; i < approved.length; i++) {
      const c = approved[i];
      const category = (c.override_category || c.category_suggestion) as
        'food' | 'culture' | 'adventure' | 'daytrip' | 'nightlife';
      const slug = slugify(c.title);
      const affiliateUrl = buildAffiliateUrl(c.tour_id, slug);
      const priceLabel = formatPriceLabel(c.price_local, c.currency);
      const sortOrder = i + 1;

      const [result] = await conn.execute<mysql.ResultSetHeader>(
        `INSERT INTO experiences (
          race_id, title, slug, abstract, category,
          rating, review_count,
          price_amount, price_currency, price_label,
          duration_hours, duration_label,
          image_url,
          affiliate_url, affiliate_partner, affiliate_product_id,
          is_featured, sort_order, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          raceId,
          c.title,
          slug,
          c.abstract || null,
          category,
          c.overall_rating > 0 ? Math.round(c.overall_rating * 10) / 10 : null,
          c.number_of_ratings > 0 ? c.number_of_ratings : null,
          c.price_local > 0 ? c.price_local : null,
          c.currency || null,
          priceLabel,
          c.duration_hours,
          c.duration_label || null,
          c.image_url || null,
          affiliateUrl,
          'getyourguide',
          c.affiliate_product_id,
          c.is_featured ? 1 : 0,
          sortOrder,
          1,
        ]
      );

      const experienceId = result.insertId;
      inserted++;
      if (c.is_featured) featuredInserted++;

      // 5. Insert window mappings
      for (const windowSlug of c.suggested_windows) {
        const windowId = windowMap[windowSlug];
        if (!windowId) {
          console.warn(`    [warn] Unknown window slug "${windowSlug}" for experience "${c.title}" — skipping`);
          continue;
        }
        await conn.execute(
          'INSERT INTO experience_windows_map (experience_id, window_id) VALUES (?, ?)',
          [experienceId, windowId]
        );
        windowMapsInserted++;
      }

      const prefix = `  [${String(i + 1).padStart(2)}/${approved.length}]`;
      const featuredMark = c.is_featured ? ' ★' : '';
      console.log(`${prefix}${featuredMark} ${c.title.slice(0, 55)} → id=${experienceId}`);
    }

    console.log(`\n=== Done ===`);
    console.log(`  Experiences inserted: ${inserted}`);
    console.log(`  Featured:             ${featuredInserted}`);
    console.log(`  Window mappings:      ${windowMapsInserted}`);
    console.log(`\nNext steps:`);
    console.log(`  1. npx tsx --env-file=.env scripts/enrich-from-gyg.ts`);
    console.log(`  2. npx tsx --env-file=.env scripts/enrich-seo-content.ts --race ${raceSlug}`);

  } finally {
    await conn.end();
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
