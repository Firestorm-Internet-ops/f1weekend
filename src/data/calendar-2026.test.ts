// Run: npm run test:providers
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CALENDAR_2026, TRACK_TIMEZONES, nextCalendarRace, sortByCalendar, hasLiveExperiences, calendarEntry } from './calendar-2026';

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

test('Sepang timetable: F1 sessions become FP1–FP3, Qualifying, Race in local time', async () => {
  const { timetableSessions, timetableFor } = await import('./timetables-2026');
  const s = timetableSessions('bahrain-2026', 7);
  assert.deepEqual(s.map((x) => `${x.shortName} ${x.dayOfWeek} ${x.startTime}`), [
    'FP1 Friday 12:30', 'FP2 Friday 16:00', 'FP3 Saturday 12:30', 'Q Saturday 16:00', 'RACE Sunday 15:00',
  ]);
  assert.ok(s.every((x) => x.id < 0 && x.raceId === 7));
  assert.equal(timetableFor('bahrain-2026')?.length, 15);
  assert.equal(timetableFor('monaco-2026'), undefined);
});

test('Austin timetable (COTA official schedule): F1 sessions match Jolpica, Thursday included, in order', async () => {
  const { timetableSessions, timetableFor } = await import('./timetables-2026');
  assert.deepEqual(timetableSessions('usa-2026', 9).map((x) => `${x.shortName} ${x.dayOfWeek} ${x.startTime}`), [
    'FP1 Friday 12:30', 'FP2 Friday 16:00', 'FP3 Saturday 12:30', 'Q Saturday 16:00', 'RACE Sunday 15:00',
  ]);
  const t = timetableFor('usa-2026')!;
  assert.ok(t.some((e) => e.day === 'Thursday' && e.seriesKey === 'f1-academy'));
  assert.ok(t.some((e) => e.seriesKey === 'porsche-cup'));
  const order = ['Thursday', 'Friday', 'Saturday', 'Sunday'];
  for (let i = 0; i < t.length; i++) {
    assert.ok(t[i].end >= t[i].start, t[i].name);
    if (i > 0) {
      const a = t[i - 1], b = t[i];
      assert.ok(order.indexOf(a.day) < order.indexOf(b.day) || (a.day === b.day && a.start <= b.start), `${a.name} before ${b.name}`);
    }
  }
});

const WEEKEND_ORDER = ['Thursday', 'Friday', 'Saturday', 'Sunday'];
function assertOrdered(t: { day: string; start: string; end: string; name: string }[]) {
  for (let i = 0; i < t.length; i++) {
    assert.ok(t[i].end >= t[i].start, t[i].name);
    if (i > 0) {
      const a = t[i - 1], b = t[i];
      assert.ok(WEEKEND_ORDER.indexOf(a.day) < WEEKEND_ORDER.indexOf(b.day) || (a.day === b.day && a.start <= b.start), `${a.name} before ${b.name}`);
    }
  }
}

test('Mexico City timetable (formula1.com official timetable): F1 sessions match Jolpica, support races present, in order', async () => {
  const { timetableSessions, timetableFor } = await import('./timetables-2026');
  // Jolpica UTC → Mexico City (UTC−6, no DST).
  assert.deepEqual(timetableSessions('mexico-2026', 19).map((x) => `${x.shortName} ${x.dayOfWeek} ${x.startTime}`), [
    'FP1 Friday 12:30', 'FP2 Friday 16:00', 'FP3 Saturday 11:30', 'Q Saturday 15:00', 'RACE Sunday 14:00',
  ]);
  const t = timetableFor('mexico-2026')!;
  assert.ok(t.some((e) => e.seriesKey === 'support' && e.name.startsWith('Formula 4 NACAM')));
  assertOrdered(t);
});

test('São Paulo timetable (formula1.com official timetable): F1 sessions match Jolpica, support races present, in order', async () => {
  const { timetableSessions, timetableFor } = await import('./timetables-2026');
  // Jolpica UTC → São Paulo (UTC−3, no DST).
  assert.deepEqual(timetableSessions('brazil-2026', 20).map((x) => `${x.shortName} ${x.dayOfWeek} ${x.startTime}`), [
    'FP1 Friday 12:30', 'FP2 Friday 16:00', 'FP3 Saturday 11:30', 'Q Saturday 15:00', 'RACE Sunday 14:00',
  ]);
  const t = timetableFor('brazil-2026')!;
  assert.ok(t.some((e) => e.seriesKey === 'porsche-cup'));
  assert.ok(t.some((e) => e.seriesKey === 'support' && e.name.startsWith('F4 Brazil')));
  assertOrdered(t);
});

test('the next race switches when race day is over at the track, not in UTC', () => {
  // Sepang (UTC+8): race day 4 Oct ends at 16:00 UTC.
  assert.equal(nextCalendarRace(new Date('2026-10-04T15:59:00Z'))?.slug, 'bahrain-2026');
  assert.equal(nextCalendarRace(new Date('2026-10-04T16:01:00Z'))?.slug, 'singapore-2026');
  // Las Vegas races Saturday 21 Nov at 20:00 local (04:00 UTC on the 22nd); race day ends at local midnight (08:00 UTC): still "next" at 06:00.
  assert.equal(nextCalendarRace(new Date('2026-11-22T06:00:00Z'))?.slug, 'las-vegas-2026');
  assert.equal(nextCalendarRace(new Date('2026-11-22T08:01:00Z'))?.slug, 'qatar-2026');
  // Every calendar race has a track time zone.
  for (const r of CALENDAR_2026) assert.ok(TRACK_TIMEZONES[r.slug], r.slug);
});
