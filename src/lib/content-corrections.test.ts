import { test } from 'node:test';
import assert from 'node:assert/strict';
import { correctContent } from './content-corrections';

test('drops DRS circuit facts and sentences', () => {
  const meta = { circuit_facts: { 'Lap Record': '1:27.097', 'DRS Zones': '2', Turns: '18' } };
  assert.deepEqual(correctContent('singapore-2026', meta), { circuit_facts: { 'Lap Record': '1:27.097', Turns: '18' } });
  const text = 'Hangar Straight is fast. Two DRS zones help overtaking. Bring ear plugs.';
  assert.equal(correctContent('singapore-2026', text), 'Hangar Straight is fast. Bring ear plugs.');
});

test('drops FAQ items asking about DRS', () => {
  const faqs = [{ q: 'How many DRS zones are there?', a: 'Two.' }, { q: 'Where do I park?', a: 'Lot B.' }];
  assert.deepEqual(correctContent('britain-2026', faqs), [{ q: 'Where do I park?', a: 'Lot B.' }]);
});

test('fixes the Silverstone train claim', () => {
  const out = correctContent('britain-2026', 'Great base. From here take a 45-minute train to Oxford or London. Enjoy.');
  assert.match(out, /Silverstone has no railway station/);
  assert.doesNotMatch(out, /45-minute train/);
  assert.match(out, /^Great base\. /);
  assert.match(out, /Enjoy\.$/);
});

test('fixes the Althorp drive time', () => {
  assert.equal(
    correctContent('britain-2026', 'Althorp House, 15 minutes away, is lovely.'),
    'Althorp House, about 40 minutes away, is lovely.',
  );
});

test('leaves other races and plain text alone', () => {
  const v = { a: 'A 45-minute train to London.', n: 3, list: ['x'] };
  assert.deepEqual(correctContent('italy-2026', v), v);
});
