// Run: npm run test:providers
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gapPlanner, money, priceGuide, weatherSummary, winsByTeam } from './unique-data';
import type { FeedCard } from './providers/nearby-feed';
import type { Session } from '@/types/race';

let n = 0;
const card = (over: Partial<FeedCard> & { price?: number; currency?: string }): FeedCard => ({
  key: `k${++n}`, title: `Tour ${n}`, imageUrl: null, durationHours: 2, lat: -23.56, lng: -46.65, locationName: 'São Paulo', approximateLocation: false,
  nearby: { tier: 'city', distanceKm: 10, travelMins: 40, from: 'the circuit' }, nearbyLabel: null, circuitKm: 15, circuitMins: 40, travelLabel: null,
  rating: 4.7, reviewCount: 200, category: 'culture',
  offers: [{ provider: 'getyourguide', productId: String(n), url: 'u', priceAmount: over.price ?? 50, priceCurrency: over.currency ?? 'USD', rating: 4.7, reviewCount: 200, freeCancellation: false, instantConfirmation: false }],
  ...over,
});

test('price guide: quartiles per kind of tour, cheapest kind first; small or mixed-currency groups skipped', () => {
  const cards = [
    ...[20, 30, 40, 50, 60].map((price) => card({ category: 'food', price })),
    ...[80, 90, 100, 110, 120, 130].map((price) => card({ category: 'culture', price })),
    ...[10, 20].map((price) => card({ category: 'nightlife', price })),
    card({ category: 'food', price: 999, currency: 'BRL' }),
  ];
  const g = priceGuide(cards);
  assert.deepEqual(g.map((b) => b.category), ['food', 'culture']);
  assert.deepEqual([g[0].low, g[0].median, g[0].high, g[0].count], [30, 40, 50, 5]);
  assert.equal(g[1].median, 105);
});

test('weather summary: wet (1 mm+) and downpours (10 mm+) with their years, average temperatures', () => {
  const s = weatherSummary([
    { season: 2025, date: '2025-11-09', rainMm: 1.9, maxC: 19.5, minC: 13.7 },
    { season: 2024, date: '2024-11-03', rainMm: 17.9, maxC: 21.9, minC: 19.1 },
    { season: 2023, date: '2023-11-05', rainMm: 0.3, maxC: 21.1, minC: 14.4 },
    { season: 2016, date: '2016-11-13', rainMm: 17, maxC: 18.2, minC: 15.7 },
    { season: 2021, date: '2021-11-14', rainMm: null, maxC: null, minC: null },
  ]);
  assert.deepEqual([s.years, s.wet, s.heavy], [4, 3, 2]);
  assert.deepEqual(s.heavyYears, [2016, 2024]);
  assert.equal(s.avgMaxC, 20.2);
});

test('wins by team: most first, ties broken by the most recent win', () => {
  const w = winsByTeam([
    { season: 2025, driver: 'Norris', team: 'McLaren' },
    { season: 2024, driver: 'Verstappen', team: 'Red Bull' },
    { season: 2023, driver: 'Verstappen', team: 'Red Bull' },
    { season: 2022, driver: 'Russell', team: 'Mercedes' },
    { season: 2021, driver: 'Hamilton', team: 'Mercedes' },
    { season: 2017, driver: 'Vettel', team: 'Ferrari' },
  ]);
  assert.deepEqual(w.map((t) => [t.team, t.wins]), [['Red Bull', 2], ['Mercedes', 2], ['McLaren', 1], ['Ferrari', 1]]);
});

test('gap planner: each tour counts once, in the first slot it fits; best three listed', () => {
  const S = (id: number, day: Session['dayOfWeek'], start: string, end: string, type: Session['sessionType']): Session =>
    ({ id, raceId: 1, name: type, shortName: type, dayOfWeek: day, startTime: start, endTime: end, sessionType: type });
  const sessions = [S(1, 'Friday', '15:30', '16:30', 'practice'), S(2, 'Saturday', '15:00', '16:00', 'qualifying'), S(3, 'Sunday', '14:00', '16:00', 'race')];
  const cards = Array.from({ length: 5 }, (_, i) => card({ reviewCount: 100 * (i + 1), durationHours: 2 }));
  const plans = gapPlanner(cards, sessions);
  assert.ok(plans.length >= 1);
  assert.equal(plans.reduce((x, p) => x + p.count, 0), 5);
  assert.ok(plans[0].top.length <= 3);
  assert.equal(plans[0].top[0].reviewCount, 500, 'most reviewed first');
  assert.deepEqual(gapPlanner(cards, []), []);
});

test('money formats whole amounts in the tour currency', () => {
  assert.match(money(104.6, 'BRL'), /R\$\s?105/);
  assert.match(money(40, 'USD'), /US\$40|\$40/);
});
