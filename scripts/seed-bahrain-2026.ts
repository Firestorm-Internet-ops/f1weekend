import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { races, sessions, experience_windows, schedule_entries, race_content } from '../src/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

const SLUG = 'bahrain-2026';

// ---------------------------------------------------------------------------
// Race content — embedded directly (no chunk extraction needed)
// ---------------------------------------------------------------------------

const FAQ_ITEMS = [
  {
    q: 'When is the Bahrain Grand Prix 2026?',
    a: 'The 2026 Bahrain Grand Prix takes place on Friday 10 – Sunday 12 April. Race start is 18:00 local time (15:00 UTC) on Sunday 12 April.',
  },
  {
    q: 'What is the fastest way from Manama to the Bahrain International Circuit?',
    a: 'Official race weekend shuttle buses run from multiple Manama hotel pick-up points to the circuit. Journey time is approximately 30–40 minutes. Taxis and Careem are also available but expect longer waits on race day.',
  },
  {
    q: 'Is Bahrain a good F1 destination?',
    a: "Absolutely. Bahrain's night race under floodlights is one of the most visually spectacular on the calendar. Add Manama's thriving food scene, the UNESCO-listed Bahrain Fort, the Gold Souk, and warm desert evenings — it delivers a distinct Gulf atmosphere unlike any other race on the schedule.",
  },
  {
    q: 'What should I do during the Bahrain Grand Prix race weekend?',
    a: 'Top picks: visit Bahrain Fort (UNESCO World Heritage Site) on Friday morning, browse the Gold Souk and Manama Souq on Saturday, take a desert safari between sessions, and enjoy waterfront dining at Adliya or the Avenues. The circuit entertainment village is also excellent during sessions.',
  },
];

const FAQ_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

