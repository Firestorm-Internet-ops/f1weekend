import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeRows, type GscRow } from '../../src/lib/seo-loop/rows';

const gsc = (query: string, page: string, impressions: number, clicks: number, position: number): GscRow => ({
  keys: [query, page], impressions, clicks, position, ctr: impressions ? clicks / impressions : 0,
});

test('a Search Console row becomes { query, path, impressions, clicks, position }', () => {
  assert.deepEqual(mergeRows([gsc('f1 weekend montreal', 'https://f1weekend.co/races/canada-2026', 9, 0, 83.4)]), [
    { query: 'f1 weekend montreal', path: '/races/canada', impressions: 9, clicks: 0, position: 83.4 },
  ]);
});

test('the old -2026 address and the new one are one page: counts add up, position is weighted by impressions', () => {
  const [row, ...rest] = mergeRows([
    gsc('spa parking', 'https://f1weekend.co/races/belgium-2026/getting-there', 30, 1, 60),
    gsc('spa parking', 'https://f1weekend.co/races/belgium/getting-there', 10, 1, 20),
  ]);
  assert.equal(rest.length, 0);
  assert.equal(row.path, '/races/belgium/getting-there');
  assert.equal(row.impressions, 40);
  assert.equal(row.clicks, 2);
  assert.equal(row.position, 50); // (30×60 + 10×20) / 40
});

test('the query is trimmed and lower-cased before merging', () => {
  const rows = mergeRows([
    gsc('Spa Parking ', 'https://f1weekend.co/races/belgium', 2, 0, 40),
    gsc('spa parking', 'https://f1weekend.co/races/belgium', 2, 0, 40),
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].query, 'spa parking');
  assert.equal(rows[0].impressions, 4);
});

test('rows for other hosts and rows with no impressions are dropped', () => {
  assert.deepEqual(mergeRows([
    gsc('x', 'https://staging.f1weekend.co/races/usa', 5, 0, 10),
    gsc('y', 'https://f1weekend.co/races/usa', 0, 0, 0),
  ]), []);
});

test('the result is sorted by impressions, highest first', () => {
  const rows = mergeRows([
    gsc('a', 'https://f1weekend.co/', 1, 0, 50),
    gsc('b', 'https://f1weekend.co/', 7, 0, 50),
  ]);
  assert.deepEqual(rows.map((r) => r.query), ['b', 'a']);
});
