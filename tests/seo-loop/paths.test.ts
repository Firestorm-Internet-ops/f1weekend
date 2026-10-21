import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizePath } from '../../src/lib/seo-loop/paths';

test('full f1weekend.co URL becomes a path', () => {
  assert.equal(normalizePath('https://f1weekend.co/races/canada'), '/races/canada');
  assert.equal(normalizePath('https://f1weekend.co/'), '/');
  assert.equal(normalizePath('https://f1weekend.co'), '/');
});

test('www, query string, hash and trailing slash are dropped', () => {
  assert.equal(normalizePath('https://www.f1weekend.co/races/usa/schedule/?utm=x#gap'), '/races/usa/schedule');
});

test('the race year is dropped from the race segment only, as next.config.ts redirects', () => {
  assert.equal(normalizePath('https://f1weekend.co/races/belgium-2026/getting-there'), '/races/belgium/getting-there');
  assert.equal(normalizePath('https://f1weekend.co/races/abu-dhabi-2026'), '/races/abu-dhabi');
  // The experience slug keeps its own "-singapore-2026" ending: the redirect only rewrites the race segment.
  assert.equal(
    normalizePath('https://f1weekend.co/races/singapore-2026/experiences/river-cruise-singapore-2026'),
    '/races/singapore/experiences/river-cruise-singapore-2026',
  );
});

test('a bare path is accepted', () => {
  assert.equal(normalizePath('/races/bahrain-2026/schedule'), '/races/bahrain/schedule');
});

test('other sites and staging are not ours', () => {
  assert.equal(normalizePath('https://staging.f1weekend.co/races/usa'), null);
  assert.equal(normalizePath('https://example.com/races/usa'), null);
  assert.equal(normalizePath(''), null);
  assert.equal(normalizePath(null), null);
});
