/**
 * READ-ONLY audit: how many experiences per race are near / city / day trip /
 * too far / missing a location, using the rules in src/lib/nearby.ts.
 * Nothing is written to the database. Same report as the preview-only
 * page /api/nearby-audit (see src/lib/nearby-audit.ts).
 *
 * Run (reads DB settings from the environment, or from .env if present):
 *   npm run audit:nearby
 *   npm run audit:nearby -- --race monaco-2026
 *
 * Output:
 *   console summary
 *   scripts/output/nearby-audit.html   (open in a browser)
 *   scripts/output/nearby-audit.csv    (every experience, for spreadsheets)
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { runNearbyAudit, renderAuditCsv, renderAuditHtml } from '../src/lib/nearby-audit';

const OUT_DIR = path.join(__dirname, 'output');

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

async function main() {
  const onlyRace = arg('race');
  const result = await runNearbyAudit(onlyRace);
  if (result.summary.length === 0) {
    console.error(onlyRace ? `No race with slug "${onlyRace}"` : 'No races found');
    process.exit(1);
  }

  console.log('\nNearby audit (read-only)\n');
  console.table(
    result.summary.map((s) => ({
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

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'nearby-audit.csv'), renderAuditCsv(result));
  fs.writeFileSync(path.join(OUT_DIR, 'nearby-audit.html'), renderAuditHtml(result));

  console.log(`\nReport: ${path.join(OUT_DIR, 'nearby-audit.html')}`);
  console.log(`CSV:    ${path.join(OUT_DIR, 'nearby-audit.csv')}\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
