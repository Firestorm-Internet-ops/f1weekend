import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitIntro } from './home-intro';

test('first line is the heading, the rest the paragraph', () => {
  assert.deepEqual(splitIntro('Plan Your Weekend\nThe race runs 23–25 October.\nMore.'), {
    heading: 'Plan Your Weekend',
    body: 'The race runs 23–25 October.\nMore.',
  });
});

test('one line: a short first sentence is the heading, never the whole paragraph', () => {
  assert.deepEqual(
    splitIntro("Plan Your Austin F1 Weekend Around the Sessions. The United States Grand Prix at the Circuit of the Americas is a cornerstone of the F1 calendar. Austin's 'Keep It Weird' spirit."),
    {
      heading: 'Plan Your Austin F1 Weekend Around the Sessions',
      body: "The United States Grand Prix at the Circuit of the Americas is a cornerstone of the F1 calendar. Austin's 'Keep It Weird' spirit.",
    },
  );
});

test('one line with a long first sentence: no heading, all of it is the paragraph', () => {
  const long = 'The United States Grand Prix at the Circuit of the Americas runs from 23 to 25 October and the circuit sits southeast of downtown Austin. More text.';
  assert.deepEqual(splitIntro(long), { heading: null, body: long });
});

test('surrounding blank lines and spaces are ignored', () => {
  assert.deepEqual(splitIntro('\n  Heading  \n\n  Body text.  \n'), { heading: 'Heading', body: 'Body text.' });
});
