// Run: npm run test:providers
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildAffiliateUrl, stripGygTracking } from './affiliate-url';
import { toProviderId, providerName } from './meta';
import { sortOffers } from './offers';
import { matchOffers, scorePair, tokenize, titleSimilarity, MATCH_THRESHOLDS, type MatchTarget } from './match';
import { normalizeViator, cleanViatorUrl } from './viator';
import { normalizeTiqets } from './tiqets';
import type { NormalizedOffer, Offer } from './types';

const ctx = { experienceId: 42, source: 'feed' as const };
const PLACE = ['Monaco', 'monte carlo', 'riviera', 'french'];

function offer(p: Partial<NormalizedOffer>): NormalizedOffer {
  return {
    provider: 'viator', productId: 'x', title: '', url: 'https://example.com/p', priceAmount: null, priceCurrency: 'EUR',
    originalPrice: null, rating: null, reviewCount: 0, durationHours: null, lat: null, lng: null, imageUrl: null,
    flags: {}, categories: [], raw: null, ...p,
  };
}
const target = (id: number, title: string, durationHours: number | null = null, lat: number | null = null, lng: number | null = null): MatchTarget =>
  ({ id, title, durationHours, lat, lng });

// ── affiliate links ────────────────────────────────────────────────────────

test('GYG link replaces stale tracking params with ours', () => {
  const url = new URL(buildAffiliateUrl('getyourguide', 'https://www.getyourguide.com/monaco-l273/t123/?partner_id=OLD&utm_term=1', ctx));
  assert.equal(url.searchParams.getAll('partner_id').length, 1);
  assert.notEqual(url.searchParams.get('partner_id'), 'OLD');
  assert.equal(url.searchParams.get('utm_term'), '42');
  assert.equal(url.searchParams.get('utm_content'), 'feed');
  assert.equal(url.pathname, '/monaco-l273/t123/');
});

test('stripGygTracking keeps non-tracking params and survives bad URLs', () => {
  assert.equal(stripGygTracking('https://g.com/t1?date=2026-06-05&partner_id=A'), 'https://g.com/t1?date=2026-06-05');
  assert.equal(stripGygTracking('not a url'), 'not a url');
});

test('Viator link keeps the account pid/mcid and adds a campaign sub-ID', () => {
  const url = new URL(buildAffiliateUrl('viator', 'https://www.viator.com/tours/Monaco/x/d948-197141P1?mcid=42383&pid=P00038490&medium=api', ctx));
  assert.equal(url.searchParams.get('pid'), 'P00038490');
  assert.equal(url.searchParams.get('mcid'), '42383');
  assert.equal(url.searchParams.get('campaign'), 'f1w-42-feed');
});

test('Tiqets link keeps the partner param and adds tq_campaign', () => {
  const url = new URL(buildAffiliateUrl('tiqets', 'https://www.tiqets.com/en/monaco-attractions-c73505/p1014117/?partner=acct', { experienceId: 7, source: 'guide' }));
  assert.equal(url.searchParams.get('partner'), 'acct');
  assert.equal(url.searchParams.get('tq_campaign'), 'f1w-7-guide');
});

// ── provider names ─────────────────────────────────────────────────────────

test('legacy affiliate_partner values map to GetYourGuide', () => {
  for (const v of ['getyourguide', 'GetYourGuide', 'GYG', '', null, undefined, 'something-else']) {
    assert.equal(toProviderId(v), 'getyourguide', String(v));
  }
  assert.equal(toProviderId('Viator'), 'viator');
  assert.equal(providerName('tiqets'), 'Tiqets');
  assert.equal(providerName(''), 'GetYourGuide');
});

// ── offer ordering ─────────────────────────────────────────────────────────

test('sortOffers puts the primary offer first, then cheapest, unknown price last', () => {
  const o = (id: number, priceAmount: number | null, isPrimary = false): Offer => ({
    id, experienceId: 1, provider: 'viator', productId: null, url: '', priceAmount, priceCurrency: 'EUR',
    originalPrice: null, rating: null, reviewCount: 0, flags: {}, isPrimary,
  });
  assert.deepEqual(sortOffers([o(1, null), o(2, 50), o(3, 80, true), o(4, 30)]).map((x) => x.id), [3, 4, 2, 1]);
});

// ── normalisers ────────────────────────────────────────────────────────────

