import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkAnswers, numbersIn, readingGrade, type DraftAnswer } from '../../src/lib/seo-loop/qa';
import type { Brief } from '../../src/lib/seo-loop/brief';

const brief: Brief = {
  path: '/races/belgium/getting-there',
  raceKey: 'belgium',
  queries: ['driving to spa francorchamps from uk', 'closest airport to belgium grand prix'],
  facts: [
    'The 2026 Belgian Grand Prix weekend is 24–26 July 2026.',
    'The nearest airports are Liège (about 60 km) and Brussels (about 140 km).',
  ],
  allowedNumbers: ['140', '2026', '24', '26', '60'],
  prompt: '',
};

// 46 words, plain, only numbers from the facts.
const GOOD_A =
  'Liège is the closest airport to the Belgian Grand Prix, about 60 km from the track. Brussels is the bigger airport, about 140 km away. Most fans fly into one of the two, then drive or take a shuttle. The 2026 race weekend is 24–26 July.';

const good = (over: Partial<DraftAnswer> = {}): DraftAnswer => ({
  id: 'closest-airport',
  q: 'What is the closest airport to the Belgian Grand Prix?',
  a: GOOD_A,
  searches: ['closest airport to belgium grand prix'],
  ...over,
});

const codes = (r: { problems: string[] }) => r.problems.map((p) => p.split(' ')[1]);

test('numbers in a text, thousands commas removed, decimals and times kept', () => {
  assert.deepEqual(numbersIn('From £1,666 for 3 days, 7.004 km, gates at 4:30 pm on 24–26 July.'), ['1666', '3', '7.004', '4:30', '24', '26']);
  assert.deepEqual(numbersIn('No numbers here.'), []);
});

test('reading grade: plain text is low, dense text is high', () => {
  assert.ok(readingGrade('The race is on Sunday. Fly to Liège. Take the bus to the track. It is a short ride.') < 6);
  assert.ok(readingGrade('Notwithstanding considerable infrastructural complications, international spectators predominantly necessitate comprehensive transportation alternatives, particularly concerning intercontinental accessibility considerations.') > 14);
});

test('a good answer passes', () => {
  const r = checkAnswers([good()], brief);
  assert.deepEqual(r, { ok: true, problems: [] });
});

test('every problem is "<id>: <code> <detail>"', () => {
  const r = checkAnswers([good({ a: 'Too short.' })], brief);
  assert.equal(r.ok, false);
  assert.match(r.problems[0], /^closest-airport: words \d+/);
});

test('answer must be 40–60 words', () => {
  assert.ok(codes(checkAnswers([good({ a: 'Liège is closest, about 60 km away.' })], brief)).includes('words'));
  assert.ok(codes(checkAnswers([good({ a: `${GOOD_A} ${GOOD_A}` })], brief)).includes('words'));
});

test('a number that is not in the facts is a made-up claim', () => {
  const r = checkAnswers([good({ a: GOOD_A.replace('about 60 km', 'about 65 km') })], brief);
  assert.ok(r.problems.some((p) => p.startsWith('closest-airport: number 65')));
});

test('numbers in the question are checked too', () => {
  assert.ok(codes(checkAnswers([good({ q: 'Which airport is within 50 km of Spa?' })], brief)).includes('number'));
});

test('em dash and spaced en dash are AI tells; a date-range en dash is fine', () => {
  assert.ok(codes(checkAnswers([good({ a: GOOD_A.replace('track. Brussels', 'track — Brussels') })], brief)).includes('dash'));
  assert.ok(codes(checkAnswers([good({ a: GOOD_A.replace('track. Brussels', 'track – Brussels') })], brief)).includes('dash'));
  assert.ok(!codes(checkAnswers([good()], brief)).includes('dash')); // "24–26 July"
});

test('banned filler phrases, any case', () => {
  for (const phrase of ['Nestled', 'delve', 'unforgettable', 'Look no further', "whether you're", 'vibrant', 'bustling', 'tapestry', 'embark']) {
    const r = checkAnswers([good({ a: GOOD_A.replace('Most fans', `${phrase} most fans`) })], brief);
    assert.ok(codes(r).includes('phrase'), phrase);
  }
});

test('the question must end with "?" and be at most 90 characters', () => {
  assert.ok(codes(checkAnswers([good({ q: 'Closest airport to Spa' })], brief)).includes('question'));
  assert.ok(codes(checkAnswers([good({ q: `${'Which airport is the closest one '.repeat(3)}?` })], brief)).includes('question'));
});

test('each answer names at least one of the brief\'s searches and only those', () => {
  assert.ok(codes(checkAnswers([good({ searches: [] })], brief)).includes('searches'));
  assert.ok(codes(checkAnswers([good({ searches: ['f1 tickets cheap'] })], brief)).includes('searches'));
});

test('ids are kebab-case and unique; 1 to 5 answers', () => {
  assert.ok(codes(checkAnswers([good({ id: 'Closest_Airport' })], brief)).includes('id'));
  assert.ok(codes(checkAnswers([good(), good()], brief)).includes('id'));
  assert.deepEqual(checkAnswers([], brief), { ok: false, problems: ['all: count 0 (need 1–5)'] });
  const six = Array.from({ length: 6 }, (_, i) => good({ id: `a${i}` }));
  assert.ok(checkAnswers(six, brief).problems.includes('all: count 6 (need 1–5)'));
});

test('dense writing fails the reading-grade check (grade above 10)', () => {
  const dense =
    'Internationally originating spectators predominantly utilise Liège, approximately 60 km distant, alternatively Brussels, approximately 140 km distant, subsequently necessitating supplementary transportation arrangements, particularly considering congestion characteristics, infrastructural limitations, organisational requirements, regulatory considerations, accommodation availability, comprehensive scheduling, and intercontinental connectivity considerations during the 2026 championship weekend, 24–26 July, notwithstanding complications.';
  assert.ok(codes(checkAnswers([good({ a: dense })], brief)).includes('grade'));
});
