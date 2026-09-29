import { test } from 'node:test';
import assert from 'node:assert/strict';
import { answersFor } from './answers-2026';
import type { Race, Session } from '@/types/race';

const race: Race = {
  id: 1, slug: 'usa-2026', name: 'United States Grand Prix', season: 2026, round: 18,
  circuitName: 'Circuit of the Americas', city: 'Austin', country: 'United States', countryCode: 'US',
  circuitLat: 30.1328, circuitLng: -97.6411, timezone: 'America/Chicago', raceDate: '2026-10-25', startDate: '2026-10-23',
};
const S = (id: number, day: Session['dayOfWeek'], start: string, type: Session['sessionType'], name: string): Session =>
  ({ id, raceId: 1, name, shortName: name, dayOfWeek: day, startTime: start, endTime: start, sessionType: type });
const words = (s: string) => s.trim().split(/\s+/).length;

test('Austin answers: every answer is 40–60 words, ids unique', () => {
  const answers = answersFor('usa', { race, sessions: [], tzLabel: 'CDT', picks: ['Barbecue Tour', 'Kayak on Lady Bird Lake', 'Capitol Walk'] })!;
  assert.ok(answers.length >= 6);
  for (const a of answers) {
    const n = words(a.a);
    assert.ok(n >= 40 && n <= 60, `${a.id}: ${n} words`);
  }
  assert.equal(new Set(answers.map((a) => a.id)).size, answers.length);
});

test('start time comes from the timetable when F1 has published it', () => {
  const sessions = [S(1, 'Saturday', '17:00', 'qualifying', 'Qualifying'), S(2, 'Sunday', '14:00', 'race', 'Grand Prix')];
  const t = answersFor('usa', { race, sessions, tzLabel: 'CDT', picks: [] })!.find((a) => a.id === 'race-start-time')!;
  assert.match(t.a, /Sunday 25 October at 14:00 Austin time \(CDT\)/);
  assert.match(t.a, /Qualifying is on Saturday at 17:00/);
  const words2 = words(t.a);
  assert.ok(words2 >= 40 && words2 <= 60, `${words2} words`);
});

test('without published times it says when they come, not a guess; other races have no set', () => {
  const t = answersFor('usa', { race, sessions: [], tzLabel: 'CDT', picks: [] })!.find((a) => a.id === 'race-start-time')!;
  assert.match(t.a, /23–25 October 2026/);
  assert.doesNotMatch(t.a, /\d\d:\d\d/);
  assert.equal(answersFor('singapore', { race, sessions: [], tzLabel: 'SGT', picks: [] }), null);
});

test('long pick titles never push the answer past 60 words', () => {
  const long = ['Best of Austin Small-Group Driving Tour with Local Guide and Tastings', 'Austin Biker Gang Guided Electric Bike Tour Through the City Centre', 'Lady Bird Lake Sunset Kayak Rental with Bat Watching Experience'];
  const t = answersFor('usa', { race, sessions: [], tzLabel: 'CDT', picks: long })!.find((a) => a.id === 'things-to-do')!;
  const n = words(t.a);
  assert.ok(n >= 40 && n <= 60, `${n} words`);
});
