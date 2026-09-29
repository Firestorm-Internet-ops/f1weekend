import { test } from 'node:test';
import assert from 'node:assert/strict';
import { correctContent } from './content-corrections';
import { OVERTAKING_2026_FAQ } from '@/data/faqs-2026';

test('drops DRS circuit facts and sentences', () => {
  const meta = { circuit_facts: { 'Lap Record': '1:27.097', 'DRS Zones': '2', Turns: '18' } };
  assert.deepEqual(correctContent('singapore-2026', meta), { circuit_facts: { 'Lap Record': '1:27.097', Turns: '18' } });
  const text = 'Hangar Straight is fast. Two DRS zones help overtaking. Bring ear plugs.';
  assert.equal(correctContent('singapore-2026', text), 'Hangar Straight is fast. Bring ear plugs.');
});

test('replaces FAQ items about DRS with the 2026 overtaking FAQ, in the same shape', () => {
  const faqs = [{ q: 'How many DRS zones are there?', a: 'Two.' }, { q: 'Where do I park?', a: 'Lot B.' }, { q: 'Where is DRS used?', a: 'Hangar.' }];
  assert.deepEqual(correctContent('britain-2026', faqs), [OVERTAKING_2026_FAQ, { q: 'Where do I park?', a: 'Lot B.' }]);
  const ld = { mainEntity: [{ '@type': 'Question', name: 'Does Silverstone have DRS zones?', acceptedAnswer: { '@type': 'Answer', text: 'Two.' } }] };
  const out = correctContent('britain-2026', ld);
  assert.equal(out.mainEntity[0].name, OVERTAKING_2026_FAQ.q);
  assert.equal((out.mainEntity[0].acceptedAnswer as { text: string }).text, OVERTAKING_2026_FAQ.a);
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

test('Sepang FAQs take session times from the timetable', async () => {
  const { codeFaqs } = await import('@/data/faqs-2026');
  const faqs = codeFaqs('bahrain-2026') ?? [];
  assert.ok(faqs.length >= 6);
  const time = faqs.find((f) => /What time/.test(f.q))!;
  assert.match(time.a, /Sunday 15:00/);
  assert.match(time.a, /Saturday 16:00/);
  assert.equal(codeFaqs('singapore-2026'), null);
});
