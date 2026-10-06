import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXPERT_GUIDES, guideSources, guideWords, liveGuide } from './expert-guides-2026';
import { authorBySlug } from './authors';
import { seoExperiment } from './seo-experiments';

test('every guide: a known author, an expert-guide race, long enough, dated', () => {
  for (const [key, g] of Object.entries(EXPERT_GUIDES)) {
    assert.ok(authorBySlug(g.author), `${key}: unknown author ${g.author}`);
    assert.equal(seoExperiment(key)?.variant, 'expert-guide', `${key} is not an expert-guide race`);
    assert.ok(guideWords(g) >= 1500, `${key}: ${guideWords(g)} words`);
    assert.match(g.lastChecked, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(g.title(2026).length <= 90, `${key}: title too long`);
  }
});

test('every section has sources with https links; tables are rectangular; ids unique', () => {
  for (const [key, g] of Object.entries(EXPERT_GUIDES)) {
    const ids = g.sections.map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length, `${key}: duplicate section ids`);
    for (const s of g.sections) {
      assert.ok(s.sources.length > 0, `${key}#${s.id}: no sources`);
      for (const src of s.sources) if (src.url) assert.match(src.url, /^https:\/\//, `${key}#${s.id}: ${src.url}`);
      for (const b of s.blocks) if ('table' in b) for (const r of b.table.rows) assert.equal(r.length, b.table.head.length, `${key}#${s.id}: row ${r[0]}`);
    }
    assert.ok(guideSources(g).length >= 10, `${key}: few sources`);
  }
});

test('Las Vegas guide: the facts that matter are there', () => {
  const g = EXPERT_GUIDES['las-vegas'];
  const text = JSON.stringify(g);
  for (const fact of ['19 to Saturday 21 November 2026', '8:00 pm', '6.201 km', '17 turns', 'Monorail', 'Grand Canyon']) {
    assert.ok(text.includes(fact), `missing: ${fact}`);
  }
  const day = g.sections.find((s) => s.tours);
  assert.ok(day?.tours?.test('Grand Canyon West Rim Day Trip'), 'day trips section offers tours');
  assert.ok(day?.toursExclude?.test('Helicopter Night Flight over the Strip'), 'night tours clash with the evening sessions');
  assert.ok(day?.toursExclude?.test('Grand Canyon, Antelope Canyon, Horseshoe Bend'), 'too far for a race day');
});

test('an unapproved guide shows on staging but not on the live site', () => {
  for (const [key, g] of Object.entries(EXPERT_GUIDES)) {
    assert.ok(liveGuide(key, 'preview'), `${key} on staging`);
    assert.equal(liveGuide(key, 'production') !== null, g.approved, `${key} in production`);
  }
  assert.equal(liveGuide('singapore', 'preview'), null);
});
