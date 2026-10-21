import { test } from 'node:test';
import assert from 'node:assert/strict';
import { draftAnswers, parseDraft } from '../../src/lib/seo-loop/draft';
import type { Brief } from '../../src/lib/seo-loop/brief';

const brief: Brief = {
  path: '/races/belgium/getting-there',
  raceKey: 'belgium',
  queries: ['closest airport to belgium grand prix'],
  facts: ['The nearest airports are Liège (about 60 km) and Brussels (about 140 km).'],
  allowedNumbers: ['140', '60'],
  prompt: 'BRIEF PROMPT',
};

const GOOD = JSON.stringify([{
  id: 'closest-airport',
  q: 'What is the closest airport to the Belgian Grand Prix?',
  a: 'Liège is the closest airport to the Belgian Grand Prix, about 60 km from the track. Brussels is the bigger airport, about 140 km away. Most fans fly into one of the two, then drive or take a shuttle bus. Book the car or the bus early, because both sell out.',
  searches: ['closest airport to belgium grand prix'],
}]);
const BAD = GOOD.replace('about 60 km', 'about 65 km');

test('parse: plain JSON, or JSON inside a ```json fence', () => {
  assert.equal(parseDraft(GOOD).length, 1);
  assert.equal(parseDraft('Here you go:\n```json\n' + GOOD + '\n```\n').length, 1);
  assert.throws(() => parseDraft('not json'));
  assert.throws(() => parseDraft('{"id":"x"}'), /array/i);
});

test('passes on the first try: one call, the brief prompt as is', async () => {
  const prompts: string[] = [];
  const r = await draftAnswers(brief, async (p) => { prompts.push(p); return GOOD; });
  assert.equal(r.status, 'passed');
  assert.equal(r.attempts, 1);
  assert.equal(r.answers.length, 1);
  assert.deepEqual(prompts, ['BRIEF PROMPT']);
});

test('a failed draft is sent back with its problems, and the rewrite passes', async () => {
  const prompts: string[] = [];
  const replies = [BAD, GOOD];
  const r = await draftAnswers(brief, async (p) => { prompts.push(p); return replies.shift()!; });
  assert.equal(r.status, 'passed');
  assert.equal(r.attempts, 2);
  assert.ok(prompts[1].startsWith('BRIEF PROMPT'));
  assert.match(prompts[1], /closest-airport: number 65/);
});

test('after 3 failed attempts it stops and hands over to a person', async () => {
  let calls = 0;
  const r = await draftAnswers(brief, async () => { calls++; return BAD; });
  assert.equal(calls, 3);
  assert.equal(r.status, 'failed');
  assert.equal(r.attempts, 3);
  assert.ok(r.problems.some((p) => p.includes('number 65')));
});

test('a reply that is not JSON counts as a failed attempt with a "json" problem', async () => {
  const replies = ['sorry, I cannot', GOOD];
  const prompts: string[] = [];
  const r = await draftAnswers(brief, async (p) => { prompts.push(p); return replies.shift()!; });
  assert.equal(r.status, 'passed');
  assert.match(prompts[1], /all: json/);
});

test('maxAttempts can be lowered', async () => {
  let calls = 0;
  await draftAnswers(brief, async () => { calls++; return BAD; }, { maxAttempts: 1 });
  assert.equal(calls, 1);
});
