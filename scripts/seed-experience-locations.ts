/**
 * Seed script: populates distance_km, neighborhood, travel_mins (and lat/lng fallback)
 * for the 35 Melbourne experiences.
 * Run after migrate-add-location-fields.ts:
 *   npx tsx --env-file=.env scripts/seed-experience-locations.ts
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

const DB_HOST = process.env.DATABASE_HOST ?? 'localhost';
const DB_PORT = Number(process.env.DATABASE_PORT) || 3306;
const DB_USER = process.env.DATABASE_USER ?? 'root';
const DB_PASS = process.env.DATABASE_PASSWORD ?? '';
const DB_NAME = process.env.DATABASE_NAME ?? 'pitlane';

interface LocationData {
  distanceKm: number;
  neighborhood: string;
  travelMins: number;
  lat: number;
  lng: number;
}

// Circuit coordinates: -37.8497, 144.968
const EXPERIENCE_LOCATIONS: Record<string, LocationData> = {
  // Food & Coffee
  'melbourne-laneways-hidden-bars-food-tour':    { distanceKm: 4.2, neighborhood: 'CBD', travelMins: 15, lat: -37.8136, lng: 144.9631 },
  'queen-victoria-market-foodie-tour':           { distanceKm: 5.1, neighborhood: 'North Melbourne', travelMins: 18, lat: -37.8071, lng: 144.9566 },
  'melbourne-coffee-culture-walking-tour':       { distanceKm: 4.0, neighborhood: 'CBD', travelMins: 15, lat: -37.8136, lng: 144.9631 },
  'yarra-valley-wine-food-day-tour':             { distanceKm: 58, neighborhood: 'Yarra Valley', travelMins: 60, lat: -37.6533, lng: 145.5444 },
  'melbourne-street-food-night-market-tour':     { distanceKm: 4.2, neighborhood: 'CBD', travelMins: 15, lat: -37.8136, lng: 144.9631 },
  'south-melbourne-market-grazing-tour':         { distanceKm: 2.8, neighborhood: 'South Melbourne', travelMins: 10, lat: -37.8356, lng: 144.9554 },
  'craft-beer-brewery-walk-collingwood':         { distanceKm: 7.5, neighborhood: 'Collingwood', travelMins: 25, lat: -37.8061, lng: 145.0000 },

  // Culture & Art
  'melbourne-street-art-laneways-tour':          { distanceKm: 4.2, neighborhood: 'CBD', travelMins: 15, lat: -37.8136, lng: 144.9631 },
  'ngv-arts-precinct-guided-tour':               { distanceKm: 2.8, neighborhood: 'St Kilda Road', travelMins: 10, lat: -37.8238, lng: 144.9686 },
  'aboriginal-heritage-walking-tour':            { distanceKm: 3.8, neighborhood: 'CBD / Yarra', travelMins: 14, lat: -37.8180, lng: 144.9640 },
  'melbourne-history-architecture-walk':         { distanceKm: 4.2, neighborhood: 'CBD', travelMins: 15, lat: -37.8136, lng: 144.9631 },
  'old-melbourne-gaol-night-tour':               { distanceKm: 4.5, neighborhood: 'CBD', travelMins: 16, lat: -37.8068, lng: 144.9631 },
  'royal-botanic-gardens-guided-walk':           { distanceKm: 2.2, neighborhood: 'Royal Botanic Gardens', travelMins: 8, lat: -37.8294, lng: 144.9797 },
  'fitzroy-collingwood-cultural-walk':           { distanceKm: 7.5, neighborhood: 'Fitzroy', travelMins: 25, lat: -37.7990, lng: 144.9784 },

  // Adventure & Outdoors
  'great-ocean-road-12-apostles-day-trip':       { distanceKm: 92, neighborhood: 'Great Ocean Road', travelMins: 90, lat: -38.6659, lng: 143.1053 },
  'melbourne-bike-tour-bayside-st-kilda':        { distanceKm: 2.5, neighborhood: 'St Kilda', travelMins: 10, lat: -37.8678, lng: 144.9826 },
  'kayak-melbourne-yarra-river-paddle':          { distanceKm: 3.5, neighborhood: 'Southbank', travelMins: 12, lat: -37.8224, lng: 144.9628 },
  'helicopter-flight-over-melbourne':            { distanceKm: 6.0, neighborhood: 'Port Melbourne', travelMins: 20, lat: -37.8265, lng: 144.9384 },
  'hot-air-balloon-over-melbourne-at-sunrise':   { distanceKm: 4.5, neighborhood: 'CBD meet point', travelMins: 16, lat: -37.8136, lng: 144.9631 },
  'surfing-lesson-at-torquay-beach':             { distanceKm: 100, neighborhood: 'Torquay', travelMins: 90, lat: -38.3333, lng: 144.3167 },
  'melbourne-skydive-st-kilda-beach-landing':    { distanceKm: 2.5, neighborhood: 'St Kilda', travelMins: 10, lat: -37.8678, lng: 144.9826 },

  // Day Trips
  'phillip-island-penguin-parade-tour':          { distanceKm: 142, neighborhood: 'Phillip Island', travelMins: 120, lat: -38.5000, lng: 145.2333 },
  'mornington-peninsula-hot-springs-wine':       { distanceKm: 65, neighborhood: 'Mornington Peninsula', travelMins: 65, lat: -38.3333, lng: 145.0333 },
  'puffing-billy-steam-train-dandenong-ranges':  { distanceKm: 45, neighborhood: 'Dandenong Ranges', travelMins: 55, lat: -37.8937, lng: 145.3486 },
  'wilsons-promontory-national-park-day-trip':   { distanceKm: 218, neighborhood: 'Wilsons Promontory', travelMins: 180, lat: -39.0833, lng: 146.3500 },
  'yarra-valley-winery-hopping-tour':            { distanceKm: 62, neighborhood: 'Yarra Valley', travelMins: 65, lat: -37.6500, lng: 145.5500 },
  'healesville-sanctuary-wildlife-experience':   { distanceKm: 68, neighborhood: 'Healesville', travelMins: 70, lat: -37.6500, lng: 145.5167 },
  'grampians-national-park-eco-day-tour':        { distanceKm: 258, neighborhood: 'Grampians', travelMins: 210, lat: -37.2500, lng: 142.5000 },

  // Nightlife
  'melbourne-rooftop-bar-crawl':                 { distanceKm: 4.2, neighborhood: 'CBD', travelMins: 15, lat: -37.8136, lng: 144.9631 },
  'hidden-speakeasy-cocktail-tour':              { distanceKm: 4.2, neighborhood: 'CBD', travelMins: 15, lat: -37.8136, lng: 144.9631 },
  'melbourne-live-music-pub-crawl':              { distanceKm: 5.5, neighborhood: 'CBD / Fitzroy', travelMins: 20, lat: -37.8061, lng: 144.9784 },
  'melbourne-uncover-hidden-laneway-bars':       { distanceKm: 4.2, neighborhood: 'CBD', travelMins: 15, lat: -37.8136, lng: 144.9631 },
  'haunted-melbourne-ghost-tour':                { distanceKm: 4.2, neighborhood: 'CBD', travelMins: 15, lat: -37.8136, lng: 144.9631 },
  'melbourne-river-cruise-with-dinner':          { distanceKm: 3.5, neighborhood: 'Southbank', travelMins: 12, lat: -37.8224, lng: 144.9628 },
  'casino-southbank-evening-experience':         { distanceKm: 3.5, neighborhood: 'Southbank', travelMins: 12, lat: -37.8224, lng: 144.9628 },
};

async function run() {
  const conn = await mysql.createConnection({
    host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASS, database: DB_NAME,
  });

  let updated = 0;
  let skipped = 0;

  try {
    for (const [slug, loc] of Object.entries(EXPERIENCE_LOCATIONS)) {
      // Update distance_km, neighborhood, travel_mins always
      // Update lat/lng only where lat IS NULL (don't overwrite GYG-provided coords)
      const [result] = await conn.execute<mysql.OkPacket>(
        `UPDATE experiences
         SET distance_km = ?,
             neighborhood = ?,
             travel_mins  = ?,
             lat          = COALESCE(lat, ?),
             lng          = COALESCE(lng, ?)
         WHERE slug = ?`,
        [loc.distanceKm, loc.neighborhood, loc.travelMins, loc.lat, loc.lng, slug]
      );
      if (result.affectedRows > 0) {
        updated++;
        console.log(`  ✅ ${slug}`);
      } else {
        skipped++;
        console.log(`  ⚠️  Not found: ${slug}`);
      }
    }
    console.log(`\nDone. Updated: ${updated}, Not found: ${skipped}`);
  } finally {
    await conn.end();
  }
}

run().catch((err) => { console.error(err); process.exit(1); });
