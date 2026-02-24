/**
 * F1 SEO Agent: enriches all 35 experiences with AI-generated F1-focused content.
 * Uses the project's LLM abstraction (Ollama locally, Anthropic in production).
 *
 * Writes to four fields per experience:
 *   abstract         — F1-focused meta description (140–160 chars)
 *   f1_context       — F1 editorial paragraph (80–120 words)
 *   seo_keywords     — 6–8 long-tail keywords (JSON array)
 *   f1_windows_label — human-readable F1 schedule string
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/enrich-seo-content.ts
 *   npx tsx --env-file=.env scripts/enrich-seo-content.ts --force
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';
import { generateText } from '@/lib/llm';

const DB_HOST = process.env.DATABASE_HOST ?? 'localhost';
const DB_PORT = Number(process.env.DATABASE_PORT) || 3306;
const DB_USER = process.env.DATABASE_USER ?? 'root';
const DB_PASS = process.env.DATABASE_PASSWORD ?? '';
const DB_NAME = process.env.DATABASE_NAME ?? 'pitlane';

const FORCE = process.argv.includes('--force');

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Window slug → human-readable label
const WINDOW_LABEL_MAP: Record<string, string> = {
  'thu-full':    'Thursday — Full Day',
  'fri-morning': 'Friday Morning (before FP1)',
  'fri-gap':     'Friday Afternoon (between sessions)',
  'fri-evening': 'Friday Evening (after FP2)',
  'sat-morning': 'Saturday Morning (before FP3)',
  'sat-evening': 'Saturday Evening (after Qualifying)',
  'sun-morning': 'Sunday Morning (Race Day Build-Up)',
  'sun-evening': 'Sunday Evening (Post-Race Celebration)',
};

interface ExperienceRow {
  id: number;
  title: string;
  slug: string;
  category: string;
  short_description: string | null;
  description: string | null;
  price_label: string | null;
  duration_label: string | null;
  duration_hours: number;
  highlights: string | null;
  includes: string | null;
  gyg_categories: string | null;
  rating: number;
  review_count: number;
}

interface WindowRow {
  slug: string;
  label: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

interface EnrichedContent {
  abstract: string;
  f1_context: string;
  seo_keywords: string[];
  f1_windows_label: string;
}

const SYSTEM_PROMPT = `You are an SEO specialist for Pitlane, an F1 travel companion app for the 2026 Australian Grand Prix (Melbourne, Albert Park, 5–8 March 2026). Race schedule: Thu free practice, Fri practice (FP1 + FP2), Sat qualifying, Sun race. Audience: F1 fans planning activities around race sessions. Return ONLY valid JSON, no markdown fences.`;

function buildUserPrompt(exp: ExperienceRow, windowLabels: string[]): string {
  const highlights: string[] = exp.highlights ? JSON.parse(exp.highlights) : [];
  const includes: string[] = exp.includes ? JSON.parse(exp.includes) : [];
  const gygCategories: string[] = exp.gyg_categories ? JSON.parse(exp.gyg_categories) : [];

  return `Write SEO content for this Melbourne experience. Return ONLY a JSON object with no extra text.

Title: ${exp.title}
Category: ${exp.category}
Price: ${exp.price_label ?? 'N/A'} | Duration: ${exp.duration_label ?? 'N/A'}
Rating: ${exp.rating} (${exp.review_count} reviews)
Short description: ${exp.short_description ?? ''}
Highlights: ${highlights.slice(0, 5).join(' | ')}
Includes: ${includes.slice(0, 5).join(', ')}
GYG Categories: ${gygCategories.join(', ')}
Available F1 windows: ${windowLabels.length > 0 ? windowLabels.join(' · ') : 'All days'}

Return this JSON structure (fill in the values):
{
  "abstract": "140-160 char F1-focused meta description with price and race-weekend angle",
  "f1_context": "80-120 word paragraph for F1 fans explaining why this fits the 2026 Australian GP, written in second person",
  "seo_keywords": ["6 to 8 long-tail keywords combining activity + Melbourne + F1/race weekend"],
  "f1_windows_label": "compact schedule like 'Thu pre-race · Fri morning & evening · Sat & Sun evenings'"
}`;
}

async function generateContent(
  exp: ExperienceRow,
  windowLabels: string[],
): Promise<EnrichedContent | null> {
  let raw: string;
  try {
    raw = await generateText(SYSTEM_PROMPT, buildUserPrompt(exp, windowLabels));
  } catch (err) {
    console.error(`  [seo-enrich] LLM error:`, err);
    return null;
  }

  try {
    // Strip any markdown fences the model might add
    const clean = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    // Find the first { ... } block in case the model adds preamble text
    const jsonStart = clean.indexOf('{');
    const jsonEnd = clean.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('No JSON object found in response');
    }
    return JSON.parse(clean.slice(jsonStart, jsonEnd + 1)) as EnrichedContent;
  } catch (err) {
    console.warn(`  [seo-enrich] JSON parse failed for "${exp.title}": ${err}`);
    console.warn(`  Raw (first 300 chars): ${raw.slice(0, 300)}`);
    return null;
  }
}

async function main() {
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
  });

  const provider = process.env.LLM_PROVIDER ?? 'ollama';
  const model = provider === 'ollama'
    ? (process.env.OLLAMA_MODEL ?? 'tinyllama')
    : 'claude-sonnet-4-6';

  console.log(`[seo-enrich] Connected to ${DB_HOST}:${DB_PORT}/${DB_NAME}`);
  console.log(`[seo-enrich] LLM: ${provider} / ${model}`);
  console.log(`[seo-enrich] Mode: ${FORCE ? 'FORCE (re-process all)' : 'idempotent (skip if f1_context IS NOT NULL)'}`);

  const whereClause = FORCE
    ? `WHERE e.race_id = (SELECT id FROM races WHERE slug = 'melbourne-2026')`
    : `WHERE e.race_id = (SELECT id FROM races WHERE slug = 'melbourne-2026') AND e.f1_context IS NULL`;

  const [rows] = await conn.execute<mysql.RowDataPacket[]>(
    `SELECT e.id, e.title, e.slug, e.category,
            e.short_description, e.description,
            e.price_label, e.duration_label, e.duration_hours,
            e.highlights, e.includes, e.gyg_categories, e.rating, e.review_count
     FROM experiences e
     ${whereClause}
     ORDER BY e.sort_order`,
  );

  const experiences = rows as ExperienceRow[];
  console.log(`[seo-enrich] Found ${experiences.length} experiences to process\n`);

  if (experiences.length === 0) {
    console.log('[seo-enrich] Nothing to do. Use --force to re-run all.');
    await conn.end();
    return;
  }

  let processed = 0;
  let errors = 0;

  for (let i = 0; i < experiences.length; i++) {
    const exp = experiences[i];
    const prefix = `[${i + 1}/${experiences.length}]`;
    console.log(`${prefix} ${exp.title}`);

    // Fetch which F1 windows this experience is available in
    const [windowRows] = await conn.execute<mysql.RowDataPacket[]>(
      `SELECT ew.slug, ew.label, ew.day_of_week, ew.start_time, ew.end_time
       FROM experience_windows ew
       JOIN experience_windows_map ewm ON ew.id = ewm.window_id
       WHERE ewm.experience_id = ?
       ORDER BY ew.sort_order`,
      [exp.id],
    );
    const windows = windowRows as WindowRow[];
    const windowLabels = windows.map((w) => WINDOW_LABEL_MAP[w.slug] ?? w.label ?? w.slug);

    // Generate enriched content via LLM
    const content = await generateContent(exp, windowLabels);

    if (!content) {
      errors++;
      console.log(`  ✗ Skipping — generation failed\n`);
      await delay(500);
      continue;
    }

    // Warn if abstract drifts outside target range
    const abstractLen = content.abstract?.length ?? 0;
    if (abstractLen < 120 || abstractLen > 185) {
      console.warn(`  ⚠ abstract length ${abstractLen} chars (target 140–160)`);
    }

    await conn.execute(
      `UPDATE experiences
       SET abstract = ?, f1_context = ?, seo_keywords = ?, f1_windows_label = ?
       WHERE id = ?`,
      [
        content.abstract,
        content.f1_context,
        JSON.stringify(content.seo_keywords),
        content.f1_windows_label,
        exp.id,
      ],
    );

    processed++;
    console.log(
      `  ✓ abstract:${abstractLen}ch | f1_context:${content.f1_context?.length ?? 0}ch` +
      ` | keywords:${content.seo_keywords?.length ?? 0} | label:"${content.f1_windows_label}"\n`,
    );

    await delay(500);
  }

  await conn.end();
  console.log(`[seo-enrich] Done — processed:${processed} errors:${errors}`);
}

main().catch((err) => {
  console.error('[seo-enrich] Fatal:', err);
  process.exit(1);
});
