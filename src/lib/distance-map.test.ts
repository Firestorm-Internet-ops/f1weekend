// Run: npx tsx --test src/lib/distance-map.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutDistanceMap, toLocalKm } from './distance-map';
import { radiusKmForMins } from './nearby';

const MONACO = { lat: 43.7347, lng: 7.4206 };
const SILVERSTONE = { lat: 52.0786, lng: -1.0169 };

const exp = (id: number, lat: number | null, lng: number | null) => ({ id, title: `E${id}`, slug: `e${id}`, lat, lng });

test('toLocalKm: east is +x, north is +y, ~111 km per degree of latitude', () => {
  const east = toLocalKm({ lat: MONACO.lat, lng: MONACO.lng + 0.1 }, MONACO);
  assert.ok(east.x > 0 && Math.abs(east.y) < 1e-9);
  const north = toLocalKm({ lat: MONACO.lat + 1, lng: MONACO.lng }, MONACO);
  assert.ok(Math.abs(north.y - 110.574) < 0.01 && Math.abs(north.x) < 1e-9);
});

test('circuit is the centre; north is up and east is right', () => {
  const layout = layoutDistanceMap(
    [exp(1, 43.7396, 7.427), exp(2, 43.7102, 7.262)], // Casino (NE, near), Nice (W/SW, city)
    'monaco-2026',
    MONACO,
    600
  );
  assert.equal(layout.center, 300);
  const casino = layout.dots.find((d) => d.id === 1)!;
  const nice = layout.dots.find((d) => d.id === 2)!;
  assert.ok(casino.x > 300 && casino.y < 300, 'casino is north-east of the circuit');
  assert.ok(nice.x < 300 && nice.y > 300, 'Nice is west / south-west');
  assert.equal(casino.tier, 'near');
  assert.equal(nice.tier, 'city');
  assert.equal(casino.offMap, false);
  assert.equal(nice.offMap, false);
  assert.equal(casino.label, '5 min from the circuit');
});

test('rings are drawn at the tested travel-time radius and fit inside the view', () => {
  const layout = layoutDistanceMap([], 'monaco-2026', MONACO, 600);
  const pxPerKm = (300 * 0.94) / layout.viewRadiusKm;
  assert.deepEqual(layout.rings.map((r) => r.mins), [30, 60]);
  assert.ok(Math.abs(layout.rings[0].r - radiusKmForMins(30) * pxPerKm) < 1e-9);
  assert.ok(layout.rings[1].r < 300, '60 min ring fits');
});

test('far activities are pinned to the edge in the right direction', () => {
  const layout = layoutDistanceMap([exp(1, 43.7696, 11.2558)], 'monaco-2026', MONACO, 600); // Florence, due east
  const d = layout.dots[0];
  assert.equal(d.offMap, true);
  assert.equal(d.tier, 'too-far');
  assert.ok(d.x > 560 && d.x <= 600, 'on the east edge');
  assert.ok(Math.abs(d.y - 300) < 10, 'roughly level with the circuit');
});

test('fan bases stretch the view so they are visible (Silverstone)', () => {
  const layout = layoutDistanceMap([], 'britain-2026', SILVERSTONE, 600);
  assert.equal(layout.bases.length, 2);
  for (const b of layout.bases) {
    assert.equal(b.offMap, false, `${b.name} visible`);
    assert.ok(b.x > 0 && b.x < 600 && b.y > 0 && b.y < 600);
  }
});

test('activities without coordinates are counted, not drawn', () => {
  const layout = layoutDistanceMap([exp(1, null, null), exp(2, 0, 0)], 'monaco-2026', MONACO);
  assert.equal(layout.dots.length, 0);
  assert.equal(layout.missing, 2);
});
