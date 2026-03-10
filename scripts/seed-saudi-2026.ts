import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { races, sessions, experience_windows, schedule_entries, race_content } from '../src/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

const SLUG = 'saudi-2026';

// ---------------------------------------------------------------------------
// Race content — embedded directly
// ---------------------------------------------------------------------------

const FAQ_ITEMS = [
  {
    q: 'When is the Saudi Arabian Grand Prix 2026?',
    a: 'The 2026 Saudi Arabian Grand Prix takes place on Friday 17 – Sunday 19 April. Race start is 20:00 local time (17:00 UTC) on Sunday 19 April at the Jeddah Corniche Circuit.',
  },
  {
    q: 'How do I get from Jeddah city centre to the Jeddah Corniche Circuit?',
    a: 'The Jeddah Corniche Circuit is located on the Red Sea waterfront, approximately 15 km north of central Jeddah. Official race weekend shuttles run from designated hotel pick-up zones. Taxis and Careem are also available but pre-booking is strongly recommended on race day.',
  },
  {
    q: 'Is Jeddah a good F1 destination?',
    a: "Jeddah is one of F1's most electrifying night race venues — a high-speed street circuit hugging the Red Sea coastline under floodlights. Off-track, Jeddah's Al-Balad UNESCO heritage district, the vibrant Corniche waterfront, world-class seafood, and Saudi Arabian hospitality make for an unforgettable race weekend.",
  },
  {
    q: 'What should I do during the Saudi Arabian Grand Prix race weekend?',
    a: 'Top picks: explore Al-Balad (UNESCO World Heritage Site) on Friday morning, walk the Corniche waterfront at sunset before sessions, visit the King Fahd Fountain (one of the tallest in the world), browse traditional souks in the historic centre, and enjoy Red Sea seafood dining. The night race atmosphere along the waterfront circuit is unmissable.',
  },
  {
    q: 'Do I need a visa for Saudi Arabia?',
    a: 'Most nationalities can obtain a Saudi e-Visa online in advance. Single-entry tourist visas are available for 49 countries. Check the official Saudi Arabia e-Visa portal for eligibility. Process your visa well before travel — at least 2–3 weeks before the race weekend.',
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
    title: 'Saudi Arabian Grand Prix 2026 Tips & FAQ | F1 Weekend Guide',
    description: 'Insider tips for the 2026 Saudi Arabian Grand Prix — transport, money, weather, customs, and what to do in Jeddah between sessions.',
    keywords: [
      'Saudi Arabian Grand Prix 2026 tips',
      'Saudi F1 travel guide',
      'Jeddah F1 weekend',
      'Jeddah Corniche Circuit getting there',
      'F1 Saudi Arabia 2026 FAQ',
    ],
  },
  heroSubtitle: 'The essential insider guide to race weekend in Jeddah, Saudi Arabia',
  categories: [
    {
      title: 'Food & Drink',
      color: '#E10600',
      description: 'Jeddah is Saudi Arabia\'s culinary capital — fresh Red Sea fish, grilled meats, and an exploding international dining scene along the Corniche and in Obhur. Sessions end late so evening dining fits perfectly around the race schedule.',
      linkHref: '/races/saudi-2026/experiences?category=food',
      linkLabel: 'Browse food & drink experiences →',
    },
    {
      title: 'Culture & History',
      color: '#00D2BE',
      description: "Al-Balad is Jeddah's UNESCO World Heritage historic district — a labyrinth of coral-stone houses with ornate wooden mashrabiya balconies dating back centuries. The souks, mosques, and old merchant quarter are extraordinary. Allow half a day minimum.",
      linkHref: '/races/saudi-2026/experiences?category=culture',
      linkLabel: 'Browse culture & history experiences →',
    },
    {
      title: 'Adventure',
      color: '#FF8C00',
      description: 'The Red Sea off Jeddah is world-class for diving and snorkelling — pristine coral reefs, excellent visibility, and abundant marine life. Desert experiences including off-road driving and star-gazing are available inland. April weather (25–32°C) is ideal for outdoor activities.',
      linkHref: '/races/saudi-2026/experiences?category=adventure',
      linkLabel: 'Browse adventure experiences →',
    },
    {
      title: 'Nightlife',
      color: '#9B59B6',
      description: 'Saudi Arabia has relaxed entertainment restrictions significantly in recent years. Jeddah\'s Corniche comes alive at night with waterfront restaurants, cafes, and the spectacular King Fahd Fountain illuminated after sunset. The race circuit itself delivers one of the best night race atmospheres on the calendar.',
      linkHref: '/races/saudi-2026/experiences?category=nightlife',
      linkLabel: 'Browse nightlife experiences →',
    },
  ],
  travelTips: [
    {
      heading: 'Night Race Under Floodlights — Sessions Start in the Afternoon',
      body: 'All sessions at the Saudi GP begin at 16:30 or 20:00 local time. This is ideal for morning and early afternoon sightseeing — use the free morning windows to explore Al-Balad and the Corniche before heading to the circuit.',
    },
    {
      heading: 'Book Hotels Early — Jeddah Race Weekend Hotels Sell Fast',
      body: "The Jeddah Corniche Circuit is close to central Jeddah's hotels. Options on the Corniche waterfront sell out first. Aim to book 6+ months in advance. Corniche-area hotels give the easiest circuit access on race days.",
    },
    {
      heading: 'Cash & Cards — Saudi Riyal (SAR)',
      body: 'The Saudi Riyal (SAR) is pegged to the USD at approximately 1 USD = 3.75 SAR. Cards are widely accepted at hotels, restaurants, and malls. Carry some SAR cash for souks, street food, and smaller vendors in Al-Balad.',
    },
    {
      heading: 'Dress Code — Respect Local Customs',
      body: 'Saudi Arabia has relaxed dress rules for tourists in recent years. At the circuit and tourist areas, standard modest clothing is appropriate — shoulders and knees covered. Women are no longer required to wear abayas. At religious sites like mosques, conservative dress is expected.',
    },
    {
      heading: 'April Heat — Hydrate and Protect Against the Sun',
      body: 'April in Jeddah reaches 30–35°C during the day. The Corniche Circuit has limited shade for afternoon sessions. Bring a refillable water bottle, sunscreen, and a hat. Nights are warm (23–28°C) — comfortable at the circuit under the floodlights.',
    },
    {
      heading: 'Visa Required — Apply Well in Advance',
      body: 'Most nationalities require a Saudi e-Visa. The online process typically takes a few days but allow 2–3 weeks for peace of mind. Check eligibility on the Saudi e-Visa portal. Visas are required regardless of the duration of your stay.',
    },
  ],
  gettingThere: {
    heading: 'Getting to the Jeddah Corniche Circuit',
    intro: 'The Jeddah Corniche Circuit sits on the Red Sea waterfront, approximately 15 km north of central Jeddah. The circuit is relatively close to the main hotel strip — easier to reach than most F1 venues.',
    options: [
      {
        icon: '🚌',
        title: 'Official Shuttle Bus (Recommended)',
        desc: 'Official race weekend shuttles run from designated hotel and city-centre pick-up points to the circuit. Journey times are short (15–25 min from Corniche hotels). Recommended on race day to avoid traffic.',
      },
      {
        icon: '🚕',
        title: 'Taxi / Careem',
        desc: 'Careem (the regional Uber equivalent) and local taxis are widely available in Jeddah. Pre-book through the Careem app before leaving — demand spikes heavily after sessions end. Expect 30–60 minute waits if not pre-booked on race day.',
      },
      {
        icon: '🚗',
        title: 'Hire Car',
        desc: 'Car hire is available at King Abdulaziz International Airport and city-centre locations. The circuit is accessible by road but race-day traffic around the Corniche is significant. Fine for practice days; avoid driving on race day.',
      },
      {
        icon: '✈️',
        title: 'From King Abdulaziz International Airport',
        desc: 'King Abdulaziz International Airport (JED) is approximately 25 km north of central Jeddah, just 10 km further north than the circuit. Taxis to the Corniche hotel district take 25–35 minutes. Multiple international carriers fly direct to Jeddah.',
      },
    ],
    fullGuideHref: '/races/saudi-2026/getting-there',
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
  // 1. Race row — upsert (insert if not exists, else update existing)
  // ------------------------------------------------------------------
  console.log(`[1/5] Upserting race row for ${SLUG}...`);
  const existing = await db.select({ id: races.id }).from(races).where(eq(races.slug, SLUG)).limit(1);

  let raceId: number;
  if (existing[0]) {
    raceId = existing[0].id;
    await db.update(races).set({
      name: 'Saudi Arabian Grand Prix',
      season: 2026,
      round: 5,
      circuit_name: 'Jeddah Corniche Circuit',
      city: 'Jeddah',
      country: 'Saudi Arabia',
      country_code: 'SA',
      circuit_lat: '21.621900',
      circuit_lng: '39.104400',
      timezone: 'Asia/Riyadh',
      race_date: '2026-04-19',
    }).where(eq(races.id, raceId));
    console.log(`  Updated existing race (id=${raceId})`);
  } else {
    const result = await db.insert(races).values({
      slug: SLUG,
      name: 'Saudi Arabian Grand Prix',
      season: 2026,
      round: 5,
      circuit_name: 'Jeddah Corniche Circuit',
      city: 'Jeddah',
      country: 'Saudi Arabia',
      country_code: 'SA',
      circuit_lat: '21.621900',
      circuit_lng: '39.104400',
      timezone: 'Asia/Riyadh',
      race_date: '2026-04-19',
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
    { race_id: raceId, name: 'Free Practice 1', short_name: 'FP1',  day_of_week: 'Friday',   start_time: '16:30:00', end_time: '17:30:00', session_type: 'practice'   },
    { race_id: raceId, name: 'Free Practice 2', short_name: 'FP2',  day_of_week: 'Friday',   start_time: '20:00:00', end_time: '21:00:00', session_type: 'practice'   },
    { race_id: raceId, name: 'Free Practice 3', short_name: 'FP3',  day_of_week: 'Saturday', start_time: '16:30:00', end_time: '17:30:00', session_type: 'practice'   },
    { race_id: raceId, name: 'Qualifying',       short_name: 'QUALI',day_of_week: 'Saturday', start_time: '20:00:00', end_time: '21:00:00', session_type: 'qualifying' },
    { race_id: raceId, name: 'Race',             short_name: 'RACE', day_of_week: 'Sunday',   start_time: '20:00:00', end_time: '22:00:00', session_type: 'race'       },
  ]);
  console.log('  5 sessions inserted');

  // ------------------------------------------------------------------
  // 3. Experience windows — delete all for this race, then insert fresh
  // ------------------------------------------------------------------
  console.log('[3/5] Seeding experience windows...');
  await db.delete(experience_windows).where(eq(experience_windows.race_id, raceId));
  await db.insert(experience_windows).values([
    { race_id: raceId, slug: 'fri-morning', label: 'Friday Morning — Explore Before FP1',          day_of_week: 'Friday',   start_time: '08:00:00', end_time: '16:15:00', max_duration_hours: '8.0',  sort_order: 1 },
    { race_id: raceId, slug: 'fri-gap',     label: 'Friday Afternoon — Between FP1 and FP2',       day_of_week: 'Friday',   start_time: '17:30:00', end_time: '19:45:00', max_duration_hours: '2.0',  sort_order: 2 },
    { race_id: raceId, slug: 'fri-evening', label: 'Friday Night — After Practice',                day_of_week: 'Friday',   start_time: '21:00:00', end_time: '23:00:00', max_duration_hours: '2.0',  sort_order: 3 },
    { race_id: raceId, slug: 'sat-morning', label: 'Saturday Morning — Explore Before FP3',        day_of_week: 'Saturday', start_time: '08:00:00', end_time: '16:15:00', max_duration_hours: '8.0',  sort_order: 4 },
    { race_id: raceId, slug: 'sat-gap',     label: 'Saturday Afternoon — Between FP3 and Quali',   day_of_week: 'Saturday', start_time: '17:30:00', end_time: '19:45:00', max_duration_hours: '2.0',  sort_order: 5 },
    { race_id: raceId, slug: 'sat-evening', label: 'Saturday Night — After Qualifying',            day_of_week: 'Saturday', start_time: '21:00:00', end_time: '23:00:00', max_duration_hours: '2.0',  sort_order: 6 },
    { race_id: raceId, slug: 'sun-morning', label: 'Race Day — Morning Before the Grand Prix',     day_of_week: 'Sunday',   start_time: '08:00:00', end_time: '18:00:00', max_duration_hours: '10.0', sort_order: 7 },
    { race_id: raceId, slug: 'sun-evening', label: 'Post-Race Night — Celebrate on the Corniche', day_of_week: 'Sunday',   start_time: '22:00:00', end_time: '23:59:00', max_duration_hours: '2.0',  sort_order: 8 },
  ]);
  console.log('  8 experience windows inserted');

  // ------------------------------------------------------------------
  // 4. Schedule entries — mirror F1 sessions
  // ------------------------------------------------------------------
  console.log('[4/5] Seeding schedule entries...');
  await db.delete(schedule_entries).where(eq(schedule_entries.race_id, raceId));
  await db.insert(schedule_entries).values([
    { race_id: raceId, day_of_week: 'Friday',   start_time: '16:30:00', end_time: '17:30:00', title: 'Free Practice 1', series: 'F1', series_key: 'f1', sort_order: 1 },
    { race_id: raceId, day_of_week: 'Friday',   start_time: '20:00:00', end_time: '21:00:00', title: 'Free Practice 2', series: 'F1', series_key: 'f1', sort_order: 2 },
    { race_id: raceId, day_of_week: 'Saturday', start_time: '16:30:00', end_time: '17:30:00', title: 'Free Practice 3', series: 'F1', series_key: 'f1', sort_order: 3 },
    { race_id: raceId, day_of_week: 'Saturday', start_time: '20:00:00', end_time: '21:00:00', title: 'Qualifying',       series: 'F1', series_key: 'f1', sort_order: 4 },
    { race_id: raceId, day_of_week: 'Sunday',   start_time: '20:00:00', end_time: '22:00:00', title: 'Race',             series: 'F1', series_key: 'f1', sort_order: 5 },
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
      ${'Formula 1 STC Saudi Arabian Grand Prix 2026 | F1 Weekend Guide'},
      ${'Your complete guide to the 2026 Saudi Arabian Grand Prix weekend at the Jeddah Corniche Circuit. F1 sessions, top experiences in Jeddah, travel tips for Saudi Arabia, and insider advice.'},
      ${JSON.stringify(['Saudi Arabian Grand Prix 2026', 'F1 Saudi Arabia', 'Jeddah Corniche Circuit', 'Jeddah F1 experiences', 'Saudi F1 weekend', 'STC Saudi Arabian Grand Prix'])},
      ${null},
      ${'Browse experiences tagged to each free window in the Saudi Arabian Grand Prix weekend — from Friday morning in Al-Balad and along the Corniche before FP1, to the gap between Saturday sessions, to post-race Sunday night celebrations on the waterfront.'},
      ${"The Jeddah Corniche Circuit is one of Formula 1's most spectacular and fastest street circuits — a high-speed blast along the Red Sea waterfront under full floodlights. Off-track, Jeddah delivers the UNESCO-listed Al-Balad heritage district, the iconic King Fahd Fountain, world-class Red Sea diving, and a vibrant dining scene that has exploded in recent years. This is a race weekend that extends far beyond the track."},
      ${'/tracks/Saudi_Arabia_Circuit.avif'},
      ${JSON.stringify(TIPS_CONTENT)},
      ${JSON.stringify(FAQ_ITEMS)},
      ${JSON.stringify(FAQ_LD)},
      ${'SAR'},
      ${JSON.stringify({ countryName: 'Saudi Arabia', year: 2026 })},
      ${-2}
    )
  `);
  console.log('  race_content inserted');

  console.log(`\nAll done — saudi-2026 seeded with race id=${raceId}`);
  await pool.end();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
