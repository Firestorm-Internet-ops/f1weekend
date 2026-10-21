import type { PageTicket } from './opportunities';
import { numbersIn } from './qa';
export type RaceFacts = { raceKey: string; raceName: string; season: number; startDate: string; raceDate: string; facts: string[] };
export type Brief = { path: string; raceKey: string; queries: string[]; facts: string[]; allowedNumbers: string[]; prompt: string };
const dateParts = (s: string) => { const d = new Date(`${s}T00:00:00Z`); return { day: d.getUTCDate(), month: d.toLocaleString('en', { month: 'long', timeZone: 'UTC' }), year: d.getUTCFullYear() }; };
// Over from the day after race day (UTC); past races get "was" instead of "is".
export const raceIsOver = (r: RaceFacts, now: Date) => now.getTime() >= Date.parse(`${r.raceDate}T00:00:00Z`) + 86_400_000;
export function weekendFact(r: RaceFacts, now: Date = new Date()): string {
  const a = dateParts(r.startDate), b = dateParts(r.raceDate);
  return `The ${r.season} ${r.raceName} weekend ${raceIsOver(r, now) ? 'was' : 'is'} ${a.month === b.month ? `${a.day}–${b.day} ${b.month}` : `${a.day} ${a.month}–${b.day} ${b.month}`} ${b.year}.`;
}
export function buildBrief(ticket: PageTicket, facts: RaceFacts, now: Date = new Date()): Brief {
  if (ticket.blockedUntil) throw new Error(`Race is blocked until ${ticket.blockedUntil}`);
  if (ticket.raceKey !== facts.raceKey) throw new Error('Ticket race does not match facts race');
  const queries = [...ticket.opportunities].sort((a, b) => b.impressions - a.impressions).slice(0, 5).map((o) => o.query);
  const dates = weekendFact(facts, now), allFacts = raceIsOver(facts, now) ? [...facts.facts, dates] : [dates, ...facts.facts], allowedNumbers = [...new Set(allFacts.flatMap(numbersIn))].sort();
  const prompt = `Searches:\n${queries.map((q) => `- ${q}`).join('\n')}\n\nFacts:\n${allFacts.join('\n')}\n\nRules: Answer only the searches listed; write 1–5 answers; each answer 40–60 words; use only the numbers in the facts; no em dashes; plain words for a grade-8 reader; avoid delve, nestled, tapestry, unforgettable, look no further, whether you're, in today's, embark, bustling, vibrant, game-changer, and it's worth noting. Reply with a JSON array of { id, q, a, searches } only.`;
  return { path: ticket.path, raceKey: facts.raceKey, queries, facts: allFacts, allowedNumbers, prompt };
}
