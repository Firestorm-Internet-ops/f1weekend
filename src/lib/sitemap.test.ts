import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calendarLastmod, sitemapEntries } from './sitemap';

const R = (slug: string, raceDate: string, timezone: string, extra = {}) => ({ slug, raceDate, timezone, hasTips: true, ...extra });
const races = [
  R('azerbaijan-2026', '2026-09-26', 'Asia/Baku', { hasTips: false }),
  R('bahrain-2026', '2026-10-04', 'Asia/Kuala_Lumpur'),
  R('singapore-2026', '2026-10-11', 'Asia/Singapore'),
  R('usa-2026', '2026-10-25', 'America/Chicago'),
  R('mexico-2026', '2026-11-01', 'America/Mexico_City'),
];
const live = (slug: string) => slug !== 'azerbaijan-2026';
const now = new Date('2026-10-05T12:00:00Z');
const entries = sitemapEntries('https://f1weekend.co', races, live, now);
const find = (path: string) => entries.find((e) => e.loc === `https://f1weekend.co${path}`);

test('home and season page: lastmod is the day after the latest race', () => {
  assert.equal(calendarLastmod(races, now), '2026-10-05');
  assert.equal(find('')?.lastmod, '2026-10-05');
  assert.equal(find('/f1-2026')?.lastmod, '2026-10-05');
  assert.equal(find('/about')?.lastmod, undefined);
  assert.equal(calendarLastmod(races, new Date('2026-01-01T00:00:00Z')), undefined);
});

test('upcoming races come before past ones', () => {
  const idx = (p: string) => entries.findIndex((e) => e.loc === `https://f1weekend.co${p}`);
  assert.ok(idx('/races/singapore') < idx('/races/bahrain'));
  assert.ok(idx('/races/mexico') < idx('/races/azerbaijan'));
});

test('experiment pages carry their live date, others none', () => {
  assert.equal(find('/races/usa')?.lastmod, '2026-09-30');
  assert.equal(find('/races/mexico')?.lastmod, '2026-09-30');
  assert.equal(find('/races/mexico/day-of-the-dead')?.lastmod, '2026-09-30');
  assert.equal(find('/races/singapore')?.lastmod, undefined);
  assert.equal(find('/races/usa/schedule')?.lastmod, undefined);
});

test('only pages that exist and do not redirect', () => {
  assert.equal(find('/races/azerbaijan/tips'), undefined); // no tips
  assert.ok(find('/races/azerbaijan/experiences/map')); // database list has a map
  assert.equal(find('/races/singapore/experiences/map'), undefined); // live feed: map redirects
  assert.ok(entries.every((e) => !/\/races\/[a-z-]+-20\d\d/.test(e.loc)), 'no year in race URLs');
  assert.equal(new Set(entries.map((e) => e.loc)).size, entries.length);
});
