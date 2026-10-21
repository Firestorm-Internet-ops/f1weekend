import type { Brief } from './brief';
export type DraftAnswer = { id: string; q: string; a: string; searches: string[] };
export function numbersIn(text: string): string[] { return [...text.matchAll(/\d+(?:[.,:]\d+)*/g)].map((m) => m[0].replace(/,/g, '')); }
const words = (s: string) => s.split(/\s+/).filter((w) => /[\p{L}\d]/u.test(w));
function syllables(token: string): number {
  const s = token.toLowerCase().replace(/[^\p{L}]/gu, '');
  const groups = s.match(/[aeiouyáéíóúüàèìòùâêîôûäëïöÿ]+/gi)?.length ?? 0;
  return Math.max(1, groups - (groups > 1 && /e$/i.test(s) ? 1 : 0));
}
export function readingGrade(text: string): number {
  const ws = words(text), sentences = Math.max(1, (text.match(/[.!?]+(?=\s|$)/g) ?? []).length);
  return .39 * ws.length / sentences + 11.8 * ws.reduce((n, w) => n + syllables(w), 0) / Math.max(1, ws.length) - 15.59;
}
export function checkAnswers(answers: DraftAnswer[], brief: Brief): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  if (answers.length < 1 || answers.length > 5) problems.push(`all: count ${answers.length} (need 1–5)`);
  const ids = new Set<string>();
  for (const item of answers) {
    const id = typeof item.id === 'string' ? item.id : 'undefined';
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id) || ids.has(id)) problems.push(`${id}: id invalid or duplicate`); ids.add(id);
    if (typeof item.q !== 'string' || !item.q.endsWith('?') || item.q.length > 90) problems.push(`${id}: question must end in ? and be at most 90 characters`);
    const count = typeof item.a === 'string' ? words(item.a).length : 0;
    if (count < 40 || count > 60) problems.push(`${id}: words ${count} (need 40–60)`);
    for (const number of numbersIn(`${item.q ?? ''} ${item.a ?? ''}`)) if (!brief.allowedNumbers.includes(number)) problems.push(`${id}: number ${number} is not in the facts`);
    if (/—| – /.test(`${item.q ?? ''} ${item.a ?? ''}`)) problems.push(`${id}: dash use a plain hyphen instead`);
    if (/delve|nestled|tapestry|unforgettable|look no further|whether you're|in today's|embark|bustling|vibrant|game-changer|it's worth noting/i.test(`${item.q ?? ''} ${item.a ?? ''}`)) problems.push(`${id}: phrase banned phrase used`);
    if (!Array.isArray(item.searches) || !item.searches.length || item.searches.some((q) => !brief.queries.includes(q))) problems.push(`${id}: searches must match at least one brief query`);
    if (typeof item.a === 'string' && readingGrade(item.a) > 10) problems.push(`${id}: grade above 10`);
  }
  return { ok: problems.length === 0, problems };
}
