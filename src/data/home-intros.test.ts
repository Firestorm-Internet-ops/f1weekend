import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CALENDAR_2026 } from './calendar-2026';
import { HOME_INTROS, homeIntro } from './home-intros';
import { raceKey } from '@/lib/race-url';
import { formatRaceDates } from '@/lib/utils';

const BANNED = [
  'cornerstone', 'vibrant', 'bustling', 'nestled', 'tapestry', 'unforgettable', 'iconic', 'legendary',
  'world-class', 'high-octane', 'seamless', 'premium', 'curated', 'elevate', 'embark', 'delve',
  'look no further', "whether you're", 'in today\'s', 'never miss a beat', 'adrenaline', 'a must', 'ultimate',
];

const words = (s: string) => s.trim().split(/\s+/).length;

/** Realistic values: a long circuit name and a two-word city, so word counts aren't flattered. */
const varsFor = (r: (typeof CALENDAR_2026)[number]) => ({
  season: 2026,
  dates: formatRaceDates(r.raceDate),
  circuit: r.venue?.circuitName ?? 'Autodromo Jose Carlos Pace',
  city: r.venue?.city ?? 'Mexico City',
});

test('every 2026 race has an intro', () => {
  for (const r of CALENDAR_2026) assert.ok(HOME_INTROS[raceKey(r.slug)], `no intro for ${r.slug}`);
});

for (const r of CALENDAR_2026) {
  const key = raceKey(r.slug);
  test(`${key}: intro reads plainly and stays true next season`, () => {
    const raw = HOME_INTROS[key];
    const filled = homeIntro(key, varsFor(r));
    assert.ok(raw && filled);

    assert.ok(filled.heading.length <= 70, `heading is ${filled.heading.length} chars`);
    const n = words(filled.body);
    assert.ok(n >= 60 && n <= 110, `body is ${n} words`);
    assert.ok(!filled.body.includes('\n'), 'body is one paragraph');

    for (const text of [raw.heading, raw.body]) {
      const lower = text.toLowerCase();
      for (const b of BANNED) assert.ok(!lower.includes(b), `banned: "${b}"`);
      assert.ok(!text.includes('—'), 'em dash');
      assert.ok(!/\s–\s/.test(text), 'spaced en dash');
      assert.ok(!/\b(19|20)\d{2}\b/.test(text), 'literal year');
      for (const [, token] of text.matchAll(/\{([^}]*)\}/g)) {
        assert.ok(['season', 'dates', 'circuit', 'city'].includes(token), `unknown token {${token}}`);
      }
    }
    assert.ok(!/[{}]/.test(filled.heading + filled.body), 'token left unfilled');

    assert.ok(raw.sources.length > 0, 'no sources');
    for (const s of raw.sources) {
      assert.ok(s.label.trim(), 'source without a label');
      assert.ok(/^https:\/\//.test(s.url), `not https: ${s.url}`);
    }
  });
}

test('homeIntro fills every token', () => {
  const key = Object.keys(HOME_INTROS)[0];
  const original = HOME_INTROS[key];
  HOME_INTROS.__probe = {
    heading: 'Plan {city} {season}',
    body: '{circuit} runs {dates}; {city} again.',
    sources: original.sources,
  };
  try {
    assert.deepEqual(homeIntro('__probe', { season: 2027, dates: 'Oct 22–24', circuit: 'Circuit of the Americas', city: 'Austin' }), {
      heading: 'Plan Austin 2027',
      body: 'Circuit of the Americas runs Oct 22–24; Austin again.',
    });
  } finally {
    delete HOME_INTROS.__probe;
  }
});

test('an intro written for one circuit is not shown at another', () => {
  const vars = { season: 2027, dates: 'Apr 9–11', circuit: 'Bahrain International Circuit', city: 'Sakhir' };
  assert.equal(homeIntro('bahrain', vars), null);
  assert.ok(homeIntro('bahrain', { ...vars, circuit: 'Sepang International Circuit', city: 'Kuala Lumpur' }));
});

test('homeIntro returns null for an unknown race', () => {
  assert.equal(homeIntro('atlantis', { season: 2026, dates: 'Oct 1–3', circuit: 'X', city: 'Y' }), null);
});
