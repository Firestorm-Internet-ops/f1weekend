import 'dotenv/config';
import mysql from 'mysql2/promise';

const abstracts: Record<string, string> = {
  'melbourne-laneways-hidden-bars-food-tour':
    "Melbourne's iconic laneways food tour — 7-8 tastings at hidden bars and rooftop speakeasies in the CBD. From A$130. Ideal between F1 practice sessions.",
  'queen-victoria-market-foodie-tour':
    'Guided grazing through Queen Vic Market — artisan cheese, cured meats, pastries and 140-year history. From A$99. Great for race Thursday and mornings.',
  'melbourne-coffee-culture-walking-tour':
    'World-famous coffee city, one café at a time. Backstreet roasters and espresso bars from Degraves St. A$65 · 2 hrs · Fits any practice-day morning.',
  'yarra-valley-wine-food-day-tour':
    'Yarra Valley wine escape — 4 premium estates, cool-climate tastings, chocolaterie, and gourmet lunch. A$145. Best on Thursday pre-race day.',
  'melbourne-street-food-night-market-tour':
    'After-dark food walk through Chinatown and Hardware Lane — dumplings, fusion street food, and a hidden bar. A$89 · 3 hrs · Perfect for F1 evenings.',
  'south-melbourne-market-grazing-tour':
    'Oysters, dim sims (invented here 1945), artisan bread, and specialty coffee at South Melbourne Market. A$85 · 2 hrs. Open mornings all weekend.',
  'craft-beer-brewery-walk-collingwood':
    'Three Collingwood craft breweries on Smith Street with tasting paddles and snacks. A$95 · 3 hrs. Fits Friday and Saturday evening race gaps.',
  'melbourne-street-art-laneways-tour':
    'Hosier Lane, AC/DC Lane, and hidden alleys with a working street artist as guide. A$39 · 2 hrs · Best value culture activity near the CBD.',
  'ngv-arts-precinct-guided-tour':
    'NGV, Federation Square, and the full Arts Precinct on St Kilda Road explored in 2.5 hrs. A$55 · Easy morning activity before Saturday qualifying.',
  'aboriginal-heritage-walking-tour':
    'Aboriginal-led walk through Kulin Nation heritage sites on the Yarra River (Birrarung). A$69 · 2 hrs · One of Melbourne\'s most unique cultural experiences.',
  'melbourne-history-architecture-walk':
    'Gold rush arcades to Federation Square on foot — Melbourne\'s architectural transformation in 2 hrs. A$45 · Ideal Friday morning or post-race Sunday.',
  'old-melbourne-gaol-night-tour':
    "Walk Ned Kelly's corridor after dark — chilling cell blocks and colonial crime stories. A$42 · 1.5 hrs · Fits any F1 evening including race-day night.",
  'royal-botanic-gardens-guided-walk':
    "8,500 plant species and 170 years of heritage in Melbourne's botanic gardens. A$35 · 1.5 hrs · Low-key morning reset between race sessions.",
  'fitzroy-collingwood-cultural-walk':
    "Brunswick Street galleries, vintage shops, and large-scale murals through Melbourne's creative heartland. A$49 · 2.5 hrs · Perfect Sunday morning wind-down.",
  'great-ocean-road-12-apostles-day-trip':
    'Drive the Great Ocean Road to the Twelve Apostles — rainforest, koalas, and coastal drama. A$115. Full-day best on pre-race Thursday.',
  'melbourne-bike-tour-bayside-st-kilda':
    "Pedal Melbourne's coastline from the CBD to St Kilda — Brighton's bathing boxes, Elwood foreshore, café stop. A$79 · 3 hrs · Morning sessions only.",
  'kayak-melbourne-yarra-river-paddle':
    'Paddle the Yarra past Federation Square and the CBD skyline on stable sit-on-top kayaks. A$89 · 2.5 hrs · All skill levels. Suits Friday and Saturday mornings.',
  'helicopter-flight-over-melbourne':
    'Private 30-minute helicopter over Melbourne — MCG, Port Phillip Bay, CBD skyline. A$199. Available in practice-day gaps. Instant confirmation.',
  'hot-air-balloon-over-melbourne-at-sunrise':
    "Float above Melbourne's CBD at dawn — one of the only cities in the world you can balloon over the skyline. A$379 · 4 hrs · Thursday and Sunday only.",
  'surfing-lesson-at-torquay-beach':
    "Learn to surf at Torquay, Victoria's surf capital. Beginner coaching, wetsuit and board included. A$89 · 3 hrs · Gateway to the Great Ocean Road.",
  'melbourne-skydive-st-kilda-beach-landing':
    '15,000ft tandem skydive with a beach landing at St Kilda — 60-second freefall, panoramic bay views. A$329 · 3 hrs · Mornings only, subject to weather.',
  'phillip-island-penguin-parade-tour':
    'Little penguins waddle ashore at sunset at Phillip Island — koalas and heritage farm included. A$135. Full day, Thursday departures.',
  'mornington-peninsula-hot-springs-wine':
    'Natural thermal pools at Peninsula Hot Springs plus boutique winery tastings and gourmet lunch. A$149. Full day on Thursday, the perfect pre-race reset.',
  'puffing-billy-steam-train-dandenong-ranges':
    'Heritage steam train through fern gullies and mountain ash forests in the Dandenong Ranges. A$109 · 6 hrs · Departures on pre-race Thursday.',
  'wilsons-promontory-national-park-day-trip':
    "Victoria's southernmost tip — summit hike, Squeaky Beach, wombats, kangaroos, and coastal wilderness. A$159. Full day from Melbourne on Thursday.",
  'yarra-valley-winery-hopping-tour':
    'Four Yarra Valley estates with pinot noir and chardonnay tastings, plus a winery restaurant lunch. A$129 · 7 hrs · Pre-race Thursday special.',
  'healesville-sanctuary-wildlife-experience':
    'Koalas, wombats, kangaroos, platypus, and a live Birds of Prey show at Healesville Sanctuary. A$89 · Half day · Available Thursday or post-race Sunday.',
  'grampians-national-park-eco-day-tour':
    'Small-group eco tour to the Grampians — Grand Canyon trail, Mackenzie Falls, wild kangaroos, and Ballarat stop. A$175. Thursday departures only.',
  'melbourne-rooftop-bar-crawl':
    "Four of Melbourne's best rooftop bars with welcome drinks and skip-the-line entry. A$89 · 3.5 hrs · Ideal Thursday–Sunday evenings after sessions.",
  'hidden-speakeasy-cocktail-tour':
    "Two craft cocktails and secret entrances through Melbourne's prohibition-era speakeasy circuit. A$110 · 3 hrs · Best on Friday and Saturday evenings.",
  'melbourne-live-music-pub-crawl':
    "Jazz bars to rock pubs — Melbourne's legendary live music scene in one guided evening. A$79 · 3 hrs · Post-qualifying Friday and race-day Saturday.",
  'melbourne-uncover-hidden-laneway-bars':
    "Hidden bars inside convenience stores and above shopfronts — Melbourne's most secretive laneway circuit. A$79 · 3 hrs · Any F1 evening, self-paced.",
  'haunted-melbourne-ghost-tour':
    "Shadowy laneways, opium den ruins, and unsolved murders — Melbourne's most haunted sites after dark. A$39 · 2 hrs · Departs 8:30 PM every evening.",
  'melbourne-river-cruise-with-dinner':
    '4-course dinner on the Yarra River with the illuminated city skyline drifting past. A$129 · 3 hrs · Refined race-night dining on the Spirit of Melbourne.',
  'casino-southbank-evening-experience':
    "Crown Casino fire show, riverside dining, and Southbank's waterfront bars on a glamorous evening. A$59 · 3 hrs · Walking distance from the CBD hotels.",
};

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT) || 3306,
    user: process.env.DATABASE_USER ?? 'root',
    password: process.env.DATABASE_PASSWORD ?? '',
    database: process.env.DATABASE_NAME ?? 'pitlane',
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
  });

  let updated = 0;
  let notFound = 0;

  for (const [slug, abstract] of Object.entries(abstracts)) {
    const [result] = await conn.execute(
      'UPDATE experiences SET abstract = ? WHERE slug = ?',
      [abstract, slug]
    ) as any[];

    if (result.affectedRows > 0) {
      console.log(`✓ ${slug} (${abstract.length} chars)`);
      updated++;
    } else {
      console.warn(`✗ NOT FOUND: ${slug}`);
      notFound++;
    }
  }

  await conn.end();

  console.log(`\nDone — ${updated} updated, ${notFound} not found`);
  if (notFound > 0) process.exit(1);
}

run().catch((err) => { console.error(err); process.exit(1); });
