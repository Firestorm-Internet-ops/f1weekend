import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CLUSTER_TOPICS, clusterHub, clusterLinks, clusterPage, clusterTopics } from './clusters-2026';
import { campaignId, pageFromPath } from '@/lib/providers/campaign';
import type { Race, Session } from '@/types/race';

const race: Race = {
  id: 9, slug: 'mexico-2026', name: 'Mexico City Grand Prix', season: 2026, round: 19,
  circuitName: 'Autódromo Hermanos Rodríguez', city: 'Mexico City', country: 'Mexico', countryCode: 'MX',
  circuitLat: 19.4042, circuitLng: -99.0907, timezone: 'America/Mexico_City', raceDate: '2026-11-01', startDate: '2026-10-30',
};
const S = (id: number, day: Session['dayOfWeek'], start: string, type: Session['sessionType'], name: string): Session =>
  ({ id, raceId: 9, name, shortName: name, dayOfWeek: day, startTime: start, endTime: start, sessionType: type });
const words = (s: string) => s.trim().split(/\s+/).length;
const withTimes = [S(1, 'Saturday', '15:00', 'qualifying', 'Qualifying'), S(2, 'Sunday', '14:00', 'race', 'Grand Prix')];

test('Mexico: three pages, every direct answer 40–60 words, unique ids and titles that fit a search result', () => {
  assert.deepEqual(clusterTopics('mexico'), [...CLUSTER_TOPICS]);
  const titles = new Set<string>();
  for (const sessions of [[], withTimes]) {
    for (const topic of CLUSTER_TOPICS) {
      const page = clusterPage('mexico', topic, { race, sessions })!;
      assert.equal(page.topic, topic);
      assert.ok(`${page.title} | F1 Weekend`.length <= 90, `${topic} title: ${page.title.length}`);
      assert.ok(page.description.length <= 230, `${topic} description: ${page.description.length}`);
      assert.ok(page.sources.length > 0 && page.searches.length > 0, topic);
      assert.equal(new Set(page.sections.map((s) => s.id)).size, page.sections.length, topic);
      for (const s of page.sections) {
        const n = words(s.answer);
        assert.ok(n >= 40 && n <= 60, `${topic}#${s.id}: ${n} words`);
      }
      titles.add(page.title);
    }
  }
  assert.equal(titles.size, CLUSTER_TOPICS.length);
});

test('parade-and-qualifying uses the published times, and says "afternoon" before they exist', () => {
  const timed = clusterPage('mexico', 'day-of-the-dead', { race, sessions: withTimes })!;
  assert.match(timed.sections.find((s) => s.id === 'parade-and-qualifying')!.answer, /Qualifying is at 15:00 on Saturday/);
  assert.match(timed.sections.find((s) => s.id === 'after-the-race')!.answer, /Grand Prix at 14:00 is on Sunday 1 November/);
  const untimed = clusterPage('mexico', 'day-of-the-dead', { race, sessions: [] })!;
  assert.match(untimed.sections.find((s) => s.id === 'parade-and-qualifying')!.answer, /Qualifying is in the afternoon on Saturday/);
  assert.doesNotMatch(untimed.sections.find((s) => s.id === 'after-the-race')!.answer, /\d\d:\d\d/);
});

test('the parade is an Event on 31 October at noon, Mexico City time', () => {
  const page = clusterPage('mexico', 'day-of-the-dead', { race, sessions: [] })!;
  const ev = page.ld![0] as { '@type': string; startDate: string; isAccessibleForFree: boolean };
  assert.equal(ev['@type'], 'Event');
  assert.equal(ev.startDate, '2026-10-31T12:00:00-06:00');
  assert.equal(ev.isAccessibleForFree, true);
});

test('links cover every page plus Getting There; other races and paths have none', () => {
  const links = clusterLinks('mexico')!;
  assert.deepEqual(links.map((l) => l.path).sort(), [...CLUSTER_TOPICS, 'getting-there'].sort());
  assert.match(clusterHub('mexico', race)!.title, /^F1 Mexico City 2026: Schedule, Day of the Dead/);
  for (const other of ['singapore', 'usa', 'brazil']) {
    assert.equal(clusterLinks(other), null);
    assert.equal(clusterHub(other, race), null);
    assert.deepEqual(clusterTopics(other), []);
    assert.equal(clusterPage(other, 'day-of-the-dead', { race, sessions: [] }), null);
  }
  assert.equal(clusterPage('mexico', 'getting-there', { race, sessions: [] }), null);
  assert.equal(clusterPage('mexico', 'nonsense', { race, sessions: [] }), null);
});

test('bookings from each page carry its own campaign ID', () => {
  for (const topic of CLUSTER_TOPICS) {
    assert.equal(campaignId('mexico-2026', pageFromPath(`/races/mexico/${topic}`)), `f1-mexico-${topic}`);
  }
});

test('Day of the Dead tours: festival titles match; places only fill, and never party boats', () => {
  const { feed } = clusterPage('mexico', 'day-of-the-dead', { race, sessions: [] })!;
  assert.ok(feed!.match.test('Day of the Dead Night Tour in Mixquic'));
  assert.ok(feed!.match.test('CDMX: Día de Muertos Catrina Makeup Experience'));
  assert.ok(!feed!.match.test('Xochimilco Boat Party with Unlimited Drinks'));
  assert.ok(!feed!.match.test('La Catrina & Muralism: Diego Rivera’s Legacy & Frida Kahlo'));
  assert.equal(feed!.hideFits, true);
  assert.ok(feed!.fill!.test('Xochimilco, Coyoacán and Frida Kahlo Museum Tour'));
  assert.ok(!feed!.fill!.test('Xochimilco Boat Party with Unlimited Drinks'));
});

test('where-to-stay tours: food and walking tours, never party tours', () => {
  const { feed } = clusterPage('mexico', 'where-to-stay', { race, sessions: [] })!;
  assert.ok(feed!.match.test('Roma & Condesa Street Food Tour'));
  assert.ok(feed!.match.test('Historic Downtown Walking Tour'));
  assert.ok(!feed!.match.test('Xochimilco Mezcal Party: Culture, Flavor and Fun'));
  assert.ok(!feed!.match.test('Condesa Pub Crawl'));
});
