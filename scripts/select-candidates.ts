/**
 * AI Curation Script — select-candidates.ts
 *
 * Reads the raw candidates JSON from discover-gyg-tours.ts and uses Claude to
 * auto-curate 30–40 experiences with approved flags, category overrides,
 * featured flags, and sort orders. Writes decisions back to the same file.
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/select-candidates.ts --race bahrain-2026
 *   npx tsx --env-file=.env scripts/select-candidates.ts --race japan-2026
 */

import fs from 'fs';
import path from 'path';
import { generateText } from '@/lib/llm';

const OUTPUT_DIR = path.join(process.cwd(), 'scripts', 'output');

// ── CLI args ────────────────────────────────────────────────────────────────
const raceArgIdx = process.argv.indexOf('--race');
const raceSlug = raceArgIdx !== -1 ? process.argv[raceArgIdx + 1] : null;

if (!raceSlug) {
  console.error('[select-candidates] Usage: --race <slug>  e.g. --race bahrain-2026');
  process.exit(1);
}

// ── Race-specific curation context ─────────────────────────────────────────
interface RaceCurationContext {
  raceName: string;
  raceDate: string;
  location: string;
  sessionWindows: string;
  categoryTargets: string;
  featuredGuidance: string;
  rejectRules: string;
}

const RACE_CONTEXT: Record<string, RaceCurationContext> = {
  'bahrain-2026': {
    raceName: 'Bahrain Grand Prix 2026',
    raceDate: 'April 10–12 2026, Sakhir, Bahrain International Circuit',
    location: 'Manama & Sakhir, Bahrain (prices in USD)',
    sessionWindows: `
- fri-morning: 6 hours (08:00–14:00)
- fri-gap: 2 hours (15:30–17:30)
- fri-evening: 4 hours (19:00–23:00)
- sat-morning: 7 hours (08:00–15:00)
- sat-gap: 2 hours (16:30–18:30)
- sat-evening: 3 hours (20:00–23:00)
- sun-morning: 9 hours (08:00–17:00)
- sun-evening: 3 hours (20:00–23:00, post-race)`.trim(),
    categoryTargets: 'food: 8, culture: 8, daytrip: 8, adventure: 6, nightlife: 6 (total ~36)',
    featuredGuidance: `Pick 6–8 as is_featured: true. Best featured candidates for Bahrain:
- Desert safari at sunset (adventure, fits fri-evening or sat-evening)
- Dhow dinner cruise (daytrip/nightlife, fits fri-evening or sat-evening)
- Bahrain Fort / UNESCO heritage tour (culture, fits fri-morning or sat-morning)
- Manama souq food walk (food, fits any morning or evening)
- Pearl diving experience (culture/adventure, unique to Bahrain)
- Camel racing or camel riding (adventure, unique to Gulf)
- Rooftop bar experience in Adliya (nightlife, fits sat-evening or sun-evening)`,
    rejectRules: `Reject (set approved: false) for:
- Children's/family activity parks
- Tours primarily located in Dubai or Abu Dhabi (not Bahrain)
- Duration > 9 hours (won't fit any session window)
- Yoga, spa, wellness, or gym experiences
- Tours obviously aimed at non-F1 leisure tourists (water parks, theme parks)
- Generic "Gulf tours" with no Bahrain-specific content
- Rating < 4.0 or reviews < 20`,
  },
  'japan-2026': {
    raceName: 'Japanese Grand Prix 2026',
    raceDate: 'April 3–5 2026, Suzuka, Japan',
    location: 'Suzuka, Nagoya, Kyoto, Osaka area',
    sessionWindows: `
- fri-morning: 3.5 hours
- fri-gap: 2 hours
- fri-evening: 4 hours
- sat-morning: 3.5 hours
- sat-gap: 2 hours
- sat-evening: 4 hours
- sun-morning: 6 hours
- post-race: 3 hours`.trim(),
    categoryTargets: 'food: 8, culture: 8, daytrip: 8, adventure: 6, nightlife: 6 (total ~36)',
    featuredGuidance: 'Pick 6–8 as is_featured: true. Best: Kyoto geisha walk, Osaka food tour, sake tasting, samurai/ninja experience, Ise Grand Shrine, tea ceremony, bullet train day trip.',
    rejectRules: 'Reject: Tokyo-only tours, children\'s activities, duration > 8hrs unless it\'s a notable day trip, rating < 4.0 or reviews < 20.',
  },
  'shanghai-2026': {
    raceName: 'Chinese Grand Prix 2026',
    raceDate: 'March 20–22 2026, Shanghai',
    location: 'Shanghai, China',
    sessionWindows: `
- fri-morning: 3.5 hours
- fri-gap: 1.5 hours
- fri-evening: 4 hours
- sat-morning: 3.5 hours
- sat-gap: 1.5 hours
- sat-evening: 4 hours
- sun-morning: 6 hours
- post-race: 3 hours`.trim(),
    categoryTargets: 'food: 8, culture: 8, daytrip: 8, adventure: 6, nightlife: 6 (total ~36)',
    featuredGuidance: 'Pick 6–8 as is_featured: true. Best: French Concession food tour, Bund river cruise, acrobatics show, Zhujiajiao water town, Suzhou day trip.',
    rejectRules: 'Reject: Beijing-only tours, children\'s activities, duration > 10hrs, rating < 4.0 or reviews < 20.',
  },
};

// ── Candidate shape ─────────────────────────────────────────────────────────
interface Candidate {
  rank: number;
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
  score: number;
  // Review fields (written by this script)
  approved: boolean;
  override_category: string;
  is_featured: boolean;
  sort_order_override: number;
  notes: string;
}

