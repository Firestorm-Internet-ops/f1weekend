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
  /** Title of the database experience clicked (/api/click), when there is one. */
  experienceTitle?: string | null;
}

export interface TourClick {
  clickedAt: Date;
  provider: string;
  race: string | null;
  productId: string;
  title: string;
  sessionId?: string | null;
}

/** Crawlers, link previews and scripts: not people. */
const BOT = /bot\b|bot\/|crawl|spider|slurp|preview|facebookexternalhit|headless|curl\/|wget|python|axios|node-fetch|go-http|lighthouse|pingdom|uptime|monitor/i;

/** Our own and test browsers (opened once with ?internal=1); see lib/analytics. */
export const isInternalSession = (sessionId: string | null | undefined) => !!sessionId?.startsWith('internal-');

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
  /** Test clicks: from other hosts (staging, local) or internal browsers. */
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
    if ((ref.host && ref.host !== here) || isInternalSession(r.sessionId)) { elsewhere++; continue; }
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
    if (isInternalSession(c.sessionId)) continue;
    const k = `${c.provider}:${c.productId}`;
    const e = m.get(k);
    if (e) e.n++;
    else m.set(k, { ...c, n: 1 });
  }
  return [...m.values()].sort((a, b) => b.n - a.n || b.clickedAt.getTime() - a.clickedAt.getTime()).slice(0, limit);
}

export interface RecentClick {
  at: Date;
  site: string;
  race: string | null;
  page: string;
  placement: string;
  /** Short visitor id (first 6 characters of the session), to see repeat clickers. */
  visitor: string | null;
  /** The tour, when it was recorded (database experience, or a live-feed click from 5 Oct 2026). */
  tour: string | null;
}

/**
 * Every click by people on this site, newest first. The tour comes from the
 * experience (database clicks) or the matching "book_click" event (same site
 * and visitor, within a minute).
 */
export function recentClicks(rows: ClickRow[], host: string, from: Date, to: Date, tours: TourClick[] = [], limit = 100): RecentClick[] {
  const here = bareHost(host);
  return rows
    .filter((r) => r.clickedAt >= from && r.clickedAt <= to && !isBot(r.userAgent))
    .map((r) => ({ r, ref: fromReferer(r.referer) }))
    .filter(({ r, ref }) => (!ref.host || ref.host === here) && !isInternalSession(r.sessionId))
    .sort((a, b) => b.r.clickedAt.getTime() - a.r.clickedAt.getTime())
    .slice(0, limit)
    .map(({ r, ref }) => {
      const ev = tours.find((t) => t.provider === r.partner && (t.sessionId ?? null) === (r.sessionId ?? null)
        && Math.abs(t.clickedAt.getTime() - r.clickedAt.getTime()) < 60_000);
      return {
        at: r.clickedAt,
        site: r.partner ?? 'unknown',
        race: ref.race,
        page: ref.page,
        placement: PLACEMENT[r.source ?? ''] ?? r.source ?? 'unknown',
        visitor: r.sessionId ? r.sessionId.slice(0, 6) : null,
        tour: r.experienceTitle ?? ev?.title ?? null,
      };
    });
}

// ─── Daily / weekly report ─────────────────────────────────────────

export type ReportPeriod = 'daily' | 'weekly';

/** The days a report covers (UTC): yesterday, or the 7 days up to yesterday, and the same length before it. */
export function reportRange(period: ReportPeriod, now: Date) {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const days = period === 'daily' ? 1 : 7;
  const from = new Date(today - days * 86_400_000);
  const to = new Date(today - 1);
  const prevFrom = new Date(from.getTime() - days * 86_400_000);
  const prevTo = new Date(from.getTime() - 1);
  return { from, to, prevFrom, prevTo };
}

const SITE_NAMES: Record<string, string> = { getyourguide: 'GetYourGuide', viator: 'Viator', tiqets: 'Tiqets' };
const day = (d: Date) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
const cap = (k: string) => (k === 'usa' ? 'USA' : k.replace(/(^|-)([a-z])/g, (_, d, c) => `${d ? ' ' : ''}${c.toUpperCase()}`));
const line = (counts: Count[], label: (k: string) => string = (k) => k) =>
  counts.length ? counts.map((c) => `${label(c.key)} ${c.n}`).join(' · ') : 'none';

/** Markdown report of booking clicks for a day or a week, compared with the period before. */
export function clickReport(period: ReportPeriod, rows: ClickRow[], tours: TourClick[], host: string, now: Date, dashboardUrl: string): string {
  const { from, to, prevFrom, prevTo } = reportRange(period, now);
  const s = summarize(rows, host, from, to);
  const prev = summarize(rows, host, prevFrom, prevTo);
  const all = recentClicks(rows, host, from, to, tours, Infinity);
  const list = all.slice(0, period === 'daily' ? 50 : 30);
  const top = toursClicked(all, 10);
  const diff = s.clicks - prev.clicks;
  const when = period === 'daily' ? day(from) : `${day(from)} – ${day(to)}`;
  const out = [
    `## ${period === 'daily' ? 'Daily' : 'Weekly'} booking clicks: ${when}`,
    '',
    `**${s.clicks} click${s.clicks === 1 ? '' : 's'}** by **${s.people} ${s.people === 1 ? 'person' : 'people'}** on ${host} ` +
      `(${period === 'daily' ? 'day' : 'week'} before: ${prev.clicks}, ${diff >= 0 ? '+' : ''}${diff}). ` +
      `Left out: ${s.bots} bot and ${s.elsewhere} test click${s.elsewhere === 1 ? '' : 's'}.`,
    '',
    `- **Booking sites:** ${line(s.bySite, (k) => SITE_NAMES[k] ?? k)}`,
    `- **Races:** ${line(s.byRace, cap)}`,
    `- **Pages:** ${line(s.byPage, cap)}`,
    `- **Placement:** ${line(s.byPlacement)}`,
  ];
  if (period === 'weekly' && top.length) {
    out.push('', '**Most clicked tours**', '', ...top.map((t) => `- ${t.tour} (${SITE_NAMES[t.site] ?? t.site}${t.race ? `, ${cap(t.race)}` : ''}): ${t.n}`));
  }
  if (list.length) {
    out.push('', '| When (UTC) | Tour | Site | Race | Page | Placement |', '|---|---|---|---|---|---|',
      ...list.map((c) => `| ${c.at.toISOString().slice(0, 16).replace('T', ' ')} | ${(c.tour ?? 'not recorded').replace(/\|/g, '/')} | ${SITE_NAMES[c.site] ?? c.site} | ${c.race ? cap(c.race) : '—'} | ${cap(c.page)} | ${c.placement} |`));
  }
  out.push('', `A click is a visitor going to the booking site; bookings and commission show in the GetYourGuide, Viator and Tiqets dashboards (campaign IDs \`f1-<race>-<page>\`). Dashboard: ${dashboardUrl}`);
  return out.join('\n');
}

/** Most clicked tours among counted clicks (people, this site, not internal), most first. */
export function toursClicked(clicks: RecentClick[], limit = 20): { tour: string; site: string; race: string | null; n: number }[] {
  const m = new Map<string, { tour: string; site: string; race: string | null; n: number }>();
  for (const c of clicks) {
    if (!c.tour) continue;
    const k = `${c.site}:${c.tour}`;
    const e = m.get(k);
    if (e) e.n++;
    else m.set(k, { tour: c.tour, site: c.site, race: c.race, n: 1 });
  }
  return [...m.values()].sort((a, b) => b.n - a.n || a.tour.localeCompare(b.tour)).slice(0, limit);
}
