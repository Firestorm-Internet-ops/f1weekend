import { isBot, isInternalSession, type ClickRow } from '../click-stats';
import { findOpportunities, pageTickets, type LoopContext } from './opportunities';
import { mergeRows, type GscRow } from './rows';
import { normalizePath } from './paths';
export function bookingClicksByPath(rows: ClickRow[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const path = normalizePath(row.referer);
    if (isBot(row.userAgent) || isInternalSession(row.sessionId) || !path) continue;
    counts[path] = (counts[path] ?? 0) + 1;
  }
  return counts;
}
export function runLoop({ gscRows, clickRows, raceDates, now }: { gscRows: GscRow[]; clickRows: ClickRow[]; raceDates: Record<string, string>; now: Date }) {
  const ctx: LoopContext = { now, raceDates, bookingClicks: bookingClicksByPath(clickRows) };
  return pageTickets(findOpportunities(mergeRows(gscRows), ctx), now);
}
