// Run: npm run test:providers
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CALENDAR_2026, nextCalendarRace, sortByCalendar, hasLiveExperiences, calendarEntry } from './calendar-2026';

// Baku and Las Vegas race on Saturday in 2026.
const SATURDAY_RACES = new Set(['azerbaijan-2026', 'las-vegas-2026']);

test('calendar is in round order with 23 races, race day on Sunday (Saturday for Baku, Las Vegas)', () => {
  assert.equal(CALENDAR_2026.length, 23);
  CALENDAR_2026.forEach((r, i) => {
    assert.equal(r.round, i + 1, r.slug);
    assert.ok(r.startDate <= r.raceDate, r.slug);
    assert.equal(new Date(`${r.raceDate}T12:00:00Z`).getUTCDay(), SATURDAY_RACES.has(r.slug) ? 6 : 0, `${r.slug} race day`);
    if (i > 0) assert.ok(CALENDAR_2026[i - 1].raceDate < r.raceDate, r.slug);
  });
});

test('next race after Azerbaijan is Bahrain (at Sepang), then Singapore', () => {
  assert.equal(nextCalendarRace('2026-09-27')?.slug, 'bahrain-2026');
  assert.equal(nextCalendarRace('2026-09-29')?.slug, 'bahrain-2026');
  assert.equal(nextCalendarRace('2026-10-04')?.slug, 'bahrain-2026'); // race day itself
  assert.equal(nextCalendarRace('2026-10-05')?.slug, 'singapore-2026');
  assert.equal(calendarEntry('bahrain-2026')?.venue?.circuitName, 'Sepang International Circuit');
  assert.ok(hasLiveExperiences('bahrain-2026'));
  assert.ok(!hasLiveExperiences('monaco-2026'));
});

test('next race skips races the site has no page for; after the season stays on the last', () => {
  assert.equal(nextCalendarRace('2026-09-29', new Set(['monaco-2026', 'singapore-2026']))?.slug, 'singapore-2026');
  assert.equal(nextCalendarRace('2027-01-10')?.slug, 'abu-dhabi-2026');
});

test('sortByCalendar orders by round and drops off-calendar races', () => {
  const list = [{ slug: 'saudi-2026' }, { slug: 'bahrain-2026' }, { slug: 'melbourne-2026' }, { slug: 'unknown-2026' }];
  assert.deepEqual(sortByCalendar(list).map((r) => r.slug), ['melbourne-2026', 'bahrain-2026', 'unknown-2026']);
});
