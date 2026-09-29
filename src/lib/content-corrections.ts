/**
 * Corrections applied to editorial content read from the database
 * (race_content), so known factual errors never reach a page even before the
 * stored text is rewritten.
 *
 *  - DRS was removed from Formula 1 under the 2026 rules: "DRS Zones" facts,
 *    FAQs about DRS and sentences mentioning it are dropped.
 *  - Per-race fixes for claims that are simply wrong.
 */

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

/**
 * Deep-corrects a content value: strings are fixed, objects whose key or
 * question is about DRS are dropped (e.g. { "DRS Zones": "2" }, an FAQ item).
 */
export function correctContent<T>(raceSlug: string, value: T): T {
  const fixes = RACE_FIXES[raceSlug] ?? [];
  const walk = (v: unknown): unknown => {
    if (typeof v === 'string') return correctString(v, fixes);
    if (Array.isArray(v)) {
      return v
        .filter((item) => !(item && typeof item === 'object' && Object.values(item).some((x) => typeof x === 'string' && DRS.test(x) && x.trim().endsWith('?'))))
        .map(walk);
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
