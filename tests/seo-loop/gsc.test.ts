import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchSearchRows, searchWindow } from '../../src/lib/gsc';

type Call = { url: string; init: RequestInit };
const fakeFetch = (pages: unknown[], status = 200) => {
  const calls: Call[] = [];
  const fn = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const body = pages.shift() ?? {};
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  }) as unknown as typeof fetch;
  return { fn, calls };
};
const row = (i: number) => ({ keys: [`q${i}`, 'https://f1weekend.co/'], clicks: 0, impressions: 1, ctr: 0, position: 50 });

test('the window ends 3 days ago (Search Console lags) and spans 28 days by default', () => {
  assert.deepEqual(searchWindow(new Date('2026-10-21T10:00:00Z')), { startDate: '2026-09-21', endDate: '2026-10-18' });
  assert.deepEqual(searchWindow(new Date('2026-10-21T10:00:00Z'), 7), { startDate: '2026-10-12', endDate: '2026-10-18' });
});

test('one request: the right endpoint, bearer token, query+page dimensions, 25,000 rows a page', async () => {
  const { fn, calls } = fakeFetch([{ rows: [row(1), row(2)] }]);
  const rows = await fetchSearchRows({ siteUrl: 'https://f1weekend.co/', startDate: '2026-09-21', endDate: '2026-10-18', accessToken: 'tok', fetch: fn });
  assert.equal(rows.length, 2);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://www.googleapis.com/webmasters/v3/sites/https%3A%2F%2Ff1weekend.co%2F/searchAnalytics/query');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(new Headers(calls[0].init.headers).get('authorization'), 'Bearer tok');
  assert.deepEqual(JSON.parse(String(calls[0].init.body)), {
    startDate: '2026-09-21', endDate: '2026-10-18', dimensions: ['query', 'page'], rowLimit: 25000, startRow: 0,
  });
});

test('a full page of 25,000 rows asks for the next page', async () => {
  const full = Array.from({ length: 25000 }, (_, i) => row(i));
  const { fn, calls } = fakeFetch([{ rows: full }, { rows: [row(25000)] }]);
  const rows = await fetchSearchRows({ siteUrl: 'https://f1weekend.co/', startDate: 'a', endDate: 'b', accessToken: 't', fetch: fn });
  assert.equal(rows.length, 25001);
  assert.equal(JSON.parse(String(calls[1].init.body)).startRow, 25000);
});

test('no data is an empty list, not an error', async () => {
  const { fn } = fakeFetch([{}]);
  assert.deepEqual(await fetchSearchRows({ siteUrl: 'https://f1weekend.co/', startDate: 'a', endDate: 'b', accessToken: 't', fetch: fn }), []);
});

test('an HTTP error throws with the status', async () => {
  const { fn } = fakeFetch([{ error: { message: 'User does not have sufficient permission' } }], 403);
  await assert.rejects(
    fetchSearchRows({ siteUrl: 'https://f1weekend.co/', startDate: 'a', endDate: 'b', accessToken: 't', fetch: fn }),
    /403/,
  );
});
