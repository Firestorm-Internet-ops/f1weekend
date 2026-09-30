// Run: npm run test:providers
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupByZoom, kmPerPixels, spreadAround } from './map-groups';
import { haversineKm } from './nearby';

const MARINA_BAY = { lat: 1.2834, lng: 103.8607 };
const GARDENS = { lat: 1.2816, lng: 103.8636 };
const SENTOSA = { lat: 1.2494, lng: 103.8303 };

test('zoomed out, nearby venues are one group; zoomed in they split', () => {
  const pins = [
    { id: 1, ...MARINA_BAY, tier: 'near' as const, count: 40 },
    { id: 2, ...GARDENS, tier: 'near' as const, count: 30 },
    { id: 3, ...SENTOSA, tier: 'city' as const, count: 20 },
  ];
  const far = groupByZoom(pins, 11, 1.29);
  assert.equal(far.length, 2, 'Marina Bay + Gardens together, Sentosa apart');
  assert.equal(far.find((g) => g.members.length === 2)!.count, 70);
  const near = groupByZoom(pins, 16, 1.29);
  assert.equal(near.length, 3);
  // A group takes the closest tier's colour.
  assert.equal(groupByZoom(pins, 9, 1.29)[0].tier, 'near');
});

test('pixels to km: ~44 px is a few km at zoom 11, ~100 m at zoom 16', () => {
  assert.ok(kmPerPixels(44, 11, 1.29) > 3 && kmPerPixels(44, 11, 1.29) < 4);
  assert.ok(kmPerPixels(44, 16, 1.29) < 0.15);
});

test('tours with no exact spot are spread evenly around the centre, none stacked', () => {
  const pts = spreadAround(MARINA_BAY, 186, 1.2);
  assert.equal(pts.length, 186);
  for (const p of pts) assert.ok(haversineKm(MARINA_BAY, p) <= 1.21);
  const minGap = Math.min(...pts.flatMap((a, i) => pts.slice(i + 1).map((b) => haversineKm(a, b))));
  assert.ok(minGap > 0.05, `closest two are ${minGap.toFixed(3)} km apart`);
  // Zoomed in far enough, they are separate pins.
  assert.equal(groupByZoom(pts.map((p, i) => ({ id: i, ...p, tier: 'city' as const })), 19, 1.28).length, 186);
});
