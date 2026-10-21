import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planIssueActions, renderIssue, ticketKey } from '../../src/lib/seo-loop/ticket';
import type { PageTicket } from '../../src/lib/seo-loop/opportunities';

const ticket = (over: Partial<PageTicket> = {}): PageTicket => ({
  path: '/races/belgium/getting-there',
  raceKey: 'belgium',
  score: 31,
  blockedUntil: null,
  opportunities: [
    { type: 'weak-match', query: 'f1 spa place', path: '/races/belgium/getting-there', impressions: 21, clicks: 0, position: 90.9047, score: 21 },
    { type: 'weak-match', query: 'driving to spa francorchamps from uk', path: '/races/belgium/getting-there', impressions: 10, clicks: 0, position: 74.4, score: 10 },
  ],
  ...over,
});

test('the key that finds a page\'s issue again next week', () => {
  assert.equal(ticketKey('/races/belgium/getting-there'), 'seo-loop:/races/belgium/getting-there');
});

test('issue: title, label, hidden key, live link, one table row per search, the draft command', () => {
  const issue = renderIssue(ticket());
  assert.equal(issue.title, 'SEO loop: /races/belgium/getting-there (2 searches)');
  assert.deepEqual(issue.labels, ['seo-loop']);
  assert.ok(issue.body.includes('<!-- seo-loop:/races/belgium/getting-there -->'));
  assert.ok(issue.body.includes('https://f1weekend.co/races/belgium/getting-there'));
  assert.ok(issue.body.includes('| f1 spa place | weak-match | 21 | 0 | 90.9 |'));
  assert.ok(issue.body.includes('| driving to spa francorchamps from uk | weak-match | 10 | 0 | 74.4 |'));
  assert.ok(issue.body.includes('npm run seo:draft -- --path /races/belgium/getting-there'));
  assert.ok(!issue.body.includes('Blocked'));
});

test('a single search says "1 search"', () => {
  const t = ticket();
  assert.equal(renderIssue({ ...t, opportunities: t.opportunities.slice(0, 1) }).title, 'SEO loop: /races/belgium/getting-there (1 search)');
});

test('an experiment page says it is blocked and gives no draft command', () => {
  const issue = renderIssue(ticket({ path: '/races/las-vegas', raceKey: 'las-vegas', blockedUntil: '2026-12-07' }));
  assert.ok(issue.body.includes('Blocked until 2026-12-07 (SEO experiment)'));
  assert.ok(!issue.body.includes('npm run seo:draft'));
});

test('plan: create when no open issue has the key, update the one that has it', () => {
  const belgium = ticket();
  const canada = ticket({ path: '/races/canada', raceKey: 'canada' });
  const actions = planIssueActions(
    [
      { number: 7, body: 'old table\n<!-- seo-loop:/races/belgium/getting-there -->' },
      { number: 9, body: 'some unrelated issue' },
    ],
    [belgium, canada],
  );
  assert.deepEqual(actions.map((a) => [a.action, a.action === 'update' ? a.number : null, a.ticket.path]), [
    ['update', 7, '/races/belgium/getting-there'],
    ['create', null, '/races/canada'],
  ]);
});

test('a key that is a prefix of another page does not match it', () => {
  const actions = planIssueActions([{ number: 3, body: '<!-- seo-loop:/races/belgium/getting-there -->' }], [ticket({ path: '/races/belgium', raceKey: 'belgium' })]);
  assert.equal(actions[0].action, 'create');
});
