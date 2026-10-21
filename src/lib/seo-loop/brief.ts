import type { PageTicket } from './opportunities';
import { numbersIn } from './qa';
export type RaceFacts = { raceKey: string; raceName: string; season: number; startDate: string; raceDate: string; facts: string[] };
export type Brief = { path: string; raceKey: string; queries: string[]; facts: string[]; allowedNumbers: string[]; prompt: string };
const dateParts = (s: string) => { const d = new Date(`${s}T00:00:00Z`); return { day: d.getUTCDate(), month: d.toLocaleString('en', { month: 'long', timeZone: 'UTC' }), year: d.getUTCFullYear() }; };
export function weekendFact(r: RaceFacts): string {
  const a = dateParts(r.startDate), b = dateParts(r.raceDate);
  return `The ${r.season} ${r.raceName} weekend is ${a.month === b.month ? `${a.day}–${b.day} ${b.month}` : `${a.day} ${a.month}–${b.day} ${b.month}`} ${b.year}.`;
}
export function buildBrief(ticket: PageTicket, facts: RaceFacts): Brief {
  if (ticket.blockedUntil) throw new Error(`Race is blocked until ${ticket.blockedUntil}`);
  if (ticket.raceKey !== facts.raceKey) throw new Error('Ticket race does not match facts race');
  const queries = [...ticket.opportunities].sort((a, b) => b.impressions - a.impressions).slice(0, 5).map((o) => o.query);
  const allFacts = [weekendFact(facts), ...facts.facts], allowedNumbers = [...new Set(allFacts.flatMap(numbersIn))].sort();
  const prompt = `Searches:\n${queries.map((q) => `- ${q}`).join('\n')}\n\nFacts:\n${allFacts.join('\n')}\n\nRules: Write 1–5 answers; each answer 40–60 words; use only the numbers in the facts; no em dashes; plain words for a grade-8 reader; avoid delve, nestled, tapestry, unforgettable, look no further, whether you're, in today's, embark, bustling, vibrant, game-changer, and it's worth noting. Reply with a JSON array of { id, q, a, searches } only.`;
  return { path: ticket.path, raceKey: facts.raceKey, queries, facts: allFacts, allowedNumbers, prompt };
}
