/**
 * The /stats report: booking clicks (red "Check availability" buttons) from
 * the affiliate_clicks table, and which tours were clicked (events table,
 * "book_click"). Pure functions, tested.
 */
import { pageFromPath, type CampaignPage } from '@/lib/providers/campaign';

export interface ClickRow {
  clickedAt: Date;
  partner: string | null;
  source: string | null;
  sessionId: string | null;
  userAgent: string | null;
  referer: string | null;
}

export interface TourClick {
  clickedAt: Date;
  provider: string;
  race: string | null;
  productId: string;
  title: string;
}

/** Crawlers, link previews and scripts: not people. */
const BOT = /bot\b|bot\/|crawl|spider|slurp|preview|facebookexternalhit|headless|curl\/|wget|python|axios|node-fetch|go-http|lighthouse|pingdom|uptime|monitor/i;

export function isBot(userAgent: string | null): boolean {
  return !userAgent || BOT.test(userAgent);
}

const bareHost = (h: string) => h.toLowerCase().replace(/^www\./, '');

/** Host, race key and kind of page a click came from (by its Referer). */
export function fromReferer(referer: string | null): { host: string | null; race: string | null; page: CampaignPage | 'unknown' } {
  if (!referer) return { host: null, race: null, page: 'unknown' };
  try {
    const u = new URL(referer);
    const m = u.pathname.match(/^\/races\/([^/?#]+)/);
    return { host: bareHost(u.host), race: m ? m[1].replace(/-20\d\d$/, '') : null, page: pageFromPath(u.pathname) };
  } catch {
    return { host: null, race: null, page: 'unknown' };
  }
}

export interface Count { key: string; n: number }

export interface ClickSummary {
  /** Clicks by people on this site (or with no Referer). */
  clicks: number;
  /** Distinct visitors who clicked (session ID; clicks without one count once each). */
  people: number;
  bots: number;
  /** Clicks from other hosts (staging, local). */
  elsewhere: number;
  byDay: Count[];
  bySite: Count[];
  byRace: Count[];
  byPage: Count[];
  byPlacement: Count[];
}

function tally(keys: string[]): Count[] {
  const m = new Map<string, number>();
  for (const k of keys) m.set(k, (m.get(k) ?? 0) + 1);
  return [...m.entries()].map(([key, n]) => ({ key, n })).sort((a, b) => b.n - a.n || a.key.localeCompare(b.key));
}

const PLACEMENT: Record<string, string> = { featured: 'Picks', feed: 'Tour list', itinerary: 'Itinerary', map: 'Map', guide: 'Guide' };

/** UTC days from `from` to `to`, inclusive, as YYYY-MM-DD. */
function days(from: Date, to: Date): string[] {
  const out: string[] = [];
  for (let t = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()); t <= to.getTime(); t += 86_400_000) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

export function summarize(rows: ClickRow[], host: string, from: Date, to: Date): ClickSummary {
  const here = bareHost(host);
  let bots = 0, elsewhere = 0;
  const kept: (ClickRow & ReturnType<typeof fromReferer>)[] = [];
  for (const r of rows) {
    if (r.clickedAt < from || r.clickedAt > to) continue;
    if (isBot(r.userAgent)) { bots++; continue; }
    const ref = fromReferer(r.referer);
    if (ref.host && ref.host !== here) { elsewhere++; continue; }
    kept.push({ ...r, ...ref });
  }
  const perDay = new Map(days(from, to).map((d) => [d, 0]));
  for (const r of kept) {
    const d = r.clickedAt.toISOString().slice(0, 10);
    if (perDay.has(d)) perDay.set(d, perDay.get(d)! + 1);
  }
  const sessions = new Set(kept.map((r, i) => r.sessionId || `none:${i}`));
  return {
    clicks: kept.length,
    people: sessions.size,
    bots,
    elsewhere,
    byDay: [...perDay.entries()].map(([key, n]) => ({ key, n })),
    bySite: tally(kept.map((r) => r.partner ?? 'unknown')),
    byRace: tally(kept.map((r) => r.race ?? (r.page === 'unknown' ? 'unknown' : 'not a race page'))),
    byPage: tally(kept.map((r) => r.page)),
    byPlacement: tally(kept.map((r) => PLACEMENT[r.source ?? ''] ?? r.source ?? 'unknown')),
  };
}

/** Most clicked tours: one row per product, most clicks first. */
export function topTours(clicks: TourClick[], limit = 20): (TourClick & { n: number })[] {
  const m = new Map<string, TourClick & { n: number }>();
  for (const c of clicks) {
    const k = `${c.provider}:${c.productId}`;
    const e = m.get(k);
    if (e) e.n++;
    else m.set(k, { ...c, n: 1 });
  }
  return [...m.values()].sort((a, b) => b.n - a.n || b.clickedAt.getTime() - a.clickedAt.getTime()).slice(0, limit);
}
