// Run: npm run test:providers
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildNearbyFeed, groupSameProducts, isExperience } from './nearby-feed';
import type { NormalizedOffer } from './types';

const SEPANG = { slug: 'bahrain-2026', lat: 2.7608, lng: 101.7382, placeWords: ['Kuala Lumpur', 'Malaysia'] };
const KL = { lat: 3.1579, lng: 101.7116 };

let n = 0;
function offer(p: Partial<NormalizedOffer>): NormalizedOffer {
  return {
    provider: 'getyourguide', productId: String(++n), title: 'x', url: 'https://example.com', priceAmount: 100, priceCurrency: 'MYR',
    originalPrice: null, rating: 4.5, reviewCount: 100, durationHours: 2, lat: KL.lat, lng: KL.lng, imageUrl: null,
    flags: {}, categories: [], raw: null, ...p,
  };
}

test('travel services are not experiences', () => {
  assert.equal(isExperience({ title: 'KLIA Airport Private Transfer' }), false);
  assert.equal(isExperience({ title: 'KUL Premium Lounge Entry' }), false);
  assert.equal(isExperience({ title: 'Sunway Lagoon Ticket with Transfer' }), true);
});

test('same product on two sites becomes one card with both prices, cheapest first', () => {
  const cards = buildNearbyFeed([
    offer({ provider: 'getyourguide', title: 'Kuala Lumpur: Petronas Twin Towers Skip-the-Line E-Ticket', priceAmount: 182, reviewCount: 900 }),
    offer({ provider: 'tiqets', title: 'Petronas Twin Towers: Skip-the-Line Ticket', priceAmount: 177, reviewCount: 40, lat: 3.1579, lng: 101.7116 }),
  ], SEPANG);
  assert.equal(cards.length, 1);
  assert.deepEqual(cards[0].offers.map((o) => o.provider), ['tiqets', 'getyourguide']);
  assert.equal(cards[0].reviewCount, 940);
});

test('two products from the same site are never merged', () => {
  const groups = groupSameProducts([
    offer({ title: 'Batu Caves Half-Day Tour' }),
    offer({ title: 'Batu Caves Half-Day Tour' }),
  ], SEPANG.placeWords);
  assert.equal(groups.length, 2);
});

test('nearest first: near the circuit, then Kuala Lumpur, then day trips; too far dropped', () => {
  const cards = buildNearbyFeed([
    offer({ title: 'Genting Highlands Day Trip', lat: 3.4236, lng: 101.7933, reviewCount: 5000 }), // ~30 km past KL
    offer({ title: 'Batu Caves Tour', reviewCount: 10 }),
    offer({ title: 'Sepang Go-Kart', lat: 2.78, lng: 101.73, reviewCount: 5 }),
    offer({ title: 'Penang Street Food', lat: 5.4141, lng: 100.3288 }),
  ], SEPANG);
  assert.deepEqual(cards.map((c) => c.title), ['Sepang Go-Kart', 'Batu Caves Tour', 'Genting Highlands Day Trip']);
  assert.equal(cards[0].nearby.tier, 'near');
  assert.equal(cards[1].nearbyLabel, '5 min from Kuala Lumpur');
  assert.equal(cards[2].nearby.tier, 'daytrip');
  assert.equal(cards[1].circuitKm, 44);
});

test('same travel time: most popular first', () => {
  const cards = buildNearbyFeed([
    offer({ title: 'Quiet Museum Visit', reviewCount: 3 }),
    offer({ title: 'Famous Food Tour', reviewCount: 3000 }),
  ], SEPANG);
  assert.deepEqual(cards.map((c) => c.title), ['Famous Food Tour', 'Quiet Museum Visit']);
});

test('categories from titles', async () => {
  const { categorize } = await import('./nearby-feed');
  const c = (title: string, durationHours: number | null = 2) => categorize({ title, categories: [], durationHours });
  assert.equal(c('Kuala Lumpur: Sambal Streets Food Tour with 15+ Tastings'), 'food');
  assert.equal(c('Kuala Lumpur: Local Street Food Night Tour'), 'food');
  assert.equal(c('Kuala Selangor Fireflies and Blue Tears Tour'), 'nightlife');
  assert.equal(c('From Kuala Lumpur: Cameron Highlands Day Tour with Lunch', 12), 'daytrip'); // 12 h outing, not a food tour
  assert.equal(c('Genting Highland Day Tour', 8), 'daytrip');
  assert.equal(c('Sepang: Dirt Go-Kart Adventure at Sepang Bay 13'), 'adventure');
  assert.equal(c('Kuala Lumpur: Skip-the-Line Petronas Twin Towers E-Ticket'), 'attraction');
  assert.equal(c('Kuala Lumpur: Batu Caves Half-Day Tour with Pick-Up Option'), 'culture');
});