const TIPS_CONTENT = {
  meta: {
    title: 'Bahrain Grand Prix 2026 Tips & FAQ | F1 Weekend Guide',
    description: 'Insider tips for the 2026 Bahrain Grand Prix — transport, money, weather, customs, and what to do in Manama between sessions.',
    keywords: [
      'Bahrain Grand Prix 2026 tips',
      'Bahrain F1 travel guide',
      'Manama F1 weekend',
      'Bahrain International Circuit getting there',
      'F1 Bahrain 2026 FAQ',
    ],
  },
  heroSubtitle: 'The essential insider guide to race weekend in the Kingdom of Bahrain',
  categories: [
    {
      title: 'Food & Drink',
      color: '#E10600',
      description: 'Bahraini cuisine blends Gulf spices with international influence — machboos rice dishes, fresh seafood on the waterfront, and world-class restaurants in Adliya. Sessions end late so dinner reservations are easy to plan.',
      linkHref: '/races/bahrain-2026/experiences?category=food',
      linkLabel: 'Browse food & drink experiences →',
    },
    {
      title: 'Culture & History',
      color: '#00D2BE',
      description: "Bahrain Fort (Qal'at al-Bahrain) is a UNESCO World Heritage Site visible from the sea. The National Museum covers 6,000 years of island history. The Manama Souq and Gold Souk are essential walking visits.",
      linkHref: '/races/bahrain-2026/experiences?category=culture',
      linkLabel: 'Browse culture & history experiences →',
    },
    {
      title: 'Adventure',
      color: '#FF8C00',
      description: 'Desert safaris in the southern sands, off-road dune driving, and kite-surfing off the northern coast. April weather is warm but manageable — perfect for outdoor adventure before the Gulf summer heat arrives.',
      linkHref: '/races/bahrain-2026/experiences?category=adventure',
      linkLabel: 'Browse adventure experiences →',
    },
    {
      title: 'Nightlife',
      color: '#9B59B6',
      description: 'Bahrain is the most liberal country in the Gulf for nightlife. Adliya\'s restaurant strip stays busy until midnight. Roof bars and hotel lounges fill up after qualifying. The circuit atmosphere on Saturday night is electric.',
      linkHref: '/races/bahrain-2026/experiences?category=nightlife',
      linkLabel: 'Browse nightlife experiences →',
    },
  ],
  travelTips: [
    {
      heading: 'Night Race Under Floodlights — Dress for Cool Desert Evenings',
      body: 'Sessions run from late afternoon into the evening. While April days reach 30–35°C, desert nights can drop to the mid-20s with a breeze. Bring a light layer for the grandstands after sunset.',
    },
    {
      heading: 'Manama Is Your Base — Book Hotels 6+ Months Ahead',
      body: 'The circuit is 30 km south of Manama city centre in Sakhir. Most visitors stay in Manama\'s hotel strip and shuttle in. Race weekend hotels sell out fast — book as early as possible, ideally 6–12 months before the race.',
    },
    {
      heading: 'Cash & Cards — BHD Pegged to USD',
      body: 'The Bahraini Dinar (BHD) is pegged to the US Dollar at approximately 1 BHD = $2.65 USD. Cards are accepted at most hotels, restaurants, and larger shops. Carry BHD cash for souks, taxis, and smaller vendors.',
    },
    {
      heading: 'Respect Local Customs — Bahrain Is Relatively Liberal',
      body: 'Bahrain is among the more open Gulf states, but public alcohol consumption is restricted to licensed venues. Dress modestly outside F1 zones and hotel areas. Standard tourist attire is fine at the circuit and tourist sites.',
    },
    {
      heading: 'Desert Heat — Hydrate Constantly',
      body: 'April temperatures reach 30–35°C by midday. The circuit is largely exposed with limited shade in general admission areas. Bring a refillable water bottle, sunscreen, and a hat for daytime sessions.',
    },
    {
      heading: 'Circuit Shuttle Beats Driving on Race Day',
      body: 'Road access to the Bahrain International Circuit becomes severely congested on race day. Use official shuttle buses from Manama hotels — they run frequently from Friday through Sunday and are far less stressful than driving.',
    },
  ],
  gettingThere: {
    heading: 'Getting to the Bahrain International Circuit',
    intro: 'The Bahrain International Circuit is located in Sakhir, approximately 30 km south of Manama city centre. On race weekend, the route gets busy — plan your journey in advance.',
    options: [
      {
        icon: '🚌',
        title: 'Official Shuttle Bus (Recommended)',
        desc: 'Shuttle services run from designated Manama hotel pick-up points directly to the circuit. Journey time ~30–40 minutes. Tickets are available via the official F1 race site. Highly recommended on race day.',
      },
      {
        icon: '🚕',
        title: 'Taxi / Careem',
        desc: 'Taxis and Careem (the regional Uber equivalent) are widely available in Manama. Pre-book for race day — demand surges significantly and wait times can exceed 45 minutes after sessions end.',
      },
      {
        icon: '🚗',
        title: 'Hire Car',
        desc: 'Car hire is available at Bahrain International Airport. Road signage is good, but parking at the circuit is limited and traffic on race day is severe. Not recommended for race day; fine for practice sessions.',
      },
      {
        icon: '✈️',
        title: 'From Bahrain International Airport',
        desc: 'Bahrain International Airport is roughly 10 km north of Manama city centre — approximately 40 km from the circuit. Taxis to the city take 20–30 minutes. Many international carriers fly direct.',
      },
    ],
    fullGuideHref: '/races/bahrain-2026/getting-there',
  },
  faq: FAQ_ITEMS,
};

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

