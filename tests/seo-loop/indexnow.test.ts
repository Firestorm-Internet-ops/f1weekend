import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { INDEXNOW_KEY, indexNowBody, submitIndexNow } from '../../src/lib/indexnow';

test('the key is 32 hex characters and public/<key>.txt holds it (that file proves we own the site)', () => {
  assert.match(INDEXNOW_KEY, /^[a-f0-9]{32}$/);
  assert.equal(readFileSync(`public/${INDEXNOW_KEY}.txt`, 'utf8').trim(), INDEXNOW_KEY);
});

test('body: our host, key, key location, full canonical URLs, duplicates and other sites removed', () => {
  const body = indexNowBody([
    '/races/usa',
    'https://www.f1weekend.co/races/usa/',
    'https://f1weekend.co/races/belgium-2026/getting-there',
    'https://staging.f1weekend.co/races/usa',
    'https://example.com/x',
  ]);
  assert.deepEqual(body, {
    host: 'f1weekend.co',
    key: INDEXNOW_KEY,
    keyLocation: `https://f1weekend.co/${INDEXNOW_KEY}.txt`,
    urlList: ['https://f1weekend.co/races/usa', 'https://f1weekend.co/races/belgium/getting-there'],
  });
});

test('nothing of ours to send is null', () => {
  assert.equal(indexNowBody(['https://example.com/']), null);
  assert.equal(indexNowBody([]), null);
});

test('more than 10,000 URLs is refused (the IndexNow limit per request)', () => {
  const many = Array.from({ length: 10001 }, (_, i) => `/races/r${i}`);
  assert.throws(() => indexNowBody(many), /10,?000/);
});

test('submit: POST JSON to api.indexnow.org; 200 and 202 are success', async () => {
  const body = indexNowBody(['/races/usa'])!;
  for (const status of [200, 202]) {
    const seen: { url: string; init: RequestInit }[] = [];
    const fn = (async (url: string, init: RequestInit) => { seen.push({ url, init }); return new Response(null, { status }); }) as unknown as typeof fetch;
    assert.equal(await submitIndexNow(body, fn), status);
    assert.equal(seen.length, 1);
    assert.equal(seen[0].url, 'https://api.indexnow.org/indexnow');
    assert.equal(seen[0].init.method, 'POST');
    assert.match(new Headers(seen[0].init.headers).get('content-type')!, /^application\/json/);
    assert.deepEqual(JSON.parse(String(seen[0].init.body)), body);
  }
});

test('submit: any other status throws with it (403 = key file not found, 422 = URLs not ours)', async () => {
  const fn = (async () => new Response(null, { status: 403 })) as unknown as typeof fetch;
  await assert.rejects(submitIndexNow(indexNowBody(['/races/usa'])!, fn), /403/);
});