interface ClaudeDecision {
  tour_id: number | string;
  approved: boolean;
  override_category: string;
  is_featured: boolean;
  sort_order: number;
  notes: string;
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const candidatesFile = path.join(OUTPUT_DIR, `${raceSlug}-candidates.json`);
  if (!fs.existsSync(candidatesFile)) {
    console.error(`[select-candidates] File not found: ${candidatesFile}`);
    console.error(`  Run: npx tsx --env-file=.env scripts/discover-gyg-tours.ts --race ${raceSlug}`);
    process.exit(1);
  }

  const candidates: Candidate[] = JSON.parse(fs.readFileSync(candidatesFile, 'utf-8'));
  console.log(`[select-candidates] Loaded ${candidates.length} candidates for ${raceSlug}`);

  const ctx = RACE_CONTEXT[raceSlug!];
  if (!ctx) {
    console.error(`[select-candidates] No curation context for race: ${raceSlug}`);
    console.error(`  Add an entry to RACE_CONTEXT for this race slug.`);
    process.exit(1);
  }

  // Build the candidate list for the prompt (compact format)
  const candidateList = candidates.map(c => ({
    tour_id: c.tour_id,
    title: c.title,
    abstract: c.abstract?.slice(0, 200),
    category: c.category_suggestion,
    rating: c.overall_rating,
    reviews: c.number_of_ratings,
    duration_hrs: c.duration_hours,
    price: `${c.price_local} ${c.currency}`,
    score: c.score,
    rank: c.rank,
  }));

  const systemPrompt = `You are a travel curation expert for F1 Weekend, an app that helps Formula 1 fans plan activities around race sessions. You select and rank the best local experiences for each race.

Return ONLY a valid JSON array. No markdown fences, no explanation, no extra text. Just the raw JSON array.`;

  const userPrompt = `Curate experiences for the ${ctx.raceName}.

RACE CONTEXT:
- Event: ${ctx.raceDate}
- Location: ${ctx.location}
- Session windows available:
${ctx.sessionWindows}

TARGET: Select 30–40 experiences with this category balance:
${ctx.categoryTargets}
- Minimum: rating ≥ 4.0, reviews ≥ 20 (prefer ≥ 4.5, ≥ 50)

FEATURED PICKS (6–8 max):
${ctx.featuredGuidance}

REJECTION RULES:
${ctx.rejectRules}

CANDIDATES (${candidates.length} total, ranked by score):
${JSON.stringify(candidateList, null, 2)}

Return a JSON array with one object per candidate:
[
  {
    "tour_id": <number or string — must exactly match input>,
    "approved": <true|false>,
    "override_category": "<food|culture|adventure|daytrip|nightlife or empty string to keep suggestion>",
    "is_featured": <true|false — only true for 6-8 picks>,
    "sort_order": <1-40 for approved items, 0 for rejected>,
    "notes": "<brief reason for decision, 1 sentence>"
  },
  ...
]

Rules:
- Include ALL ${candidates.length} candidates in the response (approved or rejected)
- sort_order 1 = best/first shown; assign sequentially across approved items
- featured items should have sort_order 1–8
- override_category: only set if the category_suggestion is clearly wrong`;

  console.log(`[select-candidates] Sending ${candidates.length} candidates to LLM (LLM_PROVIDER=${process.env.LLM_PROVIDER ?? 'ollama'})...`);

  const rawText = await generateText(systemPrompt, userPrompt);

  console.log(`[select-candidates] Claude responded (${rawText.length} chars)`);

  // Parse response — strip any accidental markdown fences
  const jsonText = rawText.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim();
  let decisions: ClaudeDecision[];
  try {
    decisions = JSON.parse(jsonText);
  } catch (err) {
    console.error('[select-candidates] Failed to parse Claude response as JSON:');
    console.error(rawText.slice(0, 500));
    throw err;
  }

  if (!Array.isArray(decisions)) {
    console.error('[select-candidates] Response is not an array:', typeof decisions);
    process.exit(1);
  }

  console.log(`[select-candidates] Received ${decisions.length} decisions`);

  // Build decision lookup by tour_id
  const decisionMap = new Map<string, ClaudeDecision>();
  for (const d of decisions) {
    decisionMap.set(String(d.tour_id), d);
  }

  // Merge decisions back into candidates
  let approvedCount = 0;
  let featuredCount = 0;
  const merged: Candidate[] = candidates.map(c => {
    const d = decisionMap.get(String(c.tour_id));
    if (!d) {
      console.warn(`  [warn] No decision for tour_id ${c.tour_id} — keeping as rejected`);
      return c;
    }
    if (d.approved) approvedCount++;
    if (d.approved && d.is_featured) featuredCount++;
    return {
      ...c,
      approved: d.approved,
      override_category: d.override_category ?? '',
      is_featured: d.approved ? (d.is_featured ?? false) : false,
      sort_order_override: d.sort_order ?? 0,
      notes: d.notes ?? '',
    };
  });

  // Write back
  fs.writeFileSync(candidatesFile, JSON.stringify(merged, null, 2));
  console.log(`\n[select-candidates] Done.`);
  console.log(`  Approved: ${approvedCount} / ${candidates.length}`);
  console.log(`  Featured: ${featuredCount}`);
  console.log(`  Output:   ${candidatesFile}`);

  // Category breakdown of approved
  const byCat: Record<string, number> = {};
  for (const c of merged.filter(c => c.approved)) {
    const cat = c.override_category || c.category_suggestion;
    byCat[cat] = (byCat[cat] ?? 0) + 1;
  }
  console.log('\nCategory breakdown (approved):');
  for (const [cat, count] of Object.entries(byCat)) {
    console.log(`  ${cat.padEnd(12)} ${count}`);
  }

  console.log(`\nNext: npx tsx --env-file=.env scripts/seed-from-candidates.ts --race ${raceSlug}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
