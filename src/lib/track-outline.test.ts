// Run: npm run test:providers
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickCircuit, renderTrackSvg, overpassQuery, type OsmWay } from './track-outline';

// A ~5 km loop around Sepang built from two ways that share their end points,
// a pit lane joined to it, and a separate small kart track nearby.
const C = { lat: 2.7608, lon: 101.7382 };
const ring = (r: number, n: number, from: number, to: number, cx = C.lon, cy = C.lat) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = from + ((to - from) * i) / n;
    return { lat: +(cy + r * Math.sin(a)).toFixed(6), lon: +(cx + r * Math.cos(a)).toFixed(6) };
  });
const R = 0.0072; // ≈ 800 m radius → ≈ 5 km lap
const mainA: OsmWay = { type: 'way', id: 1, tags: { highway: 'raceway', name: 'Sepang International Circuit' }, geometry: ring(R, 40, 0, Math.PI) };
const mainB: OsmWay = { type: 'way', id: 2, tags: { highway: 'raceway' }, geometry: ring(R, 40, Math.PI, 2 * Math.PI) };
const pit: OsmWay = { type: 'way', id: 3, tags: { highway: 'raceway', service: 'pit_lane' }, geometry: [mainA.geometry![0], { lat: C.lat + 0.001, lon: C.lon + R - 0.0005 }] };
const kart: OsmWay = { type: 'way', id: 4, tags: { highway: 'raceway', name: 'Sepang Go-Kart Circuit' }, geometry: ring(0.001, 20, 0, 2 * Math.PI, C.lon + 0.02, C.lat) };

test('overpass query asks for raceways around the circuit', () => {
  assert.equal(overpassQuery(2.7608, 101.7382), '[out:json][timeout:20];way["highway"="raceway"](around:3000,2.7608,101.7382);out geom;');
});

test('picks the connected racing line (with pit lane), not the kart track', () => {
  const ids = pickCircuit([kart, mainA, pit, mainB]).map((w) => w.id).sort();
  assert.deepEqual(ids, [1, 2, 3]);
});

test('nothing usable: short tracks only → no outline', () => {
  assert.deepEqual(pickCircuit([kart]), []);
  assert.equal(renderTrackSvg([kart]), null);
});

test('renders an SVG that fits the box, with a dashed pit lane', () => {
  const svg = renderTrackSvg([mainA, mainB, pit, kart], { width: 800, height: 520, title: 'Sepang <International>' })!;
  assert.ok(svg.startsWith('<svg') && svg.includes('viewBox="0 0 800 520"'));
  assert.ok(svg.includes('aria-label="Sepang &lt;International&gt;"'));
  assert.equal((svg.match(/stroke-dasharray/g) ?? []).length, 1);
  const nums = [...svg.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
  assert.ok(nums.every(([x, y]) => x >= 0 && x <= 800 && y >= 0 && y <= 520));
});
