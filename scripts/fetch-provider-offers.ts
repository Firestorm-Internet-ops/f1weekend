/**
 * Multi-provider pilot: finds Viator and Tiqets products for one race, matches
 * them to the race's existing experiences, and writes a report. With --apply
 * it saves the automatic matches (and any --approve'd ones) to experience_offers.
 *
 * Read-only unless --apply is given. Needs VIATOR_API_KEY / TIQETS_API_KEY.
 *
 *   npm run offers:fetch -- --race monaco-2026
 *   npm run offers:fetch -- --race monaco-2026 --from-site https://staging.f1weekend.co
 *   npm run offers:fetch -- --race monaco-2026 --experiences-file exps.json
 *   npm run offers:fetch -- --race monaco-2026 --apply [--approve viator:197141P1,tiqets:1014117]
 *
 * Experiences come from the database by default. --from-site reads them from
 * the site's public /api/experiences instead; --experiences-file from that
 * API's saved JSON. Race city and circuit come from pipeline/races/<race>.toml.
 *
 * Output: scripts/output/offers-<race>.json and .html
 * --apply needs scripts/migrate-add-experience-offers.ts to have run first.
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { SEARCH_ADAPTERS, PROVIDER_NAMES, type NormalizedOffer, type ProviderId } from '../src/lib/providers';
import { matchOffers, MATCH_THRESHOLDS, type MatchResult, type MatchTarget } from '../src/lib/providers/match';

const OUT_DIR = path.join(__dirname, 'output');

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

interface RaceInfo { slug: string; city: string; country: string; lat: number; lng: number }

function readRaceToml(slug: string): RaceInfo {
  const file = path.join(__dirname, '..', 'pipeline', 'races', `${slug}.toml`);
  if (!fs.existsSync(file)) throw new Error(`No race config at ${file}`);
  const toml = fs.readFileSync(file, 'utf8');
  const get = (k: string) => toml.match(new RegExp(`^${k}\\s*=\\s*"?([^"\\n]+)"?`, 'm'))?.[1]?.trim();
  const lat = Number(get('circuit_lat'));
  const lng = Number(get('circuit_lng'));
  if (!get('city') || !Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error(`${file} is missing city or circuit coordinates`);
  return { slug, city: get('city')!, country: get('country') ?? '', lat, lng };
}

interface ExperienceLite extends MatchTarget { slug: string; priceAmount: number | null; priceCurrency: string | null; rating: number | null; reviewCount: number }

const num = (v: unknown): number | null => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromApiRow(e: any): ExperienceLite {
  return {
    id: e.id, slug: e.slug, title: e.title,
    durationHours: num(e.durationHours), lat: num(e.lat), lng: num(e.lng),
    priceAmount: num(e.priceAmount), priceCurrency: e.priceCurrency ?? null, rating: num(e.rating), reviewCount: e.reviewCount ?? 0,
  };
}

async function loadExperiences(raceSlug: string): Promise<ExperienceLite[]> {
  const file = arg('experiences-file');
  if (file) {
    const j = JSON.parse(fs.readFileSync(file, 'utf8'));
    return (Array.isArray(j) ? j : j.data).map(fromApiRow);
  }
  const site = arg('from-site');
  if (site) {
    const res = await fetch(`${site.replace(/\/$/, '')}/api/experiences?race=${encodeURIComponent(raceSlug)}`);
    if (!res.ok) throw new Error(`${site}/api/experiences → HTTP ${res.status}`);
    return ((await res.json()).data as unknown[]).map(fromApiRow);
  }
  const { getDb } = await import('../src/lib/db');
  const { races, experiences } = await import('../src/lib/db/schema');
  const { and, eq } = await import('drizzle-orm');
  const db = await getDb();
  const [race] = await db.select().from(races).where(eq(races.slug, raceSlug)).limit(1);
  if (!race) throw new Error(`No race "${raceSlug}" in the database`);
  const rows = await db.select().from(experiences).where(and(eq(experiences.race_id, race.id), eq(experiences.is_active, true)));
  return rows.map((r) => ({
    id: r.id, slug: r.slug ?? '', title: r.title ?? '',
    durationHours: num(r.duration_hours), lat: num(r.lat), lng: num(r.lng),
    priceAmount: num(r.price_amount), priceCurrency: r.price_currency, rating: num(r.rating), reviewCount: r.review_count ?? 0,
  }));
}

async function fetchOffers(race: RaceInfo): Promise<NormalizedOffer[]> {
  const all: NormalizedOffer[] = [];
  for (const adapter of Object.values(SEARCH_ADAPTERS)) {
    if (!adapter) continue;
    if (!adapter.isConfigured()) {
      console.warn(`[offers] ${PROVIDER_NAMES[adapter.id]}: no API key set, skipped`);
      continue;
    }
    const found = await adapter.search({ city: race.city, lat: race.lat, lng: race.lng, radiusKm: 15, currency: 'EUR' });
    console.log(`[offers] ${PROVIDER_NAMES[adapter.id]}: ${found.length} products`);
    all.push(...found);
  }
  return all;
}

// ── Report ─────────────────────────────────────────────────────────────────

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const money = (a: number | null, c: string | null) => (a == null ? '—' : `${c ?? ''} ${a.toFixed(2)}`);
const F1_WORDS = /\b(f1|formula|grand prix|circuit|race|racing|pit|paddock|ferrari|supercar|karting)\b/i;

function renderHtml(race: RaceInfo, results: MatchResult[], exps: ExperienceLite[]): string {
  const byDecision = (d: MatchResult['decision']) => results.filter((r) => r.decision === d).sort((a, b) => b.score - a.score);
  const auto = byDecision('auto');
  const review = byDecision('review');
  const none = byDecision('none').sort((a, b) =>
    Number(F1_WORDS.test(b.offer.title)) - Number(F1_WORDS.test(a.offer.title)) || b.offer.reviewCount - a.offer.reviewCount);
  const expById = new Map(exps.map((e) => [e.id, e]));
  const covered = new Set(auto.map((r) => r.target!.id));

  const matchRows = (rows: MatchResult[]) => rows.map((r) => {
    const e = r.target ? expById.get(r.target.id) : undefined;
    return `<tr><td>${r.score.toFixed(2)}</td><td>${PROVIDER_NAMES[r.offer.provider]}<br><code>${esc(r.offer.productId)}</code></td>
      <td><a href="${esc(r.offer.url)}">${esc(r.offer.title)}</a><br><span class="m">${money(r.offer.priceAmount, r.offer.priceCurrency)} · ★ ${r.offer.rating ?? '—'} (${r.offer.reviewCount})</span></td>
      <td>${e ? `${esc(e.title)}<br><span class="m">#${e.id} · ${money(e.priceAmount, e.priceCurrency)} · ★ ${e.rating ?? '—'} (${e.reviewCount})</span>` : '—'}</td>
      <td class="m">title ${r.parts.title.toFixed(2)}${r.parts.duration != null ? ` · dur ${r.parts.duration.toFixed(2)}` : ''}${r.parts.distance != null ? ` · dist ${r.parts.distance.toFixed(2)}` : ''}</td></tr>`;
  }).join('');
  const table = (rows: MatchResult[]) => rows.length
    ? `<div class="scroll"><table><tr><th>Score</th><th>Provider</th><th>Offer</th><th>Best experience</th><th>Why</th></tr>${matchRows(rows)}</table></div>`
    : '<p class="m">None.</p>';

  const providers = [...new Set(results.map((r) => r.offer.provider))] as ProviderId[];
  const counts = providers.map((p) => {
    const rs = results.filter((r) => r.offer.provider === p);
    return `<tr><td>${PROVIDER_NAMES[p]}</td><td>${rs.length}</td><td>${rs.filter((r) => r.decision === 'auto').length}</td><td>${rs.filter((r) => r.decision === 'review').length}</td></tr>`;
  }).join('');

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(race.city)} Offers Pilot</title><style>
:root{--bg:#fafaf9;--card:#fff;--text:#1c1917;--muted:#6b6560;--border:#e7e5e4;--accent:#e10600}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#0c0a09;--card:#1c1917;--text:#f5f5f4;--muted:#a8a29e;--border:#2e2a27;--accent:#ff3b30}}
:root[data-theme="dark"]{--bg:#0c0a09;--card:#1c1917;--text:#f5f5f4;--muted:#a8a29e;--border:#2e2a27;--accent:#ff3b30}
body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 system-ui,sans-serif}main{max-width:1100px;margin:0 auto;padding:32px 16px 64px}
h1{margin:0 0 4px}h2{margin:32px 0 8px}.m{color:var(--muted);font-size:.85em}a{color:var(--accent)}code{font-size:.85em}
.scroll{overflow-x:auto}table{border-collapse:collapse;width:100%;background:var(--card)}th,td{text-align:left;padding:6px 8px;border-bottom:1px solid var(--border);vertical-align:top}
</style></head><body><main>
<h1>${esc(race.city)}: other booking sites</h1>
<p class="m">${esc(race.slug)} · generated ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC · ${exps.length} existing experiences · auto-match ≥ ${MATCH_THRESHOLDS.AUTO}, review ≥ ${MATCH_THRESHOLDS.REVIEW}</p>
<table style="max-width:480px"><tr><th>Provider</th><th>Products</th><th>Auto</th><th>Review</th></tr>${counts}</table>
<p>${covered.size} of ${exps.length} experiences get at least one extra booking site from automatic matches.</p>
<h2>Automatic matches (${auto.length})</h2><p class="m">Saved as offers with <code>--apply</code>.</p>${table(auto)}
<h2>Needs a decision (${review.length})</h2><p class="m">Approve with <code>--approve provider:productId,…</code> together with <code>--apply</code>.</p>${table(review)}
<h2>Not on the site yet (${none.length})</h2><p class="m">F1-related titles first, then most reviewed. Candidates for new experiences; nothing is created automatically.</p>${table(none.slice(0, 60))}
</main></body></html>`;
}

// ── Apply ──────────────────────────────────────────────────────────────────

async function applyMatches(results: MatchResult[], approved: Set<string>) {
  const { getDb } = await import('../src/lib/db');
  const { experience_offers } = await import('../src/lib/db/schema');
  const { sql } = await import('drizzle-orm');
  const db = await getDb();
  const chosen = results.filter((r) => r.target && (r.decision === 'auto' || approved.has(`${r.offer.provider}:${r.offer.productId}`)));
  for (const r of chosen) {
    const o = r.offer;
    const values = {
      experience_id: r.target!.id,
      provider: o.provider,
      product_id: o.productId,
      title: o.title.slice(0, 255),
      url: o.url.slice(0, 1000),
      price_amount: o.priceAmount?.toFixed(2) ?? null,
      price_currency: o.priceCurrency,
      original_price: o.originalPrice?.toFixed(2) ?? null,
      rating: o.rating?.toFixed(1) ?? null,
      review_count: o.reviewCount,
      duration_hours: o.durationHours?.toFixed(1) ?? null,
      flags: o.flags,
      provider_categories: o.categories,
      raw_snapshot: o.raw,
      match_score: r.score.toFixed(3),
      is_primary: false,
      is_active: true,
    };
    await db.insert(experience_offers).values(values).onDuplicateKeyUpdate({
      set: { ...values, last_synced_at: sql`CURRENT_TIMESTAMP` },
    });
  }
  console.log(`[offers] Saved ${chosen.length} offers (${chosen.filter((r) => r.decision !== 'auto').length} approved by hand)`);
}

async function main() {
  const raceSlug = arg('race');
  if (!raceSlug) {
    console.error('Usage: npm run offers:fetch -- --race <slug> [--from-site URL | --experiences-file FILE] [--apply] [--approve provider:id,...]');
    process.exit(1);
  }
  const race = readRaceToml(raceSlug);
  const [exps, offers] = await Promise.all([loadExperiences(raceSlug), fetchOffers(race)]);
  console.log(`[offers] ${exps.length} existing experiences for ${raceSlug}`);

  // City/country names appear in almost every title and would inflate similarity.
  const placeWords = [race.city, race.country, 'monte carlo', 'riviera', 'french'];
  const results = matchOffers(offers, exps, placeWords);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const base = path.join(OUT_DIR, `offers-${raceSlug}`);
  fs.writeFileSync(`${base}.json`, JSON.stringify(results.map((r) => ({
    decision: r.decision, score: r.score, parts: r.parts,
    experience: r.target ? { id: r.target.id, title: r.target.title } : null,
    offer: { ...r.offer, raw: undefined },
  })), null, 2));
  fs.writeFileSync(`${base}.html`, renderHtml(race, results, exps));

  console.table(['auto', 'review', 'none'].map((d) => ({ decision: d, offers: results.filter((r) => r.decision === d).length })));
  console.log(`[offers] Report: ${base}.html`);

  if (process.argv.includes('--apply')) {
    const approved = new Set((arg('approve') ?? '').split(',').map((s) => s.trim()).filter(Boolean));
    await applyMatches(results, approved);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('[offers] Failed:', err);
  process.exit(1);
});
