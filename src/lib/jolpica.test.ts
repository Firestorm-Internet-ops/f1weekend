// Run: npm run test:providers
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findJolpicaRace, mergeSessions, sessionsOf, toLocal, toSessionRows, type JolpicaRace } from './jolpica';
import { checkSchedules } from './schedule-check';
import type { Race, Session } from '@/types/race';

// Shaped like https://api.jolpi.ca/ergast/f1/2026/races/ (times UTC; Kuala Lumpur is UTC+8).
const SEPANG: JolpicaRace = {
  round: '16', raceName: 'Bahrain Grand Prix', date: '2026-10-04', time: '07:00:00Z',
  Circuit: { circuitId: 'sepang', circuitName: 'Sepang International Circuit', Location: { lat: '2.76083', long: '101.738', locality: 'Kuala Lumpur', country: 'Malaysia' } },
  FirstPractice: { date: '2026-10-02', time: '04:30:00Z' },
  SecondPractice: { date: '2026-10-02', time: '08:00:00Z' },
  ThirdPractice: { date: '2026-10-03', time: '04:30:00Z' },
  Qualifying: { date: '2026-10-03', time: '08:00:00Z' },
};
const VEGAS: JolpicaRace = {
  round: '21', raceName: 'Las Vegas Grand Prix', date: '2026-11-22', time: '04:00:00Z',
  Circuit: { circuitId: 'vegas', circuitName: 'Las Vegas Strip Circuit', Location: { lat: '36.1147', long: '-115.173', locality: 'Las Vegas', country: 'USA' } },
};

const race = (p: Partial<Race>): Race => ({
  id: 1, slug: 'bahrain-2026', name: '', season: 2026, round: 16, circuitName: 'Sepang International Circuit', city: 'Kuala Lumpur',
  country: 'Malaysia', countryCode: 'MY', circuitLat: 2.7608, circuitLng: 101.7382, timezone: 'Asia/Kuala_Lumpur', raceDate: '2026-10-04', ...p,
});

test('sessions come out in weekend order with UTC starts', () => {
  assert.deepEqual(sessionsOf(SEPANG).map((s) => `${s.key} ${s.startUtc}`), [
    'FP1 2026-10-02T04:30:00Z', 'FP2 2026-10-02T08:00:00Z', 'FP3 2026-10-03T04:30:00Z', 'Q 2026-10-03T08:00:00Z', 'RACE 2026-10-04T07:00:00Z',
  ]);
});

test('sessions without a published time are skipped', () => {
  assert.deepEqual(sessionsOf({ ...SEPANG, time: undefined, FirstPractice: { date: '2026-10-02' } }).map((s) => s.key), ['FP2', 'FP3', 'Q']);
});

test('UTC → local day and time in the race timezone', () => {
  assert.deepEqual(toLocal('2026-10-02T04:30:00Z', 'Asia/Kuala_Lumpur'), { day: 'Friday', time: '12:30' });
  assert.deepEqual(toLocal('2026-11-22T04:00:00Z', 'America/Los_Angeles'), { day: 'Saturday', time: '20:00' });
});

test('session rows in local time with end times', () => {
  const rows = toSessionRows(sessionsOf(SEPANG), 7, 'Asia/Kuala_Lumpur');
  assert.deepEqual(rows.map((r) => `${r.shortName} ${r.dayOfWeek} ${r.startTime}-${r.endTime}`), [
    'FP1 Friday 12:30-13:30', 'FP2 Friday 16:00-17:00', 'FP3 Saturday 12:30-13:30', 'Q Saturday 16:00-17:00', 'RACE Sunday 15:00-17:00',
  ]);
});

test('race matching uses date (±1 day) and circuit location, not round numbers', () => {
  assert.equal(findJolpicaRace([VEGAS, SEPANG], race({}))?.round, '16');
  assert.equal(findJolpicaRace([SEPANG], race({ circuitLat: 26.0325, circuitLng: 50.5106 })), undefined); // Sakhir: wrong venue
  assert.equal(findJolpicaRace([SEPANG], race({ raceDate: '2026-04-12' })), undefined);
  // Las Vegas: Saturday night local is Sunday in UTC
  assert.equal(findJolpicaRace([VEGAS], race({ raceDate: '2026-11-21', circuitLat: 36.1147, circuitLng: -115.173 }))?.round, '21');
});

test('merge replaces stored F1 sessions and keeps support races', () => {
  const s = (p: Partial<Session>): Session => ({ id: 1, raceId: 1, name: '', shortName: '', dayOfWeek: 'Friday', startTime: '10:00:00', endTime: '11:00:00', sessionType: 'practice', ...p });
  const merged = mergeSessions(
    [s({ name: 'Old FP1', startTime: '11:30:00' }), s({ name: 'Porsche Race', sessionType: 'support', startTime: '09:00:00' })],
    toSessionRows(sessionsOf(SEPANG), 1, 'Asia/Kuala_Lumpur'),
  );
  assert.deepEqual(merged.filter((m) => m.dayOfWeek === 'Friday').map((m) => m.name), ['Porsche Race', 'Practice 1', 'Practice 2']);
  assert.deepEqual(mergeSessions([s({})], []), [s({})]); // nothing from Jolpica → stored kept
});

test('schedule check: matching timetable is clean; moved session and wrong date are flagged', () => {
  const today = '2026-09-29';
  assert.deepEqual(checkSchedules([race({})], [SEPANG], today), []);
  const moved = { ...SEPANG, Qualifying: { date: '2026-10-03', time: '09:00:00Z' } };
  assert.deepEqual(checkSchedules([race({})], [moved], today).map((i) => i.kind), ['session-time']);
  assert.deepEqual(checkSchedules([race({ slug: 'x-2026', raceDate: '2026-10-05' })], [SEPANG], today).map((i) => i.kind), ['date']);
  assert.deepEqual(checkSchedules([race({})], [], today).map((i) => i.kind), ['not-in-jolpica']);
  assert.deepEqual(checkSchedules([race({ raceDate: '2026-03-08' })], [], today), []); // finished races skipped
});
