// Run: npm run test:providers
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fits, minutesNeeded, pickForGap, circuitTravelMins, newPickState } from './itinerary-feed';
import type { FeedCard } from '@/lib/providers/nearby-feed';
import type { NearbyTier } from '@/lib/nearby';

let n = 0;
function card(tier: NearbyTier, circuitKm: number, durationHours: number | null, title = `x${++n}`): FeedCard {
  return {
    key: `getyourguide:${title}`, title, imageUrl: null, durationHours, lat: 0, lng: 0, locationName: null, approximateLocation: true,
    nearby: { tier, distanceKm: circuitKm, travelMins: 10, from: 'the circuit' }, nearbyLabel: 'x', circuitKm, circuitMins: null, travelLabel: null, rating: 4.5, reviewCount: 10,
    offers: [{ provider: 'getyourguide', productId: title, url: 'https://x', priceAmount: 100, priceCurrency: 'MYR', rating: 4.5, reviewCount: 10, freeCancellation: false, instantConfirmation: false }],
    category: 'culture',
  };
}

test('race-day travel: 5 km ≈ 29 min, Kuala Lumpur (44 km) ≈ 1h40', () => {
  assert.equal(circuitTravelMins({ circuitKm: 5 }), 29); // 6.5 road km at 20 km/h × 1.5
  assert.ok(circuitTravelMins({ circuitKm: 44 })! >= 90);
});

test('between sessions: only near-circuit things that fit with a round trip', () => {
  const kart = card('near', 5, 1.5);
  assert.equal(minutesNeeded(kart, 'between-sessions'), 90 + 2 * 29);
  assert.ok(fits(kart, 'between-sessions', 150));
  assert.ok(!fits(kart, 'between-sessions', 120)); // 2 h gap is too short
  assert.ok(!fits(card('city', 44, 1), 'between-sessions', 600)); // KL is never "between sessions"
});

test('before/after sessions: city allowed with one trip; free day allows day trips', () => {
  assert.ok(fits(card('city', 44, 3), 'after-sessions', 5 * 60));
  assert.ok(!fits(card('daytrip', 80, 6), 'after-sessions', 12 * 60));
  assert.ok(fits(card('daytrip', 80, 6), 'free-day', 14 * 60));
  assert.equal(minutesNeeded(card('city', 44, null), 'free-day'), 180); // unknown duration → 3 h
});

test('picks in feed order, no repeats, day trip guaranteed on a free day', () => {
  const cards = [card('near', 5, 1, 'a'), card('city', 44, 2, 'b'), card('city', 44, 2, 'c'), card('city', 44, 2, 'd'), card('daytrip', 80, 6, 'trip')];
  const used = newPickState();
  const free = pickForGap(cards, { start: '08:00', end: '22:00', kind: 'free-day' }, used);
  assert.deepEqual(free.map((s) => s.title), ['a', 'b', 'trip']);
  const evening = pickForGap(cards, { start: '17:00', end: '22:00', kind: 'after-sessions' }, used);
  assert.deepEqual(evening.map((s) => s.title), ['c', 'd']);
  assert.deepEqual(pickForGap(cards, { start: '13:30', end: '14:00', kind: 'between-sessions' }, used), []); // 30 min gap
});

test('suggestion carries the cheapest offer for booking', () => {
  const c = card('near', 5, 1, 'multi');
  c.offers = [{ ...c.offers[0], provider: 'tiqets', productId: 't1', priceAmount: 90 }, c.offers[0]];
  const [s] = pickForGap([c], { start: '08:00', end: '12:00', kind: 'before-sessions' }, newPickState());
  assert.equal(s.provider, 'tiqets');
  assert.equal(s.productId, 't1');
  assert.equal(s.otherSites, 1);
});

test('the same attraction from another seller is not suggested twice', () => {
  const cards = [
    card('city', 44, 1, 'Kuala Lumpur: Skip-the-Line Petronas Twin Towers E-Ticket'),
    card('city', 44, 1, 'Kuala Lumpur Petronas Towers e-Tickets'),
    card('city', 44, 1, 'Aquaria KLCC Entry Ticket'),
  ];
  const picks = pickForGap(cards, { start: '17:00', end: '22:00', kind: 'after-sessions' }, newPickState());
  assert.deepEqual(picks.map((p) => p.title), ['Kuala Lumpur: Skip-the-Line Petronas Twin Towers E-Ticket', 'Aquaria KLCC Entry Ticket']);
});
