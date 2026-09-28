// Run: npx tsx --test src/lib/nearby.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyNearbyRules,
  classifyExperience,
  isNightRace,
  nearbyLabel,
  raceKey,
  sortByNearest,
} from './nearby';

const MONACO = { lat: 43.7347, lng: 7.4206 };
const SILVERSTONE = { lat: 52.0786, lng: -1.0169 };
const MONZA = { lat: 45.6156, lng: 9.2811 };
const SUZUKA = { lat: 34.8431, lng: 136.5407 };

const tier = (loc: { lat: number; lng: number } | null, slug: string, circuit: { lat: number; lng: number } | null) =>
  classifyExperience(loc, slug, circuit).tier;

test('raceKey strips the year', () => {
  assert.equal(raceKey('britain-2026'), 'britain');
  assert.equal(raceKey('abu-dhabi-2026'), 'abu-dhabi');
  assert.equal(raceKey('las-vegas'), 'las-vegas');
});

test('night races', () => {
  assert.equal(isNightRace('singapore-2026'), true);
  assert.equal(isNightRace('las-vegas-2026'), true);
  assert.equal(isNightRace('monaco-2026'), false);
});

test('Monaco: city circuit', () => {
  assert.equal(tier({ lat: 43.7396, lng: 7.427 }, 'monaco-2026', MONACO), 'near'); // Casino
  assert.equal(tier({ lat: 43.7102, lng: 7.262 }, 'monaco-2026', MONACO), 'city'); // Nice
  assert.equal(tier({ lat: 43.5528, lng: 7.0174 }, 'monaco-2026', MONACO), 'daytrip'); // Cannes
  assert.equal(tier({ lat: 43.7696, lng: 11.2558 }, 'monaco-2026', MONACO), 'too-far'); // Florence
});

test('Silverstone: out-of-town circuit uses where fans stay', () => {
  assert.equal(tier({ lat: 51.752, lng: -1.2577 }, 'britain-2026', SILVERSTONE), 'daytrip'); // Oxford
  assert.equal(tier({ lat: 51.5033, lng: -0.1196 }, 'britain-2026', SILVERSTONE), 'daytrip'); // London Eye
  assert.equal(tier({ lat: 51.1789, lng: -1.8262 }, 'britain-2026', SILVERSTONE), 'too-far'); // Stonehenge
  assert.equal(tier({ lat: 52.0406, lng: -0.7594 }, 'britain-2026', SILVERSTONE), 'city'); // Milton Keynes
});

test('Monza: Milan counts as the city', () => {
  const duomo = classifyExperience({ lat: 45.4641, lng: 9.1919 }, 'italy-2026', MONZA);
  assert.equal(duomo.tier, 'city');
  assert.equal(duomo.from, 'Milan');
  assert.equal(tier({ lat: 45.8081, lng: 9.0852 }, 'italy-2026', MONZA), 'daytrip'); // Lake Como
});

test('Suzuka: Nagoya is the base', () => {
  assert.equal(tier({ lat: 35.1856, lng: 136.8998 }, 'japan-2026', SUZUKA), 'city'); // Nagoya Castle
  assert.equal(tier({ lat: 35.0116, lng: 135.7681 }, 'japan-2026', SUZUKA), 'daytrip'); // Kyoto
  assert.equal(tier({ lat: 35.6762, lng: 139.6503 }, 'japan-2026', SUZUKA), 'too-far'); // Tokyo
});

test('missing or zero coordinates are "unknown", never hidden', () => {
  assert.equal(tier(null, 'monaco-2026', MONACO), 'unknown');
  assert.equal(tier({ lat: 0, lng: 0 }, 'monaco-2026', MONACO), 'unknown');
  assert.equal(tier({ lat: NaN, lng: 7 }, 'monaco-2026', MONACO), 'unknown');
  // No circuit and no known base for the race
  assert.equal(tier({ lat: 43.7396, lng: 7.427 }, 'monaco-2026', null), 'unknown');
  const { visible, hidden } = applyNearbyRules([{ lat: undefined, lng: undefined }], 'monaco-2026', MONACO);
  assert.equal(visible.length, 1);
  assert.equal(hidden.length, 0);
});

test('applyNearbyRules: drops too-far and caps day trips at 3 in given order', () => {
  const cannes = { lat: 43.5528, lng: 7.0174 };
  const items = [
    { id: 1, ...cannes },
    { id: 2, lat: 43.7396, lng: 7.427 }, // near
    { id: 3, ...cannes },
    { id: 4, ...cannes },
    { id: 5, lat: 43.7696, lng: 11.2558 }, // too far
    { id: 6, ...cannes }, // 4th day trip → hidden
  ];
  const { visible, hidden } = applyNearbyRules(items, 'monaco-2026', MONACO);
  assert.deepEqual(visible.map((v) => v.item.id), [1, 2, 3, 4]);
  assert.deepEqual(hidden.map((h) => h.item.id), [5, 6]);
});

test('sortByNearest orders near → city → unknown → day trip', () => {
  const items = [
    { id: 'daytrip', lat: 43.5528, lng: 7.0174 },
    { id: 'unknown', lat: undefined, lng: undefined },
    { id: 'city', lat: 43.7102, lng: 7.262 },
    { id: 'near', lat: 43.7396, lng: 7.427 },
  ];
  const { visible } = applyNearbyRules(items, 'monaco-2026', MONACO);
  assert.deepEqual(sortByNearest(visible).map((v) => v.item.id), ['near', 'city', 'unknown', 'daytrip']);
});

test('labels', () => {
  assert.equal(nearbyLabel({ tier: 'near', distanceKm: 1, travelMins: 15, from: 'the circuit' }), '15 min from the circuit');
  assert.equal(nearbyLabel({ tier: 'daytrip', distanceKm: 70, travelMins: 90, from: 'Nagoya' }), 'Day trip · 1h 30 from Nagoya');
  assert.equal(nearbyLabel({ tier: 'city', distanceKm: 20, travelMins: 60, from: 'Milan' }), '1h from Milan');
  assert.equal(nearbyLabel({ tier: 'unknown', distanceKm: null, travelMins: null, from: null }), null);
});
