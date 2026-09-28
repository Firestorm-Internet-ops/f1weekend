/**
 * READ-ONLY audit: how many experiences per race are near / city / day trip /
 * too far / missing a location, using the rules in src/lib/nearby.ts.
 * Nothing is written to the database.
 *
 * Run:
 *   npx tsx --env-file=.env scripts/audit-nearby.ts
 *   npx tsx --env-file=.env scripts/audit-nearby.ts --race monaco-2026
 *
 * Output:
 *   console summary
 *   scripts/output/nearby-audit.html   (open in a browser)
 *   scripts/output/nearby-audit.csv    (every experience, for spreadsheets)
 */
import fs from 'node:fs';
import path from 'node:path';
import { and, eq } from 'drizzle-orm';
import { getDb } from '../src/lib/db';
import { races, experiences } from '../src/lib/db/schema';
import { applyNearbyRules, isNightRace, nearbyLabel, type NearbyTier } from '../src/lib/nearby';

const OUT_DIR = path.join(__dirname, 'output');
const TIERS: NearbyTier[] = ['near', 'city', 'daytrip', 'too-far', 'unknown'];

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

const num = (v: unknown): number | undefined => {
  if (v === null || v === undefined || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

const csvCell = (s: unknown) => `"${String(s ?? '').replace(/"/g, '""')}"`;

interface Row {
  race: string;
  id: number;
  title: string;
  slug: string;
  category: string;
  tier: NearbyTier;
  shown: boolean;
  distanceKm: number | null;
  travelMins: number | null;
  from: string | null;
  label: string | null;
}

async function main() {
  const onlyRace = arg('race');
  const db = await getDb();

  const raceRows = (await db.select().from(races)).filter((r) => !onlyRace || r.slug === onlyRace);
  if (raceRows.length === 0) {
    console.error(onlyRace ? `No race with slug "${onlyRace}"` : 'No races found');
    process.exit(1);
  }

  const all: Row[] = [];
  const summary: { race: string; name: string; night: boolean; noCircuit: boolean; counts: Record<string, number>; shown: number; total: number }[] = [];

  for (const race of raceRows.sort((a, b) => (a.round ?? 99) - (b.round ?? 99))) {
    const slug = race.slug ?? '';
    const lat = num(race.circuit_lat);
    const lng = num(race.circuit_lng);
    const circuit = lat !== undefined && lng !== undefined ? { lat, lng } : null;

    const exps = await db
      .select()
      .from(experiences)
      .where(and(eq(experiences.race_id, race.id), eq(experiences.is_active, true)));

    // Same priority the site uses for "popular": featured first, then most reviewed.
    exps.sort(
      (a, b) =>
        Number(b.is_featured ?? false) - Number(a.is_featured ?? false) ||
        (b.review_count ?? 0) - (a.review_count ?? 0)
    );

    const items = exps.map((e) => ({ exp: e, lat: num(e.lat), lng: num(e.lng) }));
    const { visible, hidden } = applyNearbyRules(items, slug, circuit);

    const counts: Record<string, number> = Object.fromEntries(TIERS.map((t) => [t, 0]));
    const push = (c: (typeof visible)[number], shown: boolean) => {
      counts[c.nearby.tier]++;
      all.push({
        race: slug,
        id: c.item.exp.id,
        title: c.item.exp.title ?? '',
        slug: c.item.exp.slug ?? '',
        category: c.item.exp.category ?? '',
        tier: c.nearby.tier,
        shown,
        distanceKm: c.nearby.distanceKm,
        travelMins: c.nearby.travelMins,
        from: c.nearby.from,
        label: nearbyLabel(c.nearby),
      });
    };
    visible.forEach((c) => push(c, true));
    hidden.forEach((c) => push(c, false));

    summary.push({
      race: slug,
      name: race.name ?? slug,
      night: isNightRace(slug),
      noCircuit: !circuit,
      counts,
      shown: visible.length,
      total: exps.length,
    });
  }

  // ── Console ──────────────────────────────────────────────────────────
  console.log('\nNearby audit (read-only)\n');
  console.table(
    summary.map((s) => ({
      race: s.race,
      total: s.total,
      near: s.counts.near,
      city: s.counts.city,
      daytrip: s.counts.daytrip,
      'too-far': s.counts['too-far'],
      'no location': s.counts.unknown,
      'would show': s.shown,
      'would hide': s.total - s.shown,
    }))
  );

  // ── Files ────────────────────────────────────────────────────────────
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const csvHeader = ['race', 'id', 'title', 'slug', 'category', 'tier', 'shown', 'distance_km', 'travel_mins', 'from', 'label'];
  const csv = [
    csvHeader.join(','),
    ...all.map((r) =>
      [r.race, r.id, r.title, r.slug, r.category, r.tier, r.shown ? 'yes' : 'no', r.distanceKm ?? '', r.travelMins ?? '', r.from ?? '', r.label ?? '']
        .map(csvCell)
        .join(',')
    ),
  ].join('\n');
  fs.writeFileSync(path.join(OUT_DIR, 'nearby-audit.csv'), csv);

  const totals = summary.reduce(
    (t, s) => ({ total: t.total + s.total, shown: t.shown + s.shown }),
    { total: 0, shown: 0 }
  );

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Nearby Audit</title>
<style>
  :root{--bg:#fafaf9;--card:#fff;--text:#1c1917;--muted:#6b6560;--border:#e7e5e4;--bad:#b91c1c;--warn:#b45309}
  @media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#0c0a09;--card:#1c1917;--text:#f5f5f4;--muted:#a8a29e;--border:#2e2a27;--bad:#f87171;--warn:#fbbf24}}
  body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
  main{max-width:1000px;margin:0 auto;padding:32px 16px 64px}
  h1{font-size:1.6rem;margin:0 0 4px} h2{font-size:1.15rem;margin:32px 0 8px}
  .muted{color:var(--muted)} .wrap{overflow-x:auto}
  table{width:100%;border-collapse:collapse;background:var(--card);font-size:.9rem}
  th,td{text-align:left;padding:6px 8px;border-bottom:1px solid var(--border);vertical-align:top}
  td.n{text-align:right} .bad{color:var(--bad);font-weight:600} .warn{color:var(--warn);font-weight:600}
</style></head><body><main>
<h1>Nearby audit</h1>
<p class="muted">Generated ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC · read-only · ${totals.total} active experiences, ${totals.shown} would show, ${totals.total - totals.shown} would be hidden.</p>
<p class="muted">Near ≤ 30 min from circuit · City ≤ 60 min (race-day traffic ×1.5) · Day trip ≤ 2 h, max 3 per race · "No location" = missing coordinates (kept, needs fixing).</p>

<h2>Summary per race</h2>
<div class="wrap"><table>
<tr><th>Race</th><th>Total</th><th>Near</th><th>City</th><th>Day trip</th><th>Too far</th><th>No location</th><th>Would show</th><th>Would hide</th></tr>
${summary
  .map(
    (s) => `<tr><td>${esc(s.name)}${s.night ? ' 🌙' : ''}${s.noCircuit ? ' <span class="warn">(no circuit coords)</span>' : ''}</td><td class="n">${s.total}</td><td class="n">${s.counts.near}</td><td class="n">${s.counts.city}</td><td class="n">${s.counts.daytrip}</td><td class="n${s.counts['too-far'] ? ' bad' : ''}">${s.counts['too-far']}</td><td class="n${s.counts.unknown ? ' warn' : ''}">${s.counts.unknown}</td><td class="n">${s.shown}</td><td class="n">${s.total - s.shown}</td></tr>`
  )
  .join('\n')}
</table></div>

<h2>Would be hidden</h2>
<div class="wrap"><table>
<tr><th>Race</th><th>Experience</th><th>Why</th><th>Distance</th><th>Travel</th></tr>
${all
  .filter((r) => !r.shown)
  .map(
    (r) => `<tr><td>${esc(r.race)}</td><td>${esc(r.title)}</td><td>${r.tier === 'too-far' ? 'Too far' : 'Extra day trip (over 3)'}</td><td class="n">${r.distanceKm ?? ''} km from ${esc(r.from)}</td><td class="n">${r.travelMins ?? ''} min</td></tr>`
  )
  .join('\n') || '<tr><td colspan="5">Nothing</td></tr>'}
</table></div>

<h2>Missing location (kept for now)</h2>
<div class="wrap"><table>
<tr><th>Race</th><th>Experience</th><th>ID</th></tr>
${all
  .filter((r) => r.tier === 'unknown')
  .map((r) => `<tr><td>${esc(r.race)}</td><td>${esc(r.title)}</td><td class="n">${r.id}</td></tr>`)
  .join('\n') || '<tr><td colspan="3">Nothing</td></tr>'}
</table></div>
</main></body></html>`;
  fs.writeFileSync(path.join(OUT_DIR, 'nearby-audit.html'), html);

  console.log(`\nReport: ${path.join(OUT_DIR, 'nearby-audit.html')}`);
  console.log(`CSV:    ${path.join(OUT_DIR, 'nearby-audit.csv')}\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
