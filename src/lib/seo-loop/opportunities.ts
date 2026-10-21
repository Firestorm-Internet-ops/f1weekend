import { experimentLockUntil } from './lock';
export type OpportunityType = 'low-ctr' | 'striking-distance' | 'weak-match' | 'cannibalised';
export type Opportunity = { type: OpportunityType; query: string; path: string; impressions: number; clicks: number; position: number; score: number };
export type LoopContext = { now: Date; raceDates: Record<string, string>; bookingClicks: Record<string, number> };
export type PageTicket = { path: string; raceKey: string | null; score: number; blockedUntil: string | null; opportunities: Opportunity[] };
export function expectedCtr(position: number): number {
  const p = Math.round(position);
  if (p === 1) return .28; if (p === 2) return .15; if (p === 3) return .10; if (p === 4) return .07; if (p === 5) return .05; if (p <= 10) return .03; return .01;
}
export function classify(row: Pick<Opportunity, 'position' | 'impressions' | 'clicks'>): OpportunityType | null {
  if (row.impressions < 3) return null;
  if (row.position <= 10) return row.impressions >= 20 && row.clicks / row.impressions < .5 * expectedCtr(row.position) ? 'low-ctr' : null;
  return row.position <= 30 ? 'striking-distance' : 'weak-match';
}
export function raceKeyOfPath(path: string): string | null { return path.match(/^\/races\/([^/]+)(?:\/|$)/)?.[1] ?? null; }
const weights: Record<OpportunityType, number> = { 'low-ctr': 3, 'striking-distance': 2, cannibalised: 1.5, 'weak-match': 1 };
export function findOpportunities(rows: { query: string; path: string; impressions: number; clicks: number; position: number }[], ctx: LoopContext): Opportunity[] {
  const byQuery = new Map<string, typeof rows>();
  for (const row of rows) if (row.impressions >= 3) byQuery.set(row.query, [...(byQuery.get(row.query) ?? []), row]);
  const output: Opportunity[] = [];
  for (const row of rows) {
    const competingPaths = new Set((byQuery.get(row.query) ?? []).map((candidate) => candidate.path));
    const type = competingPaths.size >= 2 ? 'cannibalised' as const : classify(row);
    if (!type || row.impressions < 3) continue;
    const key = raceKeyOfPath(row.path), date = key ? ctx.raceDates[key] : undefined;
    const delta = date ? (Date.parse(`${date}T00:00:00Z`) - Date.UTC(ctx.now.getUTCFullYear(), ctx.now.getUTCMonth(), ctx.now.getUTCDate())) / 86400000 : Infinity;
    const soon = delta >= 0 && delta <= 60 ? 2 : 1, booked = ctx.bookingClicks[row.path] > 0 ? 2 : 1;
    output.push({ ...row, type, score: row.impressions * weights[type] * soon * booked });
  }
  return output.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path) || a.query.localeCompare(b.query));
}
export function pageTickets(opps: Opportunity[], now: Date): PageTicket[] {
  const pages = new Map<string, Opportunity[]>();
  for (const o of opps) pages.set(o.path, [...(pages.get(o.path) ?? []), o]);
  return [...pages].map(([path, opportunities]) => {
    const raceKey = raceKeyOfPath(path);
    const blockedUntil = experimentLockUntil(raceKey, now);
    return { path, raceKey, score: opportunities.reduce((n, o) => n + o.score, 0), blockedUntil, opportunities: opportunities.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path) || a.query.localeCompare(b.query)) };
  }).sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));
}