test('normalizeViator reads price, rating, duration and flags', () => {
  const n = normalizeViator({
    productCode: '197141P1', title: 'Monaco F1 Walking Tour',
    productUrl: 'https://www.viator.com/tours/Monaco/x/d948-197141P1?mcid=1&pid=P2&medium=api&campaign=old',
    pricing: { summary: { fromPrice: 55, fromPriceBeforeDiscount: 60 }, currency: 'EUR' },
    reviews: { totalReviews: 1358, combinedAverageRating: 4.921944 },
    duration: { fixedDurationInMinutes: 135 }, confirmationType: 'INSTANT', flags: ['FREE_CANCELLATION'],
  });
  assert.equal(n.priceAmount, 55);
  assert.equal(n.originalPrice, 60);
  assert.equal(n.rating, 4.9);
  assert.equal(n.durationHours, 2.3);
  assert.deepEqual(n.flags, { instantConfirmation: true, skipTheLine: false, freeCancellation: true });
  assert.ok(!n.url.includes('campaign='));
  assert.ok(n.url.includes('pid=P2'));
  assert.equal(cleanViatorUrl('bad'), 'bad');
});

test('normalizeTiqets reads coordinates, "HH:MM" duration and cancellation', () => {
  const n = normalizeTiqets({
    id: '975975', title: 'Hop-on Hop-off Bus Monaco', product_url: 'https://www.tiqets.com/en/p975975/?partner=acct&tq_campaign=old',
    geolocation: { lat: 43.73, lng: 7.42 }, ratings: { total: 12, average: 4.1 }, currency: 'EUR', price: 25, prediscount_price: null,
    duration: '01:30', instant_ticket_delivery: true, cancellation: { policy: 'never' },
  });
  assert.equal(n.durationHours, 1.5);
  assert.equal(n.lat, 43.73);
  assert.equal(n.flags.freeCancellation, false);
  assert.equal(n.url, 'https://www.tiqets.com/en/p975975/?partner=acct');
});

// ── matching ───────────────────────────────────────────────────────────────

test('tokenize drops listing boilerplate, place names and accents', () => {
  assert.deepEqual([...tokenize('Oceanographic Museum of Monaco: Entry Ticket', PLACE)], ['oceanographic', 'museum']);
  assert.deepEqual([...tokenize('Èze: Perfume Factory', PLACE)], ['eze', 'perfume', 'factory']);
});

test('one shared generic word is not a match', () => {
  assert.ok(titleSimilarity(tokenize('Walking Tour in Monaco', PLACE), tokenize('Lisbon: Jerónimos Monastery + Belém Walking Tour', PLACE)) < 0.3);
});

test('same product on two sites auto-matches', () => {
  const [r] = matchOffers(
    [offer({ provider: 'tiqets', title: 'Hop-on Hop-off Bus Monaco', durationHours: 1 })],
    [target(1, 'Monaco Hop on Hop Off Sightseeing Bus Tour', 1), target(2, 'Oceanographic Museum Ticket', 2)],
    PLACE,
  );
  assert.equal(r.target?.id, 1);
  assert.equal(r.decision, 'auto');
});

test('same venue ticket matches using location', () => {
  const s = scorePair(
    offer({ provider: 'tiqets', title: 'Oceanographic Museum of Monaco: Entry Ticket', lat: 43.7308, lng: 7.4256 }),
    target(1, 'Monaco Oceanographic Museum Admission Ticket', 2, 43.7307, 7.4255),
    PLACE,
  );
  assert.ok(s.score >= MATCH_THRESHOLDS.AUTO, String(s.score));
});

test('different formats never auto-match: private vs shared, 9 h vs 4 h', () => {
  const priv = scorePair(offer({ title: 'Monaco and Eze Day Trip', durationHours: 6 }), target(1, 'Private Monaco and Eze Day Trip', 6), PLACE);
  assert.ok(priv.score < MATCH_THRESHOLDS.AUTO);
  const long = scorePair(offer({ title: 'Cannes Antibes Saint-Paul-de-Vence Tour', durationHours: 9 }), target(1, 'Cannes Antibes Saint Paul de Vence Tour', 4), PLACE);
  assert.ok(long.score < MATCH_THRESHOLDS.AUTO && long.score >= MATCH_THRESHOLDS.REVIEW);
});

test('two different venues next to each other do not match', () => {
  const s = scorePair(
    offer({ provider: 'tiqets', title: 'Oceanographic Museum of Monaco: Entry Ticket', lat: 43.7308, lng: 7.4256 }),
    target(1, "Prince's Palace of Monaco Entry Ticket", 1.5, 43.7314, 7.4200),
    PLACE,
  );
  assert.equal(s.score < MATCH_THRESHOLDS.REVIEW, true, String(s.score));
});

test('only one offer per provider is auto-attached to an experience', () => {
  const rs = matchOffers(
    [offer({ productId: 'a', title: 'Monaco Hop on Hop Off Bus', durationHours: 1 }), offer({ productId: 'b', title: 'Monaco Hop-on Hop-off Bus Tour', durationHours: 1 })],
    [target(1, 'Monaco Hop on Hop Off Sightseeing Bus Tour', 1)],
    PLACE,
  );
  assert.deepEqual(rs.map((r) => r.decision).sort(), ['auto', 'review']);
});
