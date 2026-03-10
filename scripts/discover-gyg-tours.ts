/**
 * GYG Tour Discovery Script
 *
 * Queries the GYG search API across multiple queries for a given city/race,
 * deduplicates results, scores by popularity + relevance, and outputs top 80
 * candidates to a JSON file for human review.
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/discover-gyg-tours.ts --race japan-2026
 *   npx tsx --env-file=.env scripts/discover-gyg-tours.ts --race shanghai-2026
 *   npx tsx --env-file=.env scripts/discover-gyg-tours.ts --race melbourne-2026
 *
 * Output: scripts/output/{race-slug}-candidates.json
 *
 * After running:
 *   1. Open the output JSON
 *   2. Pick 40–45 experiences (rating >= 4.5, reviews >= 50, good category mix)
 *   3. Copy approved tour_ids to seed-{race}-experiences.ts
 *   4. Run seed-{race}-experiences.ts to insert to DB
 *   5. Run enrich-from-gyg.ts to pull photos, pricing, highlights
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const GYG_API_KEY  = process.env.GYG_API_KEY ?? '';
const GYG_BASE_URL = 'https://api.getyourguide.com/1';
const OUTPUT_DIR   = path.join(process.cwd(), 'scripts', 'output');

if (!GYG_API_KEY) {
  console.error('[discover] GYG_API_KEY is not set in .env');
  process.exit(1);
}

// ── Discovery configs per race slug ─────────────────────────────────────────

interface DiscoveryConfig {
  city:           string;
  currency:       string;
  raceSlug:       string;
  sessionWindows: Record<string, { label: string; maxDuration: number }>;
  searches:       Array<{ query: string; category: string }>;
  relevanceKeywords: string[];
  categorySignals:   Record<string, string[]>;
}

const CONFIGS: Record<string, DiscoveryConfig> = {
  'japan-2026': {
    city:     'Nagoya',
    currency: 'JPY',
    raceSlug: 'japan-2026',
    sessionWindows: {
      'fri-morning': { label: 'Friday Morning — Before FP1',         maxDuration: 3.5 },
      'fri-gap':     { label: 'Friday Afternoon — Between Sessions',  maxDuration: 2.0 },
      'fri-evening': { label: 'Friday Evening — After FP2',           maxDuration: 4.0 },
      'sat-morning': { label: 'Saturday Morning — Before FP3',        maxDuration: 3.5 },
      'sat-gap':     { label: 'Saturday Afternoon — Between Sessions', maxDuration: 2.0 },
      'sat-evening': { label: 'Saturday Evening — After Qualifying',  maxDuration: 4.0 },
      'sun-morning': { label: 'Sunday Morning — Race Day',            maxDuration: 6.0 },
      'post-race':   { label: 'Sunday Evening — After Race',          maxDuration: 3.0 },
    },
    searches: [
      { query: 'Nagoya food tour',                  category: 'food'      },
      { query: 'Nagoya miso katsu restaurant',      category: 'food'      },
      { query: 'ramen experience Nagoya',           category: 'food'      },
      { query: 'sake tasting Japan',                category: 'food'      },
      { query: 'Japanese cooking class Nagoya',     category: 'food'      },
      { query: 'Ise Grand Shrine tour',             category: 'culture'   },
      { query: 'Nagoya Castle tour',                category: 'culture'   },
      { query: 'Japanese tea ceremony Nagoya',      category: 'culture'   },
      { query: 'Kyoto day trip from Nagoya',        category: 'daytrip'   },
      { query: 'Kyoto tour temples shrines',        category: 'daytrip'   },
      { query: 'Nara deer park tour',               category: 'daytrip'   },
      { query: 'Osaka day trip from Nagoya',        category: 'daytrip'   },
      { query: 'Inuyama Castle tour',               category: 'daytrip'   },
      { query: 'Ghibli Park Nagoya',               category: 'daytrip'   },
      { query: 'Fushimi Inari shrine Kyoto',       category: 'culture'   },
      { query: 'Arashiyama bamboo Kyoto',           category: 'culture'   },
      { query: 'Zen garden meditation Japan',       category: 'culture'   },
      { query: 'samurai experience Japan',          category: 'culture'   },
      { query: 'ninja experience Nagoya',           category: 'culture'   },
      { query: 'geisha experience Kyoto',           category: 'culture'   },
      { query: 'cycling tour Japan',               category: 'adventure' },
      { query: 'kayaking Japan',                   category: 'adventure' },
      { query: 'Ise Bay cruise',                   category: 'adventure' },
      { query: 'Mount Fuji day trip',              category: 'adventure' },
      { query: 'Nagoya izakaya bar tour',          category: 'nightlife' },
      { query: 'Osaka nightlife bar tour',         category: 'nightlife' },
      { query: 'cocktail bar Nagoya',              category: 'nightlife' },
      { query: 'Nagoya',                           category: 'culture'   }, // catch-all
      { query: 'Japan experience',                 category: 'culture'   }, // catch-all
    ],
    relevanceKeywords: [
      'nagoya', 'suzuka', 'ise', 'kyoto', 'nara', 'osaka', 'inuyama',
      'miso katsu', 'ramen', 'izakaya', 'sake', 'sushi', 'tea ceremony',
      'castle', 'shrine', 'temple', 'bamboo', 'geisha', 'samurai',
      'fushimi', 'arashiyama', 'ghibli', 'bullet train', 'shinkansen',
      'cherry blossom', 'sakura',
    ],
    categorySignals: {
      food:      ['food', 'eat', 'ramen', 'sushi', 'miso', 'sake', 'cooking', 'tasting', 'restaurant', 'izakaya', 'wagyu', 'tempura', 'noodle', 'market', 'culinary'],
      nightlife: ['night', 'bar', 'nightlife', 'evening', 'cocktail', 'izakaya', 'club', 'pub crawl', 'sake bar'],
      adventure: ['adventure', 'hiking', 'bike', 'cycle', 'kayak', 'cruise', 'boat', 'sport', 'active', 'outdoor', 'mount fuji', 'climb'],
      daytrip:   ['day trip', 'kyoto', 'nara', 'osaka', 'inuyama', 'full day', 'day tour', 'excursion', 'ghibli', 'fuji', 'shinkansen'],
      culture:   ['museum', 'history', 'castle', 'shrine', 'temple', 'heritage', 'art', 'tea ceremony', 'origami', 'samurai', 'geisha', 'ninja', 'bamboo', 'zen', 'meditation', 'architecture', 'walk', 'garden'],
    },
  },

  'shanghai-2026': {
    city:     'Shanghai',
    currency: 'CNY',
    raceSlug: 'shanghai-2026',
    sessionWindows: {
      'fri-morning': { label: 'Friday Morning — Before FP1',         maxDuration: 3.5 },
      'fri-gap':     { label: 'Friday Afternoon — Between Sessions',  maxDuration: 1.5 },
      'fri-evening': { label: 'Friday Evening — After FP2',           maxDuration: 4.0 },
      'sat-morning': { label: 'Saturday Morning — Before FP3',        maxDuration: 3.5 },
      'sat-gap':     { label: 'Saturday Afternoon — Between Sessions', maxDuration: 1.5 },
      'sat-evening': { label: 'Saturday Evening — After Qualifying',  maxDuration: 4.0 },
      'sun-morning': { label: 'Sunday Morning — Race Day',            maxDuration: 6.0 },
      'post-race':   { label: 'Sunday Evening — After Race',          maxDuration: 3.0 },
    },
    searches: [
      { query: 'Shanghai food tour',               category: 'food'      },
      { query: 'French Concession food tour',      category: 'food'      },
      { query: 'dim sum Shanghai experience',      category: 'food'      },
      { query: 'Shanghai culture tour',            category: 'culture'   },
      { query: 'Bund Shanghai tour',               category: 'culture'   },
      { query: 'Yu Garden tour Shanghai',          category: 'culture'   },
      { query: 'Zhujiajiao water town tour',       category: 'daytrip'   },
      { query: 'Suzhou day trip Shanghai',         category: 'daytrip'   },
      { query: 'Shanghai river cruise',            category: 'adventure' },
      { query: 'Shanghai nightlife bar tour',      category: 'nightlife' },
      { query: 'Shanghai',                         category: 'culture'   },
    ],
    relevanceKeywords: [
      'shanghai', 'bund', 'pudong', 'french concession', 'xintiandi',
      'zhujiajiao', 'suzhou', 'yu garden', 'dim sum', 'xiaolongbao',
      'huangpu', 'acrobatics', 'tea ceremony', 'kung fu',
    ],
    categorySignals: {
      food:      ['food', 'eat', 'dim sum', 'xiaolongbao', 'culinary', 'cooking', 'tasting', 'restaurant'],
      nightlife: ['night', 'bar', 'nightlife', 'evening', 'cocktail', 'club'],
      adventure: ['adventure', 'bike', 'cruise', 'boat', 'kayak', 'sport', 'outdoor'],
      daytrip:   ['day trip', 'zhujiajiao', 'suzhou', 'full day', 'excursion'],
      culture:   ['museum', 'history', 'bund', 'temple', 'heritage', 'art', 'tea', 'acrobatics', 'architecture', 'walk', 'garden'],
    },
  },

  'bahrain-2026': {
    city:     'Manama',
    currency: 'USD',
    raceSlug: 'bahrain-2026',
    sessionWindows: {
      'fri-morning': { label: 'Friday Morning — Explore Before FP1',         maxDuration: 6.0 },
      'fri-gap':     { label: 'Friday Afternoon — Between Sessions',          maxDuration: 2.0 },
      'fri-evening': { label: 'Friday Evening — After Practice',              maxDuration: 4.0 },
      'sat-morning': { label: 'Saturday Morning — Full Day Before FP3',       maxDuration: 7.0 },
      'sat-gap':     { label: 'Saturday Afternoon — Between FP3 and Quali',   maxDuration: 2.0 },
      'sat-evening': { label: 'Saturday Evening — After Qualifying',          maxDuration: 3.0 },
      'sun-morning': { label: 'Race Day — Morning and Afternoon',             maxDuration: 9.0 },
      'sun-evening': { label: 'Post-Race Celebration Night',                  maxDuration: 3.0 },
    },
    searches: [
      // Food & Dining
      { query: 'Manama food tour',                              category: 'food'      },
      { query: 'traditional Bahraini food experience',          category: 'food'      },
      { query: 'Bahrain seafood dinner',                        category: 'food'      },
      { query: 'Adliya restaurant tour Bahrain',                category: 'food'      },
      { query: 'Bahrain cooking class',                         category: 'food'      },
      { query: 'Bahrain street food tour',                      category: 'food'      },
      { query: 'Bahrain coffee tea experience',                 category: 'food'      },
      // Culture
      { query: 'Bahrain Fort tour',                             category: 'culture'   },
      { query: 'Manama souq tour',                              category: 'culture'   },
      { query: 'Bahrain heritage tour',                         category: 'culture'   },
      { query: 'Muharraq old town walking tour',                category: 'culture'   },
      { query: 'Bahrain National Museum',                       category: 'culture'   },
      { query: 'Bahrain pearling trail UNESCO',                 category: 'culture'   },
      { query: 'Bahrain Al Jasra village tour',                 category: 'culture'   },
      { query: 'Bahrain mosque tour',                           category: 'culture'   },
      { query: 'Bahrain walking history tour',                  category: 'culture'   },
      { query: 'Bahrain architecture photography tour',         category: 'culture'   },
      // Adventure
      { query: 'Bahrain desert safari',                         category: 'adventure' },
      { query: 'dune bashing Bahrain',                          category: 'adventure' },
      { query: 'camel riding Bahrain desert',                   category: 'adventure' },
      { query: 'Bahrain scuba diving',                          category: 'adventure' },
      { query: 'Bahrain water sports kayaking',                 category: 'adventure' },
      { query: 'Bahrain quad biking',                           category: 'adventure' },
      // Day Trips
      { query: 'dhow cruise Bahrain',                           category: 'daytrip'   },
      { query: 'Al Dar islands boat trip Bahrain',              category: 'daytrip'   },
      { query: 'Tree of Life Bahrain tour',                     category: 'daytrip'   },
      { query: 'Manama city tour',                              category: 'daytrip'   },
      { query: 'Hawar islands Bahrain',                         category: 'daytrip'   },
      { query: 'Saudi Arabia day trip from Bahrain',            category: 'daytrip'   },
      { query: 'Bahrain Qalat Fort historic tour',              category: 'daytrip'   },
      { query: 'Bahrain private guided day tour',               category: 'daytrip'   },
      // Nightlife
      { query: 'Bahrain nightlife tour',                        category: 'nightlife' },
      { query: 'rooftop bar Manama',                            category: 'nightlife' },
      { query: 'Bahrain evening experience sunset',             category: 'nightlife' },
      // Catch-all
      { query: 'Bahrain tour experience',                       category: 'culture'   },
      { query: 'things to do Manama',                           category: 'culture'   },
      { query: 'Bahrain sightseeing tour',                      category: 'daytrip'   },
      { query: 'Bahrain F1 circuit tour',                       category: 'culture'   },
    ],
    relevanceKeywords: [
      // Strict geo terms — these are Bahrain-specific and won't match global tours
      'bahrain', 'manama', 'sakhir', 'dilmun', 'muharraq', 'al dar',
      'adliya', 'pearl diving', 'machboos', 'bahraini',
    ],
    categorySignals: {
      food:      ['food', 'eat', 'dinner', 'restaurant', 'culinary', 'tasting', 'seafood', 'cuisine', 'market', 'machboos', 'tea', 'cafe', 'coffee'],
      nightlife: ['night', 'bar', 'nightlife', 'evening', 'cocktail', 'club', 'rooftop', 'lounge', 'pub'],
      adventure: ['adventure', 'safari', 'desert', 'dune', 'camel', 'off-road', 'kite', 'outdoor', 'sport', 'dive', 'snorkel'],
      daytrip:   ['day trip', 'dhow', 'cruise', 'boat', 'island', 'al dar', 'tree of life', 'full day', 'excursion', 'city tour'],
      culture:   ['museum', 'history', 'fort', 'heritage', 'souq', 'souk', 'art', 'walk', 'walking tour', 'old town', 'national', 'pearl', 'dilmun', 'architecture', 'mosque', 'gold souk'],
    },
  },

  'saudi-2026': {
    city:     'Jeddah',
    currency: 'SAR',
    raceSlug: 'saudi-2026',
    sessionWindows: {
      'fri-morning': { label: 'Friday Morning — Before FP1',                 maxDuration: 8.0 },
      'fri-gap':     { label: 'Friday Afternoon — Between FP1/FP2',          maxDuration: 2.0 },
      'fri-evening': { label: 'Friday Night — After FP2',                    maxDuration: 2.0 },
      'sat-morning': { label: 'Saturday Morning — Before FP3',               maxDuration: 8.0 },
      'sat-gap':     { label: 'Saturday Afternoon — Between FP3/Quali',      maxDuration: 2.0 },
      'sat-evening': { label: 'Saturday Night — After Qualifying',           maxDuration: 2.0 },
      'sun-morning': { label: 'Race Day Morning — Before the Grand Prix',    maxDuration: 10.0 },
      'sun-evening': { label: 'Post-Race Night — Corniche Celebrations',     maxDuration: 2.0 },
    },
    searches: [
      { query: 'Jeddah food tour',                             category: 'food'      },
      { query: 'Jeddah seafood restaurant experience',         category: 'food'      },
      { query: 'Saudi Arabia traditional food tour',           category: 'food'      },
      { query: 'Al Balad Jeddah tour',                         category: 'culture'   },
      { query: 'Jeddah historical tour',                       category: 'culture'   },
      { query: 'Jeddah city tour UNESCO',                      category: 'culture'   },
      { query: 'Jeddah old town walking tour',                 category: 'culture'   },
      { query: 'King Fahd Fountain Jeddah',                    category: 'culture'   },
      { query: 'Red Sea diving Jeddah',                        category: 'adventure' },
      { query: 'Red Sea snorkeling Jeddah',                    category: 'adventure' },
      { query: 'Saudi desert safari Jeddah',                   category: 'adventure' },
      { query: 'Jeddah boat tour Red Sea',                     category: 'adventure' },
      { query: 'Jeddah Corniche sunset cruise',                category: 'adventure' },
      { query: 'Jeddah nightlife Corniche',                    category: 'nightlife' },
      { query: 'rooftop bar Jeddah',                           category: 'nightlife' },
      { query: 'Taif day trip from Jeddah',                    category: 'daytrip'   },
      { query: 'Jeddah',                                       category: 'culture'   },
      { query: 'things to do Jeddah',                          category: 'culture'   },
    ],
    relevanceKeywords: [
      'jeddah', 'al balad', 'corniche', 'red sea', 'saudi', 'taif',
      'king fahd', 'souq', 'souk', 'mangrove', 'pearl', 'gulf',
    ],
    categorySignals: {
      food:      ['food', 'eat', 'seafood', 'restaurant', 'culinary', 'tasting', 'cooking', 'market', 'traditional'],
      nightlife: ['night', 'bar', 'nightlife', 'evening', 'cocktail', 'rooftop', 'lounge', 'sunset'],
      adventure: ['adventure', 'dive', 'diving', 'snorkel', 'boat', 'cruise', 'desert', 'safari', 'kayak', 'water'],
      daytrip:   ['day trip', 'taif', 'full day', 'excursion', 'outside'],
      culture:   ['museum', 'history', 'fort', 'heritage', 'souq', 'souk', 'walk', 'old town', 'al balad', 'mosque', 'architecture', 'fountain', 'corniche', 'unesco'],
    },
  },

  'melbourne-2026': {
    city:     'Melbourne',
    currency: 'AUD',
    raceSlug: 'melbourne-2026',
    sessionWindows: {
      'thu-morning': { label: 'Thursday Morning',                     maxDuration: 4.0 },
      'fri-morning': { label: 'Friday Morning — Before FP1',         maxDuration: 3.5 },
      'fri-gap':     { label: 'Friday Afternoon — Between Sessions',  maxDuration: 1.5 },
      'fri-evening': { label: 'Friday Evening — After FP2',           maxDuration: 4.0 },
      'sat-morning': { label: 'Saturday Morning — Before FP3',        maxDuration: 3.5 },
      'sat-gap':     { label: 'Saturday Afternoon — Between Sessions', maxDuration: 1.5 },
      'sat-evening': { label: 'Saturday Evening — After Qualifying',  maxDuration: 4.0 },
      'sun-morning': { label: 'Sunday Morning — Race Day',            maxDuration: 4.0 },
      'post-race':   { label: 'Sunday Evening — After Race',          maxDuration: 3.0 },
    },
    searches: [
      { query: 'Melbourne food tour laneways',     category: 'food'      },
      { query: 'Melbourne coffee tour',            category: 'food'      },
      { query: 'Great Ocean Road day trip',        category: 'daytrip'   },
      { query: 'Yarra Valley wine tour Melbourne', category: 'daytrip'   },
      { query: 'Melbourne culture tour',           category: 'culture'   },
      { query: 'Melbourne adventure outdoor',      category: 'adventure' },
      { query: 'Melbourne nightlife bar tour',     category: 'nightlife' },
      { query: 'Melbourne',                        category: 'culture'   },
    ],
    relevanceKeywords: [
      'melbourne', 'albert park', 'st kilda', 'south yarra', 'cbd',
      'great ocean road', 'yarra valley', 'dandenong', 'phillip island',
      'laneways', 'federation square', 'botanic gardens',
    ],
    categorySignals: {
      food:      ['food', 'eat', 'coffee', 'culinary', 'cooking', 'tasting', 'restaurant', 'laneway', 'market'],
      nightlife: ['night', 'bar', 'nightlife', 'evening', 'cocktail', 'club', 'rooftop'],
      adventure: ['adventure', 'hiking', 'bike', 'surf', 'kayak', 'sport', 'active', 'outdoor'],
      daytrip:   ['day trip', 'great ocean road', 'yarra valley', 'phillip island', 'full day', 'excursion'],
      culture:   ['museum', 'history', 'heritage', 'art', 'gallery', 'architecture', 'walk', 'garden', 'botanic'],
    },
  },
};

// ── Parse CLI args ─────────────────────────────────────────────────────────
const raceArg = process.argv.find((_, i) => process.argv[i - 1] === '--race');
const raceSlug = raceArg ?? 'japan-2026';
const autoApproveArg = process.argv.find((_, i) => process.argv[i - 1] === '--auto-approve');
const autoApproveCount = autoApproveArg ? Math.max(0, Number.parseInt(autoApproveArg, 10) || 0) : 0;

const CONFIG = CONFIGS[raceSlug];
if (!CONFIG) {
  console.error(`[discover] Unknown race: "${raceSlug}". Available: ${Object.keys(CONFIGS).join(', ')}`);
  process.exit(1);
}

// ── Core API fetch ─────────────────────────────────────────────────────────
async function gygSearch(query: string, category: string): Promise<Record<string, unknown>[]> {
  const request = async (currency: string) => {
    const params = new URLSearchParams({
      q:             query,
      cnt_language:  'en',
      currency,
      limit:         '50',
      sortfield:     'popularity',
      sortdirection: 'DESC',
    });
    const response = await fetch(`${GYG_BASE_URL}/tours?${params}`, {
      headers: {
        'X-ACCESS-TOKEN': GYG_API_KEY,
        'accept':          'application/json',
      },
    });
    return { response, currency };
  };

  let { response: res, currency: usedCurrency } = await request(CONFIG.currency);
  if (!res.ok && res.status === 400 && CONFIG.currency !== 'USD') {
    ({ response: res, currency: usedCurrency } = await request('USD'));
    if (res.ok) {
      console.warn(`  [${category}] "${query}" → fallback currency USD`);
    }
  }

  if (!res.ok) {
    console.error(`  GYG HTTP ${res.status} for "${query}"`);
    return [];
  }

  const data = await res.json() as Record<string, unknown>;
  const nested = data?.data as Record<string, unknown> | undefined;
  const tours = (nested?.tours ?? data?.tours ?? data?.data ?? []) as Record<string, unknown>[];
  console.log(`  [${category}] "${query}" → ${Array.isArray(tours) ? tours.length : 0} results (${usedCurrency})`);
  return Array.isArray(tours) ? tours : [];
}

// ── Duration parsing ───────────────────────────────────────────────────────
function parseDurationHours(tour: Record<string, unknown>): number | null {
  const durations = tour.durations as Array<{ duration: number; unit: string }> | undefined;
  if (Array.isArray(durations) && durations.length > 0) {
    const d = durations[0];
    const unit = (d.unit ?? '').toLowerCase();
    if (unit === 'hour' || unit === 'hours')     return d.duration;
    if (unit === 'minute' || unit === 'minutes') return Math.round((d.duration / 60) * 10) / 10;
    if (unit === 'day' || unit === 'days')       return d.duration * 8;
  }
  const title = ((tour.title as string) ?? '').toLowerCase();
  if (title.includes('full day') || title.includes('full-day')) return 8;
  if (title.includes('half day') || title.includes('half-day')) return 4;
  return null;
}

// ── Category assignment ────────────────────────────────────────────────────
function assignCategory(tour: Record<string, unknown>, hint: string): string {
  const cats = (tour.categories as string[] | undefined) ?? [];
  const text = `${tour.title ?? ''} ${tour.abstract ?? ''} ${cats.join(' ')}`.toLowerCase();
  for (const [cat, signals] of Object.entries(CONFIG.categorySignals)) {
    if (signals.some(s => text.includes(s))) return cat;
  }
  return hint;
}

// ── Window assignment based on duration ───────────────────────────────────
function assignWindows(durationHours: number | null): string[] {
  if (durationHours === null) return Object.keys(CONFIG.sessionWindows);
  return Object.entries(CONFIG.sessionWindows)
    .filter(([, w]) => durationHours <= w.maxDuration)
    .map(([slug]) => slug);
}

// ── Scoring ────────────────────────────────────────────────────────────────
function scoreTour(tour: Record<string, unknown>): number {
  const rating  = parseFloat(String(tour.overall_rating ?? tour.rating ?? '0'));
  const reviews = parseInt(String(tour.number_of_ratings ?? tour.number_of_reviews ?? '0'), 10);
  const dur     = parseDurationHours(tour);

  let base = rating * Math.log10(reviews + 1);

  const text = `${tour.title ?? ''} ${tour.abstract ?? ''}`.toLowerCase();
  if (CONFIG.relevanceKeywords.some(k => text.includes(k))) base *= 1.2;
  if (dur !== null && dur <= 4) base *= 1.15; // fits session gaps bonus

  return Math.round(base * 100) / 100;
}

// ── Image URL extraction ───────────────────────────────────────────────────
function extractImageUrl(tour: Record<string, unknown>): string {
  const pics = tour.pictures as Array<{ ssl_url?: string; url?: string }> | undefined;
  const raw = pics?.[0]?.ssl_url ?? pics?.[0]?.url ?? (tour.image_url as string) ?? '';
  return raw ? raw.replace('[format_id]', 'medium') : '';
}

// ── Price extraction ───────────────────────────────────────────────────────
function extractPrice(tour: Record<string, unknown>): number {
  const price = tour.price as Record<string, Record<string, number>> | undefined;
  const p = price?.values?.amount
    ?? (tour.retail_price as Record<string, number>)?.value
    ?? (tour.starting_price as Record<string, number>)?.value
    ?? 0;
  return Math.round(parseFloat(String(p)) || 0);
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n=== GYG Tour Discovery: ${CONFIG.city} (${CONFIG.raceSlug}) ===`);
  console.log(`${CONFIG.searches.length} queries | currency: ${CONFIG.currency} | top 80 output\n`);

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // 1. Run all searches, deduplicate by tour_id
  const seen = new Map<string | number, { tour: Record<string, unknown>; categoryHint: string }>();

  for (let i = 0; i < CONFIG.searches.length; i++) {
    const { query, category } = CONFIG.searches[i];
    try {
      const tours = await gygSearch(query, category);
      for (const tour of tours) {
        const id = (tour.tour_id ?? tour.id) as string | number;
        if (id && !seen.has(id)) seen.set(id, { tour, categoryHint: category });
      }
    } catch (err) {
      console.error(`  ERROR: ${(err as Error).message}`);
    }
    // Rate limit: ~60 req/min on partner tier
    if (i < CONFIG.searches.length - 1) await new Promise(r => setTimeout(r, 1100));
  }

  console.log(`\nUnique tours collected: ${seen.size}`);

  // 2. Relevance filter — discard tours with no keyword match in title or abstract.
  //    This prevents high-review global tours (Naples, Prague…) from dominating.
  function isRelevant(tour: Record<string, unknown>): boolean {
    const text = `${tour.title ?? ''} ${tour.abstract ?? ''}`.toLowerCase();
    return CONFIG.relevanceKeywords.some(k => text.includes(k));
  }

  const relevantEntries = [...seen.entries()].filter(([, { tour }]) => isRelevant(tour));
  const filteredEntries = relevantEntries.length >= 20
    ? relevantEntries
    : [...seen.entries()]; // fallback: too few relevant — use all

  if (relevantEntries.length < seen.size) {
    console.log(`Relevance filter: ${relevantEntries.length} / ${seen.size} tours kept`);
    if (relevantEntries.length < 20) {
      console.warn(`  ⚠ Only ${relevantEntries.length} relevant tours — falling back to unfiltered set. Add more relevance keywords.`);
    }
  }

  // 3. Score + enrich
  const candidates = [];
  for (const [tourId, { tour, categoryHint }] of filteredEntries) {
    const rating        = parseFloat(String(tour.overall_rating ?? tour.rating ?? '0'));
    const reviews       = parseInt(String(tour.number_of_ratings ?? tour.number_of_reviews ?? '0'), 10);
    const durationHours = parseDurationHours(tour);
    const score         = scoreTour(tour);
    const category      = assignCategory(tour, categoryHint);
    const windows       = assignWindows(durationHours);
    const price         = extractPrice(tour);

    candidates.push({
      rank:                 0,
      tour_id:              tourId,
      affiliate_product_id: `t${tourId}`,
      title:                (tour.title as string) ?? '',
      abstract:             String(tour.abstract ?? tour.short_description ?? ''),
      category_suggestion:  category,
      overall_rating:       rating,
      number_of_ratings:    reviews,
      price_local:          price,
      currency:             CONFIG.currency,
      duration_hours:       durationHours,
      duration_label:       durationHours == null
        ? 'Varies'
        : durationHours >= 8 ? 'Full day' : `${durationHours} hrs`,
      image_url:            extractImageUrl(tour),
      gyg_url:              `https://www.getyourguide.com/activity-t${tourId}/`,
      suggested_windows:    windows,
      score,
      // Human review fields (leave blank — fill in after reviewing)
      approved:             false,
      override_category:    '',
      is_featured:          false,
      sort_order_override:  0,
      notes:                '',
    });
  }

  // 4. Sort → top 120 → assign ranks
  candidates.sort((a, b) => b.score - a.score);
  const top120 = candidates.slice(0, 120).map((c, i) => ({ ...c, rank: i + 1 }));

  if (autoApproveCount > 0) {
    const approvedCount = Math.min(autoApproveCount, top120.length);
    const featuredCount = Math.min(8, approvedCount);

    for (let i = 0; i < approvedCount; i++) {
      top120[i].approved = true;
      if (!top120[i].sort_order_override || top120[i].sort_order_override <= 0) {
        top120[i].sort_order_override = i + 1;
      }
    }

    for (let i = 0; i < featuredCount; i++) {
      top120[i].is_featured = true;
    }

    console.log(`[discover] Auto-approved top ${approvedCount} candidates`);
    console.log(`[discover] Auto-featured top ${featuredCount} approved candidates`);
  }

  // 5. Write output
  const outputFile = path.join(OUTPUT_DIR, `${CONFIG.raceSlug}-candidates.json`);
  fs.writeFileSync(outputFile, JSON.stringify(top120, null, 2));
  console.log(`\nWrote ${top120.length} candidates → ${outputFile}`);

  // 6. Console summary
  console.log('\n--- Top 20 Candidates ---');
  console.log('Rank  Score  Rating  Reviews  Price     Dur     Category     Title');
  console.log('─'.repeat(100));
  for (const t of top120.slice(0, 20)) {
    const dur = t.duration_hours != null ? `${t.duration_hours}h` : '?';
    const price = `${CONFIG.currency} ${t.price_local}`;
    console.log(
      String(t.rank).padEnd(6) +
      String(t.score).padEnd(7) +
      String(t.overall_rating.toFixed(1)).padEnd(8) +
      String(t.number_of_ratings).padEnd(9) +
      price.padEnd(10) +
      dur.padEnd(8) +
      t.category_suggestion.padEnd(13) +
      (t.title ?? '').slice(0, 40)
    );
  }

  // 7. Category breakdown
  const byCategory: Record<string, number> = {};
  for (const t of top120) byCategory[t.category_suggestion] = (byCategory[t.category_suggestion] ?? 0) + 1;
  console.log('\n--- Category Coverage ---');
  for (const [cat, count] of Object.entries(byCategory)) {
    console.log(`  ${cat.padEnd(12)} ${'█'.repeat(Math.min(count, 40))} (${count})`);
  }

  const thin = Object.entries(byCategory).filter(([, c]) => c < 4).map(([cat]) => cat);
  if (thin.length) {
    console.warn(`\n⚠ Thin categories (< 4 tours): ${thin.join(', ')} — add more search queries`);
  } else {
    console.log('\n✓ All categories have ≥ 4 candidates. Ready for review.');
  }

  console.log(`\nNext steps:`);
  console.log(`  1. Open scripts/output/${CONFIG.raceSlug}-candidates.json`);
  console.log(`  2. Set "approved": true on 40–45 experiences (rating >= 4.5, reviews >= 50)`);
  console.log(`  3. Run: npx tsx --env-file=.env scripts/seed-from-candidates.ts --race ${CONFIG.raceSlug}`);
  console.log(`  4. Run: npx tsx --env-file=.env scripts/enrich-from-gyg.ts --race ${CONFIG.raceSlug}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
