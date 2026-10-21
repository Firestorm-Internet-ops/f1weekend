/**
 * End to end on real data: the Search Console export for f1weekend.co,
 * 20 Jul – 19 Oct 2026 (112 query/page rows, 0 clicks), pulled with the
 * ga4-reader service account on 21 Oct 2026.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { bookingClicksByPath, runLoop } from '../../src/lib/seo-loop/run';
import type { ClickRow } from '../../src/lib/click-stats';
import type { GscRow } from '../../src/lib/seo-loop/rows';

const gscRows: GscRow[] = JSON.parse(readFileSync('tests/fixtures/gsc-2026-07-20_2026-10-19.json', 'utf8')).rows;
const now = new Date('2026-10-21T00:00:00Z');
const raceDates = { belgium: '2026-07-26', canada: '2026-05-24', bahrain: '2026-04-12', singapore: '2026-10-11', 'las-vegas': '2026-11-21' };

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/129 Safari/537.36';
const click = (over: Partial<ClickRow>): ClickRow => ({
  clickedAt: now, partner: 'getyourguide', source: 'feed', sessionId: 's1', userAgent: UA, referer: 'https://f1weekend.co/races/canada', ...over,
});

test('booking clicks per page: people only, our live site only, old addresses merged', () => {
  assert.deepEqual(bookingClicksByPath([
    click({}),
    click({ referer: 'https://f1weekend.co/races/canada-2026/' }),
    click({ userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1)' }),
    click({ sessionId: 'internal-abc' }),
    click({ referer: 'https://staging.f1weekend.co/races/canada' }),
    click({ referer: null }),
  ]), { '/races/canada': 2 });
});

test('real export: 8 page tickets, Belgium "Getting there" first', () => {
  const tickets = runLoop({ gscRows, clickRows: [], raceDates, now });
  assert.deepEqual(tickets.map((t) => [t.path, t.score]), [
    ['/races/belgium/getting-there', 66],
    ['/', 49],
    ['/races/canada', 17],
    ['/races/bahrain/schedule', 12],
    ['/races/singapore/experiences/singapore-river-cruise-spectra-garden-rhapsody-light-show-singapore-2026', 12],
    ['/races/netherlands/experiences', 8],
    ['/races/azerbaijan', 3],
    ['/races/shanghai', 3],
  ]);
});

test('real export: old -2026 race addresses never appear, the Singapore page is locked by the experiment', () => {
  const tickets = runLoop({ gscRows, clickRows: [], raceDates, now });
  assert.ok(tickets.every((t) => !/^\/races\/[a-z-]+-20\d\d/.test(t.path)));
  assert.equal(tickets.find((t) => t.raceKey === 'singapore')!.blockedUntil, '2026-12-07');
  assert.equal(tickets.find((t) => t.path === '/')!.raceKey, null);
  const belgium = tickets[0].opportunities.map((o) => o.query);
  assert.ok(belgium.includes('f1 spa place'));
  assert.ok(belgium.includes('driving to spa francorchamps from uk'));
});

test('booking clicks on a page double its score', () => {
  const tickets = runLoop({ gscRows, clickRows: [click({})], raceDates, now });
  assert.equal(tickets.find((t) => t.path === '/races/canada')!.score, 34);
});
