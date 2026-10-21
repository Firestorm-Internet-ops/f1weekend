import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXPERIMENT_VERDICT_DATE, experimentLockUntil, publishedAnswers, type LoopAnswer } from '../../src/lib/seo-loop/publish';

const now = new Date('2026-10-21T00:00:00Z');
const answer = (over: Partial<LoopAnswer>): LoopAnswer => ({
  path: '/races/belgium/getting-there',
  id: 'driving-from-uk',
  q: 'Can you drive to Spa-Francorchamps from the UK?',
  a: 'Yes.',
  searches: ['driving to spa francorchamps from uk'],
  approved: true,
  approvedBy: 'jamshed-v-rajan',
  drafted: '2026-10-22',
  ...over,
});

test('the verdict date of the autumn experiment', () => {
  assert.equal(EXPERIMENT_VERDICT_DATE, '2026-12-07');
});

test('races in the experiment (src/data/seo-experiments.ts) are locked until the verdict, others never', () => {
  for (const key of ['singapore', 'usa', 'mexico', 'brazil', 'las-vegas', 'qatar', 'abu-dhabi']) {
    assert.equal(experimentLockUntil(key, now), '2026-12-07', key);
  }
  assert.equal(experimentLockUntil('belgium', now), null);
  assert.equal(experimentLockUntil(null, now), null); // the homepage and other non-race pages
  assert.equal(experimentLockUntil('usa', new Date('2026-12-07T00:00:00Z')), null); // lock ends on the day
});

test('a page shows only approved answers written for that exact page', () => {
  const drafts = [
    answer({ id: 'a' }),
    answer({ id: 'b', approved: false, approvedBy: null }),
    answer({ id: 'c', path: '/races/belgium' }),
  ];
  assert.deepEqual(publishedAnswers('/races/belgium/getting-there', drafts, now).map((a) => a.id), ['a']);
});

test('approved but with no named approver is not published', () => {
  assert.deepEqual(publishedAnswers('/races/belgium/getting-there', [answer({ approvedBy: null })], now), []);
});

test('nothing is published on an experiment race before the verdict, even if approved', () => {
  const vegas = answer({ path: '/races/las-vegas', id: 'v' });
  assert.deepEqual(publishedAnswers('/races/las-vegas', [vegas], now), []);
  assert.deepEqual(publishedAnswers('/races/las-vegas', [vegas], new Date('2026-12-08T00:00:00Z')).map((a) => a.id), ['v']);
});
