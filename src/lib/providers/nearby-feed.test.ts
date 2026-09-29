// Run: npm run test:providers
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildNearbyFeed, byNearest, displayTitle, groupSameProducts, isExperience, isTransfer, recommendedScore, relocateByTitle } from './nearby-feed';
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

test('nearest sort: near the circuit, then Kuala Lumpur, then day trips; too far dropped', () => {
  const cards = buildNearbyFeed([
    offer({ title: 'Genting Highlands Day Trip', lat: 3.4236, lng: 101.7933, reviewCount: 5000 }), // ~30 km past KL
    offer({ title: 'Batu Caves Tour', reviewCount: 10 }),
    offer({ title: 'Sepang Go-Kart', lat: 2.78, lng: 101.73, reviewCount: 5 }),
    offer({ title: 'Penang Street Food', lat: 5.4141, lng: 100.3288 }),
  ], SEPANG).sort(byNearest);
  assert.deepEqual(cards.map((c) => c.title), ['Sepang Go-Kart', 'Batu Caves Tour', 'Genting Highlands Day Trip']);
  assert.equal(cards[0].nearby.tier, 'near');
  assert.equal(cards[1].nearbyLabel, '5 min from Kuala Lumpur');
  assert.equal(cards[2].nearby.tier, 'daytrip');
  assert.equal(cards[1].circuitKm, 44);
});

test('one travel line per card: race-day time from the circuit, or the day-trip line', () => {
  const [kart, batu] = buildNearbyFeed([
    offer({ title: 'Sepang Go-Kart', lat: 2.78, lng: 101.73, reviewCount: 5 }),
    offer({ title: 'Batu Caves Tour', reviewCount: 10 }),
  ], SEPANG).sort(byNearest);
  assert.match(kart.travelLabel!, /^\d+ min from the circuit$/);
  // Central KL: the curated train + shuttle time, not a road-speed guess.
  assert.equal(batu.travelLabel, '~1h from the circuit by KLIA Ekspres + shuttle');
  assert.equal(batu.circuitMins, 60);
});

test('recommended order: well-reviewed first, even a little further away', () => {
  const cards = buildNearbyFeed([
    offer({ title: 'Unreviewed Kart Session', lat: 2.78, lng: 101.73, rating: null, reviewCount: 0 }),
    offer({ title: 'Batu Caves Half-Day Tour', rating: 4.5, reviewCount: 4779 }),
    offer({ title: 'Single Five Star Walk', rating: 5, reviewCount: 1 }),
  ], SEPANG);
  assert.equal(cards[0].title, 'Batu Caves Half-Day Tour');
  assert.ok(recommendedScore(cards[0]) > recommendedScore(cards[2]));
});

test('same travel time and reviews: nearest breaks the tie', () => {
  const cards = buildNearbyFeed([
    offer({ title: 'Quiet Museum Visit', reviewCount: 3000 }),
    offer({ title: 'Famous Food Tour', reviewCount: 3000, lat: 2.78, lng: 101.73 }),
  ], SEPANG);
  assert.equal(cards[0].title, 'Famous Food Tour'); // near the circuit weighs more
});

test('a tour filed under the wrong town moves to the place in its title', () => {
  const places = [{ name: 'Putrajaya', lat: 2.9264, lng: 101.6964 }, { name: 'Kuala Lumpur', lat: 3.1579, lng: 101.7116 }];
  const moved = relocateByTitle({ title: 'Putrajaya Tour: Pink Mosque', lat: 2.806, lng: 101.735, locationName: 'Sepang', approximateLocation: true }, places);
  assert.equal(moved.locationName, 'Putrajaya');
  assert.equal(relocateByTitle({ title: 'From Kuala Lumpur: Genting', lat: 2.806, lng: 101.735, locationName: 'Sepang', approximateLocation: true }, places).locationName, 'Kuala Lumpur');
  // exact venue points are never moved
  assert.equal(relocateByTitle({ title: 'Putrajaya Lake Cruise', lat: 2.806, lng: 101.735, locationName: 'Pier', approximateLocation: false }, places).locationName, 'Pier');
});

