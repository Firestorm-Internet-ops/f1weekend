import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rollForward } from './rollover';
import type { Race } from '@/types/race';

const race = (over: Partial<Race>): Race => ({
  id: 1, slug: 'monaco-2026', name: 'Grand Prix de Monaco', season: 2026, round: 6,
  circuitName: 'Circuit de Monaco', city: 'Monte Carlo', country: 'Monaco', countryCode: 'MC',
  circuitLat: 43.73, circuitLng: 7.42, timezone: 'Europe/Monaco', raceDate: '2026-06-07', startDate: '2026-06-05', ...over,
});
const NEXT = [
  { key: 'monaco', season: 2027, round: 7, name: 'Monaco Grand Prix', startDate: '2027-06-04', raceDate: '2027-06-06' },
  { key: 'bahrain', season: 2027, round: 4, name: 'Bahrain Grand Prix', startDate: '2027-04-09', raceDate: '2027-04-11' },
];

test('a race still to come is left alone', () => {
  const r = race({});
  assert.equal(rollForward(r, NEXT, new Date('2026-06-07T12:00:00Z')), r);
});

test('after race day it moves to next season when F1 has published it', () => {
  const r = rollForward(race({}), NEXT, new Date('2026-06-08T12:00:00Z'));
  assert.equal(r.season, 2027);
  assert.equal(r.raceDate, '2027-06-06');
  assert.equal(r.startDate, '2027-06-04');
  assert.equal(r.round, 7);
  assert.equal(r.rolledFrom, 2026);
  assert.equal(r.slug, 'monaco-2026'); // stored data (experiences, content) stays attached
});

test('no next-season date yet: stays on the finished weekend', () => {
  const r = race({});
  assert.equal(rollForward(r, [], new Date('2026-06-08T12:00:00Z')), r);
});

test('a one-off venue move is undone for next season (Bahrain: Sepang 2026 → Sakhir)', () => {
  const sepang = race({
    slug: 'bahrain-2026', name: 'Bahrain Grand Prix', circuitName: 'Sepang International Circuit', city: 'Kuala Lumpur',
    country: 'Malaysia', timezone: 'Asia/Kuala_Lumpur', raceDate: '2026-10-04', venueMoved: true, venueNote: 'Held at Sepang…', trackImage: 'x.webp',
    storedVenue: { name: 'Bahrain Grand Prix', circuitName: 'Bahrain International Circuit', city: 'Sakhir', country: 'Bahrain', countryCode: 'BH',
      circuitLat: 26.03, circuitLng: 50.51, timezone: 'Asia/Bahrain', flag: '🇧🇭', hasTips: true },
  });
  const r = rollForward(sepang, NEXT, new Date('2026-10-05T12:00:00Z'));
  assert.equal(r.city, 'Sakhir');
  assert.equal(r.timezone, 'Asia/Bahrain');
  assert.equal(r.venueMoved, false);
  assert.equal(r.venueNote, undefined);
  assert.equal(r.hasTips, true);
  assert.equal(r.raceDate, '2027-04-11');
});
