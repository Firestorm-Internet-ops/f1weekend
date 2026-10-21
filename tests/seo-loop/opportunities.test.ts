import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classify, expectedCtr, findOpportunities, pageTickets, raceKeyOfPath, type LoopContext } from '../../src/lib/seo-loop/opportunities';
import type { SearchRow } from '../../src/lib/seo-loop/rows';

const row = (over: Partial<SearchRow>): SearchRow => ({ query: 'q', path: '/races/canada', impressions: 10, clicks: 0, position: 50, ...over });
const ctx = (over: Partial<LoopContext> = {}): LoopContext => ({
  now: new Date('2026-10-21T00:00:00Z'),
  raceDates: { canada: '2026-05-24', belgium: '2026-07-26', 'las-vegas': '2026-11-21', japan: '2027-04-04' },
  bookingClicks: {},
  ...over,
});

test('expected click-through rate by position (a plain curve, not a measured one)', () => {
  assert.equal(expectedCtr(1), 0.28);
  assert.equal(expectedCtr(2.4), 0.15);
  assert.equal(expectedCtr(5), 0.05);
  assert.equal(expectedCtr(8), 0.03);
  assert.equal(expectedCtr(25), 0.01);
});

test('top 10 with real impressions but half the expected clicks or less: low-ctr', () => {
  assert.equal(classify(row({ position: 3, impressions: 40, clicks: 1 })), 'low-ctr'); // 2.5% < 5%
  assert.equal(classify(row({ position: 3, impressions: 40, clicks: 4 })), null); // 10%: doing fine
  assert.equal(classify(row({ position: 3, impressions: 19, clicks: 0 })), null); // too few impressions to judge
});

test('positions 10–30 are striking distance, beyond 30 the page only weakly matches the query', () => {
  assert.equal(classify(row({ position: 22.5, impressions: 6 })), 'striking-distance');
  assert.equal(classify(row({ position: 30, impressions: 3 })), 'striking-distance');
  assert.equal(classify(row({ position: 74, impressions: 10 })), 'weak-match');
});

test('fewer than 3 impressions is noise, whatever the position', () => {
  assert.equal(classify(row({ position: 15, impressions: 2 })), null);
  assert.equal(classify(row({ position: 80, impressions: 2 })), null);
});

test('race key of a path', () => {
  assert.equal(raceKeyOfPath('/races/belgium/getting-there'), 'belgium');
  assert.equal(raceKeyOfPath('/races/abu-dhabi'), 'abu-dhabi');
  assert.equal(raceKeyOfPath('/'), null);
  assert.equal(raceKeyOfPath('/f1'), null);
});

test('score = impressions × type weight × race-soon boost × booking boost', () => {
  const [weak] = findOpportunities([row({ path: '/races/canada', impressions: 10, position: 74 })], ctx());
  assert.equal(weak.type, 'weak-match');
  assert.equal(weak.score, 10); // 10 × 1 × 1 × 1

  const [striking] = findOpportunities([row({ path: '/races/canada', impressions: 10, position: 20 })], ctx());
  assert.equal(striking.score, 20); // weight 2

  // Las Vegas races within 60 days of "now": ×2. A page with booking clicks: ×2.
  const [soon] = findOpportunities([row({ path: '/races/las-vegas', impressions: 10, position: 74 })], ctx({ bookingClicks: { '/races/las-vegas': 3 } }));
  assert.equal(soon.score, 40);

  // A race more than 60 days away gets no boost; neither does a race that is over.
  const [later] = findOpportunities([row({ path: '/races/japan', impressions: 10, position: 74 })], ctx());
  assert.equal(later.score, 10);
});

test('one query showing two of our pages (each ≥3 impressions) marks both as cannibalised', () => {
  const opps = findOpportunities([
    row({ query: 'spa parking', path: '/races/belgium', impressions: 5, position: 40 }),
    row({ query: 'spa parking', path: '/races/belgium/getting-there', impressions: 8, position: 35 }),
    row({ query: 'spa parking', path: '/', impressions: 1, position: 90 }),
  ], ctx());
  assert.deepEqual(opps.map((o) => [o.path, o.type]).sort(), [
    ['/races/belgium', 'cannibalised'],
    ['/races/belgium/getting-there', 'cannibalised'],
  ]);
  assert.equal(opps.find((o) => o.path === '/races/belgium')!.score, 7.5); // 5 × 1.5
});

test('rows that are not opportunities are left out; the rest are sorted by score', () => {
  const opps = findOpportunities([
    row({ query: 'a', impressions: 2 }),
    row({ query: 'b', impressions: 5, position: 74 }),
    row({ query: 'c', impressions: 5, position: 20 }),
  ], ctx());
  assert.deepEqual(opps.map((o) => o.query), ['c', 'b']);
});

test('page tickets: one per page, score is the sum, opportunities inside sorted by score', () => {
  const tickets = pageTickets(findOpportunities([
    row({ query: 'spa place', path: '/races/belgium/getting-there', impressions: 21, position: 90 }),
    row({ query: 'driving to spa from uk', path: '/races/belgium/getting-there', impressions: 10, position: 74 }),
    row({ query: 'f1 weekend montreal', path: '/races/canada', impressions: 9, position: 83 }),
  ], ctx()), ctx().now);
  assert.equal(tickets.length, 2);
  assert.equal(tickets[0].path, '/races/belgium/getting-there');
  assert.equal(tickets[0].raceKey, 'belgium');
  assert.equal(tickets[0].score, 31);
  assert.deepEqual(tickets[0].opportunities.map((o) => o.query), ['spa place', 'driving to spa from uk']);
  assert.equal(tickets[0].blockedUntil, null);
});

test('a page whose race is in the autumn SEO experiment is blocked until the verdict (7 Dec 2026)', () => {
  const [t] = pageTickets(findOpportunities([row({ path: '/races/las-vegas', impressions: 10, position: 74 })], ctx()), ctx().now);
  assert.equal(t.blockedUntil, '2026-12-07');
  const [after] = pageTickets(findOpportunities([row({ path: '/races/las-vegas', impressions: 10, position: 74 })], ctx()), new Date('2026-12-08T00:00:00Z'));
  assert.equal(after.blockedUntil, null);
});
