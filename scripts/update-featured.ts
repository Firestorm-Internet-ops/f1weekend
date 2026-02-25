import 'dotenv/config';
import mysql from 'mysql2/promise';

const UPDATES: { slug: string; is_featured: boolean }[] = [
  { slug: 'queen-victoria-market-foodie-tour', is_featured: true },
  { slug: 'hot-air-balloon-over-melbourne-at-sunrise', is_featured: true },
  { slug: 'yarra-valley-wine-food-day-tour', is_featured: false },
  { slug: 'melbourne-street-art-laneways-tour', is_featured: false },
  { slug: 'melbourne-rooftop-bar-crawl', is_featured: false },
];

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT) || 3306,
    user: process.env.DATABASE_USER ?? 'root',
    password: process.env.DATABASE_PASSWORD ?? '',
    database: process.env.DATABASE_NAME ?? 'pitlane',
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
  });

  for (const { slug, is_featured } of UPDATES) {
    const [result] = await conn.execute(
      'UPDATE experiences SET is_featured = ? WHERE slug = ?',
      [is_featured, slug]
    ) as any[];

    if (result.affectedRows > 0) {
      console.log(`✓ ${slug} → is_featured=${is_featured}`);
    } else {
      console.warn(`✗ NOT FOUND: ${slug}`);
    }
  }

  await conn.end();
  console.log('Done.');
}

run().catch(console.error);
