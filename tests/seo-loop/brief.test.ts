import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildBrief, weekendFact, type RaceFacts } from '../../src/lib/seo-loop/brief';
import type { PageTicket } from '../../src/lib/seo-loop/opportunities';

const belgium: RaceFacts = {
  raceKey: 'belgium',
  raceName: 'Belgian Grand Prix',
  season: 2026,
  startDate: '2026-07-24',
  raceDate: '2026-07-26',
  facts: [
    'Circuit de Spa-Francorchamps is 7.004 km long.',
    'The nearest airports are Liège (about 60 km) and Brussels (about 140 km).',
  ],
};

const opp = (query: string, impressions: number) => ({ type: 'weak-match' as const, query, path: '/races/belgium/getting-there', impressions, clicks: 0, position: 80, score: impressions });
const ticket = (over: Partial<PageTicket> = {}): PageTicket => ({
  path: '/races/belgium/getting-there',
  raceKey: 'belgium',
  score: 0,
  blockedUntil: null,
  opportunities: [opp('a', 1), opp('b', 9), opp('c', 8), opp('d', 7), opp('e', 6), opp('f', 5)],
  ...over,
});

test('weekend dates as a sentence, same month and across two months', () => {
  assert.equal(weekendFact(belgium), 'The 2026 Belgian Grand Prix weekend is 24–26 July 2026.');
  assert.equal(
    weekendFact({ ...belgium, raceName: 'Mexico City Grand Prix', startDate: '2026-10-30', raceDate: '2026-11-01' }),
    'The 2026 Mexico City Grand Prix weekend is 30 October–1 November 2026.',
  );
});

test('brief: the 5 searches with most impressions, the weekend fact first, then the race facts', () => {
  const b = buildBrief(ticket(), belgium);
  assert.equal(b.path, '/races/belgium/getting-there');
  assert.equal(b.raceKey, 'belgium');
  assert.deepEqual(b.queries, ['b', 'c', 'd', 'e', 'f']);
  assert.deepEqual(b.facts, [
    'The 2026 Belgian Grand Prix weekend is 24–26 July 2026.',
    'Circuit de Spa-Francorchamps is 7.004 km long.',
    'The nearest airports are Liège (about 60 km) and Brussels (about 140 km).',
  ]);
});

test('allowed numbers are exactly the numbers in the facts', () => {
  assert.deepEqual(buildBrief(ticket(), belgium).allowedNumbers, ['140', '2026', '24', '26', '60', '7.004']);
});

test('the prompt carries every search, every fact and the rules the QA gate checks', () => {
  const { prompt } = buildBrief(ticket(), belgium);
  for (const q of ['b', 'c', 'd', 'e', 'f']) assert.ok(prompt.includes(`- ${q}`), q);
  for (const f of buildBrief(ticket(), belgium).facts) assert.ok(prompt.includes(f), f);
  assert.match(prompt, /40.60 words/);
  assert.match(prompt, /only the numbers in the facts/i);
  assert.match(prompt, /JSON/);
});

test('a blocked page or a page of another race cannot be briefed', () => {
  assert.throws(() => buildBrief(ticket({ blockedUntil: '2026-12-07' }), belgium), /blocked/i);
  assert.throws(() => buildBrief(ticket({ raceKey: 'canada', path: '/races/canada' }), belgium), /race/i);
});
