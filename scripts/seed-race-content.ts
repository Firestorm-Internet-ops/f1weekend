import 'dotenv/config';
import path from 'path';
import { createRequire } from 'module';
import { db } from '../src/lib/db';
import { races } from '../src/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

const req = createRequire(import.meta.url);

function extractRaceContent(): Record<string, Record<string, unknown>> {
  const chunkPath = path.resolve(
    path.dirname(new URL(import.meta.url).pathname),
    '../.next/server/chunks/ssr/src_data_race-content_ts_19b961d1._.js'
  );
  const chunk = req(chunkPath) as [number, (exporter: { s: (args: unknown[]) => void }) => void];
  const [, factory] = chunk;
  let raceContent: Record<string, Record<string, unknown>> = {};
  factory({ s: (args: unknown[]) => {
    const [name, , value] = args as [string, unknown, Record<string, Record<string, unknown>>];
    if (name === 'RACE_CONTENT') raceContent = value;
  }});
  return raceContent;
}

const RACE_CONTENT = extractRaceContent();

async function main() {
  for (const [slug, content] of Object.entries(RACE_CONTENT)) {
    console.log(`Seeding race_content for ${slug}...`);
    const raceRows = await db.select({ id: races.id }).from(races).where(eq(races.slug, slug)).limit(1);
    if (!raceRows[0]) {
      console.warn(`  Race not found for slug: ${slug}, skipping`);
      continue;
    }
    const raceId = raceRows[0].id;

    await db.execute(sql`DELETE FROM race_content WHERE race_id = ${raceId}`);
    await db.execute(sql`
      INSERT INTO race_content (
        race_id, page_title, page_description, page_keywords, meta_json,
        how_it_works_text, why_city_text, circuit_map_src,
        tips_content, faq_items, faq_ld,
        currency, open_f1, first_day_offset
      ) VALUES (
        ${raceId},
        ${content.pageTitle ?? null},
        ${content.pageDescription ?? null},
        ${JSON.stringify(content.pageKeywords ?? [])},
        ${JSON.stringify(content.meta ?? null)},
        ${content.howItWorksText ?? null},
        ${content.whyCityText ?? null},
        ${content.circuitMapSrc ?? null},
        ${JSON.stringify(content.tips ?? null)},
        ${JSON.stringify(content.faqItems ?? [])},
        ${JSON.stringify(content.faqLd ?? null)},
        ${content.currency ?? null},
        ${JSON.stringify(content.openF1 ?? null)},
        ${content.firstDayOffset ?? null}
      )
    `);
    console.log(`  Done.`);
  }
  console.log('All done.');
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