test('display title drops the race city prefix only', () => {
  assert.equal(displayTitle('Kuala Lumpur: Batu Caves Half-Day Tour', ['Kuala Lumpur']), 'Batu Caves Half-Day Tour');
  assert.equal(displayTitle('From Kuala Lumpur: Malacca Day Trip', ['Kuala Lumpur']), 'From Kuala Lumpur: Malacca Day Trip');
  assert.equal(displayTitle('Kuala Lumpur Tower Ticket', ['Kuala Lumpur']), 'Kuala Lumpur Tower Ticket');
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

test('a long trip that picks up in the city is labelled a day trip, not "~2 h from the circuit"', () => {
  const [c] = buildNearbyFeed([
    offer({ title: 'From Kuala Lumpur: Cameron Highlands Day Tour with Lunch', durationHours: 12, approximateLocation: true, locationName: 'Kuala Lumpur', reviewCount: 1000 }),
  ], SEPANG);
  assert.equal(c.travelLabel, 'Day trip to Cameron Highlands');
  assert.equal(c.destination, 'Cameron Highlands');
  assert.equal(c.category, 'daytrip');
});

test('a full-day city tour keeps the city travel line; a venue out of town is a day trip to it', () => {
  const cards = buildNearbyFeed([
    offer({ title: 'Kuala Lumpur Grand Full Day Guided Tour with 25 Attractions', durationHours: 10, reviewCount: 900 }),
    offer({ title: 'Huskitory Connecting People and Dogs', lat: 2.45, lng: 101.95, locationName: 'Melaka', approximateLocation: false, durationHours: 1, reviewCount: 800 }),
  ], SEPANG);
  const tour = cards.find((c) => c.title.startsWith('Kuala Lumpur Grand'))!;
  assert.equal(tour.travelLabel, '~1h from the circuit by KLIA Ekspres + shuttle');
  assert.equal(tour.destination, null);
  const dogs = cards.find((c) => c.title.startsWith('Huskitory'))!;
  assert.equal(dogs.travelLabel, 'Day trip to Melaka');
});

test('transfers are their own list: airport and circuit rides, not tours or lounges', () => {
  assert.equal(isTransfer({ title: 'KLIA Airport Private Transfer to Kuala Lumpur' }), true);
  assert.equal(isTransfer({ title: 'Shared Shuttle to Sepang Circuit' }), true);
  assert.equal(isTransfer({ title: 'KUL Premium Lounge Entry' }), false);
  assert.equal(isTransfer({ title: 'Batu Caves Tour with Hotel Transfer' }), false);
  assert.equal(isTransfer({ title: 'Sunway Lagoon Theme Park with Round-Trip Transfer' }), false);
  assert.equal(isTransfer({ title: 'Putrajaya: River Cruise with Pink Mosque + Roundtrip Transfer' }), false);
  assert.equal(isTransfer({ title: 'KL TravelPass: Single Trip KLIA Ekspres + Unlimited Rail Transfer (2 Consecutive Days)' }), true);
  assert.equal(isTransfer({ title: 'Kuala Lumpur Hotel to Singapore Hotel (Door To Door) Overland Transfer' }), true);
  assert.equal(isExperience({ title: 'Kuala Lumpur Hotel to Singapore Hotel (Door To Door) Overland Transfer' }), false);
  const offers = [
    offer({ title: 'KLIA Airport Private Transfer to Kuala Lumpur', lat: 2.74, lng: 101.7, reviewCount: 300 }),
    offer({ title: 'Batu Caves Half-Day Tour', reviewCount: 900 }),
  ];
  assert.deepEqual(buildNearbyFeed(offers, SEPANG, 'transfers').map((c) => c.title), ['KLIA Airport Private Transfer to Kuala Lumpur']);
  assert.deepEqual(buildNearbyFeed(offers, SEPANG).map((c) => c.title), ['Batu Caves Half-Day Tour']);
});
