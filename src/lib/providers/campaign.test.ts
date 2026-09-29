import { test } from 'node:test';
import assert from 'node:assert/strict';
import { campaignId, pageFromPath, resolveCampaignPage } from './campaign';

test('campaign ID is f1-{race}-{page}, race without the year', () => {
  assert.equal(campaignId('bahrain-2026', 'experiences'), 'f1-bahrain-experiences');
  assert.equal(campaignId('abu-dhabi-2026', 'itinerary'), 'f1-abu-dhabi-itinerary');
  assert.equal(campaignId('las-vegas-2027', 'home'), 'f1-las-vegas-home');
  assert.equal(campaignId(null, 'other'), 'f1-site-other');
});

test('page names from paths', () => {
  const cases: [string, string][] = [
    ['/', 'home'],
    ['/races/bahrain-2026', 'race'],
    ['/races/bahrain-2026/', 'race'],
    ['/races/bahrain-2026/experiences', 'experiences'],
    ['/races/bahrain-2026/experiences?sort=price', 'experiences'],
    ['/races/monaco-2026/experiences/monaco-bus', 'experience'],
    ['/races/monaco-2026/experiences/map', 'map'],
    ['/races/bahrain-2026/schedule', 'schedule'],
    ['/races/bahrain-2026/getting-there', 'getting-there'],
    ['/races/britain-2026/tips', 'tips'],
    ['/itinerary', 'itinerary'],
    ['/itinerary/Deo4twamH3Dd', 'itinerary'],
    ['/f1-2026', 'calendar'],
    ['/experiences', 'experiences'],
    ['/about', 'other'],
  ];
  for (const [path, page] of cases) assert.equal(pageFromPath(path), page, path);
});

test('page: the browser param, else the Referer, else itinerary for itinerary clicks', () => {
  assert.equal(resolveCampaignPage('home', 'https://f1weekend.co/races/x', 'feed'), 'home');
  assert.equal(resolveCampaignPage('bogus', 'https://f1weekend.co/races/bahrain-2026/experiences', 'feed'), 'experiences');
  assert.equal(resolveCampaignPage(null, null, 'itinerary'), 'itinerary');
  assert.equal(resolveCampaignPage(null, 'not a url', 'feed'), 'other');
});
