/**
 * Corrections applied to editorial content read from the database
 * (race_content), so known factual errors never reach a page even before the
 * stored text is rewritten.
 *
 *  - DRS was removed from Formula 1 under the 2026 rules: "DRS Zones" facts
 *    and sentences mentioning it are dropped, and an FAQ about DRS is replaced
 *    by one about the 2026 overtaking rules (in the same shape).
 *  - Per-race fixes for claims that are simply wrong.
 */

import { OVERTAKING_2026_FAQ } from '@/data/faqs-2026';

interface Fix {
  pattern: RegExp;
  replacement: string;
}

const DRS = /\bDRS\b/;

const RACE_FIXES: Record<string, Fix[]> = {
  'britain-2026': [
    // Silverstone has no railway station.
    {
      pattern: /(?<=^|[.!?]\s)[^.!?]*\b\d+[- ]minute train\b[^.!?]*(?:Oxford|London)[^.!?]*[.!?]/gi,
      replacement:
        'Silverstone has no railway station: Oxford is about 50 minutes away by car, and trains to London leave from Milton Keynes Central (35–50 minutes to Euston).',
    },
    // Althorp House is about 40 minutes from the circuit by car, not 15.
    { pattern: /(Althorp[^.!?]*?)\b15[- ]minutes?\b/gi, replacement: '$1about 40 minutes' },
  ],
};

/** Removes sentences that mention DRS from a paragraph. */
function dropDrsSentences(text: string): string {
  if (!DRS.test(text)) return text;
  const sentences = text.match(/[^.!?]+[.!?]+\s*|[^.!?]+$/g) ?? [text];
  return sentences.filter((s) => !DRS.test(s)).join('').trim();
}

function correctString(text: string, fixes: Fix[]): string {
  let out = text;
  for (const f of fixes) out = out.replace(f.pattern, f.replacement);
  return dropDrsSentences(out);
}

const isDrsQuestion = (item: unknown): item is Record<string, unknown> =>
  !!item && typeof item === 'object' && !Array.isArray(item) &&
  Object.values(item).some((x) => typeof x === 'string' && DRS.test(x) && x.trim().endsWith('?'));

/** The 2026 overtaking FAQ in the shape of the item it replaces. */
function overtakingFaqLike(item: Record<string, unknown>): Record<string, unknown> {
  const { q, a } = OVERTAKING_2026_FAQ;
  if ('acceptedAnswer' in item) return { '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } };
  if ('question' in item) return { question: q, answer: a };
  return { q, a };
}

/**
 * Deep-corrects a content value: strings are fixed, keys about DRS are
 * dropped (e.g. { "DRS Zones": "2" }) and a DRS question is replaced by the
 * 2026 overtaking FAQ (once per list).
 */
export function correctContent<T>(raceSlug: string, value: T): T {
  const fixes = RACE_FIXES[raceSlug] ?? [];
  const walk = (v: unknown): unknown => {
    if (typeof v === 'string') return correctString(v, fixes);
    if (Array.isArray(v)) {
      let replaced = false;
      return v.flatMap((item) => {
        if (!isDrsQuestion(item)) return [walk(item)];
        if (replaced) return [];
        replaced = true;
        return [overtakingFaqLike(item)];
      });
    }
    if (v && typeof v === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, x] of Object.entries(v)) {
        if (DRS.test(k)) continue;
        out[k] = walk(x);
      }
      return out;
    }
    return v;
  };
  return walk(value) as T;
}
