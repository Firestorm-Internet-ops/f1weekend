import { test } from 'node:test';
import assert from 'node:assert/strict';
import { destinationOf, diversify, editorialPicks, gapFitLabel, mixSites, venueKey, weekendGaps, withGapLabels, zoneFor } from './feed-enrich';
import type { FeedCard } from './nearby-feed';
import type { Session } from '@/types/race';

const card = (over: Partial<FeedCard>): FeedCard => ({
  key: over.key ?? over.title ?? 'k',
  title: 'Thing',
  imageUrl: 'https://img/x.jpg',
  durationHours: 3,
  lat: 3.15, lng: 101.71,
  locationName: 'Kuala Lumpur',
  approximateLocation: true,
  nearby: { tier: 'city', distanceKm: 1, travelMins: 10, from: 'Kuala Lumpur' },
  nearbyLabel: null,
  circuitKm: 44,
  circuitMins: 60,
  travelLabel: null,
  rating: 4.7,
  reviewCount: 500,
  offers: [],
  category: 'culture',
  ...over,
});

// Sepang 2026 F1 sessions (track time).
const S = (id: number, day: Session['dayOfWeek'], start: string, end: string, type: Session['sessionType'], shortName: string): Session =>
  ({ id, raceId: 1, name: shortName, shortName, dayOfWeek: day, startTime: start, endTime: end, sessionType: type });
const SEPANG: Session[] = [
  S(1, 'Friday', '12:30', '13:30', 'practice', 'FP1'),
  S(2, 'Friday', '16:00', '17:00', 'practice', 'FP2'),
  S(3, 'Saturday', '12:30', '13:30', 'practice', 'FP3'),
  S(4, 'Saturday', '16:00', '17:00', 'qualifying', 'Q'),
  S(5, 'Sunday', '15:00', '17:00', 'race', 'RACE'),
];

test('zones: central KL and Putrajaya get curated times; elsewhere none', () => {
  assert.equal(zoneFor({ lat: 3.15, lng: 101.71 }, 'bahrain-2026')?.name, 'Kuala Lumpur');
  assert.equal(zoneFor({ lat: 2.93, lng: 101.69 }, 'bahrain-2026')?.mins, 30);
  assert.equal(zoneFor({ lat: 3.15, lng: 101.71 }, 'singapore-2026'), null);
  assert.equal(zoneFor({ lat: null, lng: null }, 'bahrain-2026'), null);
});

test('day trips are named by destination', () => {
  assert.equal(destinationOf('From Kuala Lumpur: Malacca Heritage Day Trip'), 'Malacca');
  assert.equal(destinationOf('Genting Highlands & Batu Caves Tour'), 'Genting Highlands');
  assert.equal(destinationOf('Petronas Towers Ticket'), null);
});

test('venue keys and diversify: the second Batu Caves tour moves below other places', () => {
  assert.equal(venueKey('Kuala Lumpur: Batu Caves Half-Day Tour'), 'batu-caves');
  const list = [
    card({ title: 'Batu Caves Half-Day Tour' }),
    card({ title: 'Batu Caves & Temples by Night' }),
    card({ title: 'Street Food Walk in Jalan Alor' }),
    card({ title: 'Petronas Twin Towers Skybridge Ticket' }),
  ];
  const out = diversify(list, 3);
  assert.deepEqual(out.map((c) => c.title), [
    'Batu Caves Half-Day Tour', 'Street Food Walk in Jalan Alor', 'Petronas Twin Towers Skybridge Ticket', 'Batu Caves & Temples by Night',
  ]);
  assert.equal(out.length, list.length);
});

test('weekend gaps around Sepang sessions', () => {
  const gaps = weekendGaps(SEPANG);
  const labels = gaps.map((g) => g.label);
  assert.equal(labels[0], 'Fits Fri before FP1 12:30');
  assert.equal(labels[labels.length - 1], 'Fits Thursday, before the track action');
  assert.ok(labels.includes('Fits Fri before FP1 12:30'));
  assert.ok(labels.includes('Fits Fri between FP1 and FP2'));
  assert.ok(labels.includes('Fits Sun before the race 15:00'));
  assert.ok(labels.includes('Fits Sat after Q (ends 17:00)'));
});

test('gap fit: a 2h city tour fits Friday morning; a long day trip only Thursday; between sessions needs the circuit close', () => {
  const gaps = weekendGaps(SEPANG);
  assert.equal(gapFitLabel(card({ durationHours: 2 }), gaps), 'Fits Fri before FP1 12:30');
  const noThu = gaps.filter((g) => g.day !== 'Thursday');
  assert.equal(gapFitLabel(card({ durationHours: 10, category: 'daytrip' }), noThu), null);
  assert.equal(gapFitLabel(card({ durationHours: 10, category: 'daytrip' }), gaps), 'Fits Thursday, before the track action');
  // 1h kart session 10 min from the circuit fits between FP1 and FP2 (13:30–15:15).
  const kart = card({ durationHours: 1, circuitMins: 10, nearby: { tier: 'near', distanceKm: 3, travelMins: 10, from: 'the circuit' } });
  const friAfternoon = noThu.filter((g) => g.from === 'circuit');
  assert.equal(gapFitLabel(kart, friAfternoon), 'Fits Fri between FP1 and FP2');
});

test('editorial picks: three different kinds, well reviewed, fitting a gap', () => {
  const cards = withGapLabels([
    card({ title: 'Batu Caves Half-Day Tour', category: 'culture', reviewCount: 4000 }),
    card({ title: 'Batu Caves Sunrise Tour', category: 'adventure', reviewCount: 3000 }),
    card({ title: 'Jalan Alor Food Walk', category: 'food', reviewCount: 2000 }),
    card({ title: 'Barely Reviewed Bar Crawl', category: 'nightlife', reviewCount: 20 }),
    card({ title: 'KL Tower Observation Deck', category: 'attraction', reviewCount: 900 }),
  ], SEPANG);
  assert.deepEqual(editorialPicks(cards).map((c) => c.title), ['Batu Caves Half-Day Tour', 'Jalan Alor Food Walk', 'KL Tower Observation Deck']);
});

test('mixSites keeps the order but breaks runs of three from one site; a lone site is left alone', () => {
  const o = (provider: 'getyourguide' | 'viator' | 'tiqets') => [{ provider, productId: '1', url: 'u', priceAmount: 1, priceCurrency: 'SGD', rating: 5, reviewCount: 1, freeCancellation: false, instantConfirmation: false }];
  const list = ['g1', 'g2', 'g3', 'g4', 'v1', 'g5', 't1'].map((k) => card({ key: k, title: k, offers: o(k[0] === 'g' ? 'getyourguide' : k[0] === 'v' ? 'viator' : 'tiqets') }));
  assert.deepEqual(mixSites(list).map((c) => c.key), ['g1', 'g2', 'v1', 'g3', 'g4', 't1', 'g5']);
  const onlyOne = ['a', 'b', 'c', 'd'].map((k) => card({ key: k, title: k, offers: o('getyourguide') }));
  assert.deepEqual(mixSites(onlyOne).map((c) => c.key), ['a', 'b', 'c', 'd']);
});