async function main() {
  const pool = mysql.createPool({
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT) || 3306,
    user: process.env.DATABASE_USER ?? 'root',
    password: process.env.DATABASE_PASSWORD ?? '',
    database: process.env.DATABASE_NAME ?? 'pitlane',
  });
  const db = drizzle(pool);

  // ------------------------------------------------------------------
  // 1. Race row — upsert (insert if not exists, else use existing id)
  // ------------------------------------------------------------------
  console.log(`[1/5] Upserting race row for ${SLUG}...`);
  const existing = await db.select({ id: races.id }).from(races).where(eq(races.slug, SLUG)).limit(1);

  let raceId: number;
  if (existing[0]) {
    raceId = existing[0].id;
    await db.update(races).set({
      name: 'Formula 1 Gulf Air Bahrain Grand Prix 2026',
      season: 2026,
      round: 4,
      circuit_name: 'Bahrain International Circuit',
      city: 'Sakhir',
      country: 'Bahrain',
      country_code: 'BH',
      circuit_lat: '26.032500',
      circuit_lng: '50.510600',
      timezone: 'Asia/Bahrain',
      race_date: '2026-04-12',
    }).where(eq(races.id, raceId));
    console.log(`  Updated existing race (id=${raceId})`);
  } else {
    const result = await db.insert(races).values({
      slug: SLUG,
      name: 'Formula 1 Gulf Air Bahrain Grand Prix 2026',
      season: 2026,
      round: 4,
      circuit_name: 'Bahrain International Circuit',
      city: 'Sakhir',
      country: 'Bahrain',
      country_code: 'BH',
      circuit_lat: '26.032500',
      circuit_lng: '50.510600',
      timezone: 'Asia/Bahrain',
      race_date: '2026-04-12',
    });
    raceId = (result[0] as { insertId: number }).insertId;
    console.log(`  Inserted new race (id=${raceId})`);
  }

  // ------------------------------------------------------------------
  // 2. Sessions — delete all for this race, then insert fresh
  // ------------------------------------------------------------------
  console.log('[2/5] Seeding sessions...');
  await db.delete(sessions).where(eq(sessions.race_id, raceId));
  await db.insert(sessions).values([
    { race_id: raceId, name: 'Free Practice 1', short_name: 'FP1', day_of_week: 'Friday', start_time: '14:30:00', end_time: '15:30:00', session_type: 'practice' },
    { race_id: raceId, name: 'Free Practice 2', short_name: 'FP2', day_of_week: 'Friday', start_time: '18:00:00', end_time: '19:00:00', session_type: 'practice' },
    { race_id: raceId, name: 'Free Practice 3', short_name: 'FP3', day_of_week: 'Saturday', start_time: '15:30:00', end_time: '16:30:00', session_type: 'practice' },
    { race_id: raceId, name: 'Qualifying', short_name: 'QUALI', day_of_week: 'Saturday', start_time: '19:00:00', end_time: '20:00:00', session_type: 'qualifying' },
    { race_id: raceId, name: 'Race', short_name: 'RACE', day_of_week: 'Sunday', start_time: '18:00:00', end_time: '20:00:00', session_type: 'race' },
  ]);
  console.log('  5 sessions inserted');

  // ------------------------------------------------------------------
  // 3. Experience windows — delete all for this race, then insert fresh
  // ------------------------------------------------------------------
  console.log('[3/5] Seeding experience windows...');
  await db.delete(experience_windows).where(eq(experience_windows.race_id, raceId));
  await db.insert(experience_windows).values([
    { race_id: raceId, slug: 'fri-morning', label: 'Friday Morning — Explore Before FP1', day_of_week: 'Friday', start_time: '08:00:00', end_time: '14:00:00', max_duration_hours: '6.0', sort_order: 1 },
    { race_id: raceId, slug: 'fri-gap', label: 'Friday Afternoon — Between Sessions', day_of_week: 'Friday', start_time: '15:30:00', end_time: '17:30:00', max_duration_hours: '2.0', sort_order: 2 },
    { race_id: raceId, slug: 'fri-evening', label: 'Friday Evening — After Practice', day_of_week: 'Friday', start_time: '19:00:00', end_time: '23:00:00', max_duration_hours: '4.0', sort_order: 3 },
    { race_id: raceId, slug: 'sat-morning', label: 'Saturday Morning — Full Day Before FP3', day_of_week: 'Saturday', start_time: '08:00:00', end_time: '15:00:00', max_duration_hours: '7.0', sort_order: 4 },
    { race_id: raceId, slug: 'sat-gap', label: 'Saturday Afternoon — Between FP3 and Quali', day_of_week: 'Saturday', start_time: '16:30:00', end_time: '18:30:00', max_duration_hours: '2.0', sort_order: 5 },
    { race_id: raceId, slug: 'sat-evening', label: 'Saturday Evening — After Qualifying', day_of_week: 'Saturday', start_time: '20:00:00', end_time: '23:00:00', max_duration_hours: '3.0', sort_order: 6 },
    { race_id: raceId, slug: 'sun-morning', label: 'Race Day — Morning and Afternoon', day_of_week: 'Sunday', start_time: '08:00:00', end_time: '17:00:00', max_duration_hours: '9.0', sort_order: 7 },
    { race_id: raceId, slug: 'sun-evening', label: 'Post-Race Celebration Night', day_of_week: 'Sunday', start_time: '20:00:00', end_time: '23:00:00', max_duration_hours: '3.0', sort_order: 8 },
  ]);
  console.log('  8 experience windows inserted');

  // ------------------------------------------------------------------
  // 4. Schedule entries — mirror F1 sessions only
  // ------------------------------------------------------------------
  console.log('[4/5] Seeding schedule entries...');
  await db.delete(schedule_entries).where(eq(schedule_entries.race_id, raceId));
  await db.insert(schedule_entries).values([
    { race_id: raceId, day_of_week: 'Friday', start_time: '14:30:00', end_time: '15:30:00', title: 'Free Practice 1', series: 'F1', series_key: 'f1', sort_order: 1 },
    { race_id: raceId, day_of_week: 'Friday', start_time: '18:00:00', end_time: '19:00:00', title: 'Free Practice 2', series: 'F1', series_key: 'f1', sort_order: 2 },
    { race_id: raceId, day_of_week: 'Saturday', start_time: '15:30:00', end_time: '16:30:00', title: 'Free Practice 3', series: 'F1', series_key: 'f1', sort_order: 3 },
    { race_id: raceId, day_of_week: 'Saturday', start_time: '19:00:00', end_time: '20:00:00', title: 'Qualifying', series: 'F1', series_key: 'f1', sort_order: 4 },
    { race_id: raceId, day_of_week: 'Sunday', start_time: '18:00:00', end_time: '20:00:00', title: 'Race', series: 'F1', series_key: 'f1', sort_order: 5 },
  ]);
  console.log('  5 schedule entries inserted');

  // ------------------------------------------------------------------
  // 5. Race content — delete then insert with embedded editorial
  // ------------------------------------------------------------------
  console.log('[5/5] Seeding race_content...');
  await db.execute(sql`DELETE FROM race_content WHERE race_id = ${raceId}`);
  await db.execute(sql`
    INSERT INTO race_content (
      race_id, page_title, page_description, page_keywords, meta_json,
      how_it_works_text, why_city_text, circuit_map_src,
      tips_content, faq_items, faq_ld,
      currency, open_f1, first_day_offset
    ) VALUES (
      ${raceId},
      ${'Formula 1 Gulf Air Bahrain Grand Prix 2026 | F1 Weekend Guide'},
      ${'Your complete guide to the 2026 Bahrain Grand Prix weekend at the Bahrain International Circuit, Sakhir. F1 sessions, top experiences in Manama and the desert, travel tips, and insider advice.'},
      ${JSON.stringify(['Bahrain Grand Prix 2026', 'F1 Bahrain', 'Bahrain International Circuit', 'Sakhir F1 experiences', 'Manama F1 weekend', 'Gulf Air Bahrain Grand Prix'])},
      ${null},
      ${'Browse experiences tagged to each free window in the Bahrain Grand Prix weekend — from Friday morning in Manama before FP1, to Saturday evening after qualifying under the floodlights, to post-race Sunday night celebrations.'},
      ${"Bahrain delivers one of Formula 1's most iconic night race experiences. The Bahrain International Circuit blazes under floodlights against the desert sky while Manama — just 30 minutes away — offers a cosmopolitan Gulf city packed with souks, world-class restaurants, UNESCO heritage sites, and a vibrant nightlife scene that sets it apart from every other race on the calendar."},
      ${'/tracks/Bahrain_Circuit.avif'},
      ${JSON.stringify(TIPS_CONTENT)},
      ${JSON.stringify(FAQ_ITEMS)},
      ${JSON.stringify(FAQ_LD)},
      ${'BHD'},
      ${JSON.stringify({ countryName: 'Bahrain', year: 2026 })},
      ${-2}
    )
  `);
  console.log('  race_content inserted');

  console.log(`\nAll done — bahrain-2026 seeded with race id=${raceId}`);
  await pool.end();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
