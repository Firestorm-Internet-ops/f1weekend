/**
 * Migration: multi-provider offers (Phase 1).
 *   1. Creates experience_offers.
 *   2. Adds affiliate_clicks.offer_id.
 *   3. Backfills one primary offer per experience from its own affiliate
 *      columns (all GetYourGuide today), so the site reads the same data.
 * Additive and idempotent: safe to run more than once. Nothing is dropped.
 *
 *   npx tsx --env-file=.env scripts/migrate-add-experience-offers.ts
 *   npx tsx --env-file=.env scripts/migrate-add-experience-offers.ts --dry-run
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

const DB_HOST = process.env.DATABASE_HOST ?? 'localhost';
const DB_PORT = Number(process.env.DATABASE_PORT) || 3306;
const DB_USER = process.env.DATABASE_USER ?? 'root';
const DB_PASS = process.env.DATABASE_PASSWORD ?? '';
const DB_NAME = process.env.DATABASE_NAME ?? 'pitlane';
const DRY_RUN = process.argv.includes('--dry-run');

const CREATE_OFFERS = `CREATE TABLE IF NOT EXISTS experience_offers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  experience_id INT NOT NULL,
  provider VARCHAR(20) NOT NULL,
  product_id VARCHAR(100) NOT NULL,
  title VARCHAR(255) DEFAULT NULL,
  url VARCHAR(1000) NOT NULL,
  price_amount DECIMAL(10,2) DEFAULT NULL,
  price_currency VARCHAR(3) DEFAULT NULL,
  original_price DECIMAL(10,2) DEFAULT NULL,
  rating DECIMAL(3,1) DEFAULT NULL,
  review_count INT DEFAULT 0,
  duration_hours DECIMAL(4,1) DEFAULT NULL,
  flags JSON DEFAULT NULL,
  provider_categories JSON DEFAULT NULL,
  raw_snapshot JSON DEFAULT NULL,
  match_score DECIMAL(4,3) DEFAULT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_offer_provider_product (provider, product_id, experience_id),
  KEY idx_offer_experience (experience_id),
  CONSTRAINT fk_offer_experience FOREIGN KEY (experience_id) REFERENCES experiences(id)
)`;

const ADD_CLICK_OFFER = `ALTER TABLE affiliate_clicks ADD COLUMN IF NOT EXISTS offer_id INT DEFAULT NULL`;

// Every legacy row is a GetYourGuide product; the CASE keeps any other value intact.
const BACKFILL = `INSERT INTO experience_offers
  (experience_id, provider, product_id, title, url, price_amount, price_currency, original_price,
   rating, review_count, duration_hours, flags, provider_categories, is_primary, is_active)
SELECT e.id,
  CASE WHEN LOWER(e.affiliate_partner) IN ('viator', 'tiqets') THEN LOWER(e.affiliate_partner) ELSE 'getyourguide' END,
  COALESCE(NULLIF(e.affiliate_product_id, ''), CONCAT('exp-', e.id)),
  e.title, e.affiliate_url, e.price_amount, e.price_currency, e.original_price,
  e.rating, COALESCE(e.review_count, 0), e.duration_hours,
  JSON_OBJECT('instantConfirmation', e.instant_confirmation = 1, 'skipTheLine', e.skip_the_line = 1),
  e.gyg_categories, TRUE, TRUE
FROM experiences e
WHERE e.affiliate_url IS NOT NULL AND e.affiliate_url <> ''
  AND NOT EXISTS (SELECT 1 FROM experience_offers o WHERE o.experience_id = e.id AND o.is_primary = TRUE)`;

async function main() {
  const conn = await mysql.createConnection({ host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASS, database: DB_NAME });
  console.log(`[migrate] Connected to ${DB_HOST}:${DB_PORT}/${DB_NAME}${DRY_RUN ? ' (dry run)' : ''}`);

  const [[pending]] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) AS n FROM experiences WHERE affiliate_url IS NOT NULL AND affiliate_url <> ''`
  );
  console.log(`[migrate] Experiences with a booking URL: ${pending.n}`);
  if (DRY_RUN) {
    console.log('[migrate] Would run:\n', CREATE_OFFERS, '\n', ADD_CLICK_OFFER, '\n', BACKFILL);
    await conn.end();
    return;
  }

  await conn.execute(CREATE_OFFERS);
  console.log('[migrate] experience_offers ready');
  await conn.execute(ADD_CLICK_OFFER);
  console.log('[migrate] affiliate_clicks.offer_id ready');
  const [res] = await conn.execute<mysql.ResultSetHeader>(BACKFILL);
  console.log(`[migrate] Backfilled ${res.affectedRows} primary offers`);

  await conn.end();
  console.log('[migrate] Done');
}

main().catch((err) => {
  console.error('[migrate] Failed:', err);
  process.exit(1);
});
