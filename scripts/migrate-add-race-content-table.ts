import 'dotenv/config';
import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Creating race_content table...');
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS race_content (
      id INT PRIMARY KEY AUTO_INCREMENT,
      race_id INT NOT NULL,
      page_title VARCHAR(255),
      page_description TEXT,
      page_keywords JSON,
      meta_json JSON,
      how_it_works_text TEXT,
      why_city_text TEXT,
      circuit_map_src VARCHAR(500),
      tips_content JSON,
      faq_items JSON,
      faq_ld JSON,
      currency VARCHAR(10),
      open_f1 JSON,
      first_day_offset INT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log('Done.');
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
