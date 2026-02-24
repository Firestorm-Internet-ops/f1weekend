#!/usr/bin/env tsx
// Fetches OG images from running dev server and saves PNGs to public/og/
// Usage: npm run dev (in one terminal), then npx tsx scripts/generate-og-images.ts

import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

const BASE_URL = 'http://localhost:3000';
const OUT_DIR = join(process.cwd(), 'public', 'og');

const pages = [
  { url: `${BASE_URL}/opengraph-image`, out: join(OUT_DIR, 'home.png') },
  { url: `${BASE_URL}/experiences/opengraph-image`, out: join(OUT_DIR, 'experiences.png') },
  { url: `${BASE_URL}/schedule/opengraph-image`, out: join(OUT_DIR, 'schedule.png') },
  { url: `${BASE_URL}/getting-there/opengraph-image`, out: join(OUT_DIR, 'getting-there.png') },
  { url: `${BASE_URL}/about/opengraph-image`, out: join(OUT_DIR, 'about.png') },
  { url: `${BASE_URL}/contact/opengraph-image`, out: join(OUT_DIR, 'contact.png') },
  { url: `${BASE_URL}/experiences/map/opengraph-image`, out: join(OUT_DIR, 'experiences-map.png') },
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`Output directory: ${OUT_DIR}\n`);

  for (const page of pages) {
    const name = page.out.split('/').pop()!;
    process.stdout.write(`Fetching ${name}... `);
    try {
      const res = await fetch(page.url);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const buf = Buffer.from(await res.arrayBuffer());
      await writeFile(page.out, buf);
      console.log(`✓ (${(buf.length / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.log(`✗ ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log('\nDone. Files written to public/og/');
}

main();
