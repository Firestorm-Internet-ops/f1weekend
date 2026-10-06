import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clickReport, fromReferer, isBot, recentClicks, reportRange, summarize, topTours, type ClickRow } from './click-stats';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/129 Safari/537.36';
const row = (over: Partial<ClickRow>): ClickRow => ({
  clickedAt: new Date('2026-10-04T10:00:00Z'), partner: 'getyourguide', source: 'feed', sessionId: 's1', userAgent: UA,
  referer: 'https://f1weekend.co/races/singapore/schedule', ...over,
});
const from = new Date('2026-10-01T00:00:00Z');
const to = new Date('2026-10-05T23:59:59Z');

test('bots and scripts are not people', () => {
  assert.equal(isBot(UA), false);
  assert.equal(isBot('Mozilla/5.0 (compatible; Googlebot/2.1)'), true);
  assert.equal(isBot('curl/8.5.0'), true);
  assert.equal(isBot(null), true);
});

test('referer: host without www, race key without year, kind of page', () => {
  assert.deepEqual(fromReferer('https://www.f1weekend.co/races/bahrain-2026/experiences?x=1'), { host: 'f1weekend.co', race: 'bahrain', page: 'experiences' });
  assert.deepEqual(fromReferer('https://f1weekend.co/'), { host: 'f1weekend.co', race: null, page: 'home' });
  assert.deepEqual(fromReferer(null), { host: null, race: null, page: 'unknown' });
});

test('summary: people only, this site only, every day of the range listed', () => {
  const s = summarize([
    row({}),
    row({ sessionId: 's1', partner: 'viator', source: 'featured', referer: 'https://f1weekend.co/races/singapore' }),
    row({ sessionId: 's2', referer: 'https://f1weekend.co/races/usa/schedule', clickedAt: new Date('2026-10-02T09:00:00Z') }),
    row({ sessionId: null, referer: null }),
    row({ userAgent: 'Googlebot/2.1 (+http://www.google.com/bot.html)' }),
    row({ referer: 'https://staging.f1weekend.co/races/singapore' }),
    row({ clickedAt: new Date('2026-09-01T00:00:00Z') }),
  ], 'f1weekend.co', from, to);
  assert.equal(s.clicks, 4);
  assert.equal(s.people, 3, 's1, s2 and one click without a session');
  assert.equal(s.bots, 1);
  assert.equal(s.elsewhere, 1);
  assert.equal(s.byDay.length, 5);
  assert.deepEqual(s.byDay.find((d) => d.key === '2026-10-04'), { key: '2026-10-04', n: 3 });
  assert.deepEqual(s.bySite[0], { key: 'getyourguide', n: 3 });
  assert.deepEqual(s.byRace[0], { key: 'singapore', n: 2 });
  assert.deepEqual(s.byPage.map((p) => p.key).sort(), ['race', 'schedule', 'unknown']);
  assert.ok(s.byPlacement.some((p) => p.key === 'Picks' && p.n === 1));
});

test('top tours: one row per product, most clicked first', () => {
  const c = (productId: string, t = '2026-10-04T10:00:00Z') => ({ clickedAt: new Date(t), provider: 'viator', race: 'singapore', productId, title: `Tour ${productId}` });
  const top = topTours([c('a'), c('b'), c('b'), c('c', '2026-10-05T10:00:00Z')]);
  assert.deepEqual(top.map((t) => [t.productId, t.n]), [['b', 2], ['c', 1], ['a', 1]]);
});

test('recent clicks: people on this site, newest first, with the tour when known', () => {
  const list = recentClicks([
    row({ clickedAt: new Date('2026-10-03T10:00:00Z'), experienceTitle: 'Night Safari' }),
    row({ clickedAt: new Date('2026-10-04T10:00:00Z'), partner: 'viator', sessionId: 'abcdef123' }),
    row({ clickedAt: new Date('2026-10-04T11:00:00Z'), userAgent: 'Googlebot/2.1' }),
    row({ clickedAt: new Date('2026-10-04T12:00:00Z'), referer: 'https://staging.f1weekend.co/races/usa' }),
  ], 'f1weekend.co', from, to, [
    { clickedAt: new Date('2026-10-04T10:00:20Z'), provider: 'viator', race: 'singapore', productId: 'p1', title: 'Gardens by the Bay', sessionId: 'abcdef123' },
  ]);
  assert.equal(list.length, 2);
  assert.equal(list[0].tour, 'Gardens by the Bay');
  assert.equal(list[0].visitor, 'abcdef');
  assert.equal(list[1].tour, 'Night Safari');
  assert.equal(list[1].page, 'schedule');
});

test('internal browsers (?internal=1) are test clicks, not people', () => {
  const s = summarize([row({}), row({ sessionId: 'internal-abc' })], 'f1weekend.co', from, to);
  assert.equal(s.clicks, 1);
  assert.equal(s.elsewhere, 1);
  assert.equal(recentClicks([row({ sessionId: 'internal-abc' })], 'f1weekend.co', from, to).length, 0);
  assert.equal(topTours([{ clickedAt: from, provider: 'viator', race: null, productId: 'x', title: 'X', sessionId: 'internal-1' }]).length, 0);
});

test('report ranges: yesterday, or the 7 days up to yesterday, and the period before', () => {
  const now = new Date('2026-10-06T03:30:00Z');
  const d = reportRange('daily', now);
  assert.equal(d.from.toISOString(), '2026-10-05T00:00:00.000Z');
  assert.equal(d.to.toISOString(), '2026-10-05T23:59:59.999Z');
  assert.equal(d.prevFrom.toISOString(), '2026-10-04T00:00:00.000Z');
  const w = reportRange('weekly', now);
  assert.equal(w.from.toISOString(), '2026-09-29T00:00:00.000Z');
  assert.equal(w.prevFrom.toISOString(), '2026-09-22T00:00:00.000Z');
});

test('daily report: counts, comparison, every click with its tour', () => {
  const now = new Date('2026-10-06T03:30:00Z');
  const rows = [
    row({ clickedAt: new Date('2026-10-05T09:00:00Z'), partner: 'viator', sessionId: 'v1', referer: 'https://f1weekend.co/races/singapore/schedule', source: 'featured' }),
    row({ clickedAt: new Date('2026-10-05T10:00:00Z'), sessionId: 'internal-x' }),
    row({ clickedAt: new Date('2026-10-04T10:00:00Z') }),
    row({ clickedAt: new Date('2026-10-04T11:00:00Z'), sessionId: 's2' }),
  ];
  const tours = [{ clickedAt: new Date('2026-10-05T09:00:10Z'), provider: 'viator', race: 'singapore', productId: 'p', title: 'Night Safari | Zoo', sessionId: 'v1' }];
  const md = clickReport('daily', rows, tours, 'f1weekend.co', now, 'https://staging.f1weekend.co/stats');
  assert.match(md, /Daily booking clicks: Mon 5 Oct/);
  assert.match(md, /\*\*1 click\*\* by \*\*1 person\*\*/);
  assert.match(md, /day before: 2, -1/);
  assert.match(md, /1 test click/);
  assert.match(md, /\| Night Safari \/ Zoo \| Viator \| Singapore \| Schedule \| Picks \|/);
});
