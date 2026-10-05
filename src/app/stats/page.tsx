import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { and, eq, gte } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { affiliate_clicks, events } from '@/lib/db/schema';
import { providerName } from '@/lib/providers/meta';
import { summarize, topTours, type ClickRow, type Count, type TourClick } from '@/lib/click-stats';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { absolute: 'Booking clicks | F1 Weekend' },
  robots: { index: false, follow: false },
};

const RANGES = [7, 30, 90] as const;

const PAGE_LABELS: Record<string, string> = {
  home: 'Home', race: 'Race page', experiences: 'Experiences', experience: 'One experience', map: 'Map', schedule: 'Schedule',
  'getting-there': 'Getting There', tips: 'Tips', itinerary: 'Itinerary', calendar: '2026 calendar', other: 'Other',
  'day-of-the-dead': 'Day of the Dead', 'where-to-stay': 'Where to stay', 'weather-what-to-pack': 'Weather & packing', unknown: 'Unknown (no referrer)',
};

const SITE_LABEL = (k: string) => (k === 'unknown' ? 'Unknown' : providerName(k));
const titleCase = (k: string) => k.replace(/(^|-)([a-z])/g, (_, d, c) => `${d ? ' ' : ''}${c.toUpperCase()}`);

/**
 * /stats: who clicked "Check availability", from which page, race and site.
 * Production needs ?key=<STATS_KEY>; staging and local open without one.
 */
export default async function StatsPage({ searchParams }: { searchParams: Promise<{ key?: string; days?: string }> }) {
  const { key, days: daysParam } = await searchParams;
  if (process.env.VERCEL_ENV === 'production' && (!process.env.STATS_KEY || key !== process.env.STATS_KEY)) notFound();

  const days = RANGES.find((d) => String(d) === daysParam) ?? 30;
  const to = new Date();
  const from = new Date(to.getTime() - (days - 1) * 86_400_000);
  from.setUTCHours(0, 0, 0, 0);
  const host = (await headers()).get('host') ?? 'f1weekend.co';

  let rows: ClickRow[] = [];
  let tours: TourClick[] = [];
  let error: string | null = null;
  try {
    const db = await getDb();
    const raw = await db
      .select({
        clickedAt: affiliate_clicks.clicked_at, partner: affiliate_clicks.affiliate_partner, source: affiliate_clicks.source,
        sessionId: affiliate_clicks.session_id, userAgent: affiliate_clicks.user_agent, referer: affiliate_clicks.referer,
      })
      .from(affiliate_clicks)
      .where(gte(affiliate_clicks.clicked_at, from));
    rows = raw.map((r) => ({ ...r, clickedAt: new Date(r.clickedAt ?? 0) }));
    try {
      const ev = await db
        .select({ createdAt: events.created_at, data: events.event_data })
        .from(events)
        .where(and(eq(events.event_type, 'book_click'), gte(events.created_at, from)));
      tours = ev.flatMap((e) => {
        const d = (typeof e.data === 'string' ? JSON.parse(e.data) : e.data) as Record<string, string> | null;
        return d?.productId ? [{ clickedAt: new Date(e.createdAt ?? 0), provider: d.provider, race: d.race ?? null, productId: d.productId, title: d.title ?? d.productId }] : [];
      });
    } catch { /* events table not created yet: no clicks recorded per tour */ }
  } catch (err) {
    error = (err as Error).message;
  }

  const s = summarize(rows, host, from, to);
  const top = topTours(tours);
  const maxDay = Math.max(1, ...s.byDay.map((d) => d.n));
  const keyParam = key ? `&key=${encodeURIComponent(key)}` : '';

  return (
    <div className="min-h-screen pt-24 pb-24 px-4">
      <div className="max-w-[70rem] mx-auto">
        <p className="text-xs font-medium uppercase-label text-[var(--accent-red)] mb-2">Private · not indexed</p>
        <h1 className="font-display font-black text-4xl text-[var(--text-primary)] uppercase-heading mb-2">Booking clicks</h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-3xl mb-6">
          Clicks on the red &ldquo;Check availability&rdquo; buttons on {host}, last {days} days (UTC). Bots and clicks from other sites (staging, local) are left out.
          A click is someone going to the booking site; the booking itself shows in the GetYourGuide, Viator and Tiqets dashboards.
        </p>

        <nav className="flex gap-2 mb-8" aria-label="Range">
          {RANGES.map((d) => (
            <Link key={d} href={`/stats?days=${d}${keyParam}`}
              className={`px-4 py-1.5 rounded-full text-sm ${d === days ? 'bg-[var(--accent-red)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
              {d} days
            </Link>
          ))}
        </nav>

        {error && <p className="mb-8 rounded-xl border border-[var(--accent-red)] px-4 py-3 text-sm text-[var(--accent-red)]">Could not read the database: {error}</p>}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <Stat label="Booking clicks" value={s.clicks} />
          <Stat label="People who clicked" value={s.people} />
          <Stat label="Bot clicks left out" value={s.bots} muted />
          <Stat label="From staging / other sites" value={s.elsewhere} muted />
        </div>

        <section className="mb-10" aria-labelledby="per-day">
          <h2 id="per-day" className="font-display font-bold text-lg text-[var(--text-primary)] mb-3">Clicks per day</h2>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4 overflow-x-auto">
            <div className="flex items-end gap-1 h-40 min-w-max">
              {s.byDay.map((d) => (
                <div key={d.key} className="flex flex-col items-center justify-end h-full w-6" title={`${d.key}: ${d.n}`}>
                  {d.n > 0 && <span className="text-[10px] text-[var(--text-secondary)] mb-0.5">{d.n}</span>}
                  <div className="w-4 rounded-t bg-[var(--accent-red)]" style={{ height: `${(d.n / maxDay) * 85}%`, minHeight: d.n ? 3 : 0 }} />
                  <div className="w-4 h-px bg-[var(--border-subtle)]" />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[11px] text-[var(--text-muted)] mt-1 min-w-max gap-8">
              <span>{s.byDay[0]?.key}</span><span>{s.byDay[s.byDay.length - 1]?.key}</span>
            </div>
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <Breakdown title="By booking site" rows={s.bySite} label={SITE_LABEL} total={s.clicks} />
          <Breakdown title="By race" rows={s.byRace} label={titleCase} total={s.clicks} />
          <Breakdown title="By page" rows={s.byPage} label={(k) => PAGE_LABELS[k] ?? k} total={s.clicks} />
          <Breakdown title="By placement" rows={s.byPlacement} label={(k) => k} total={s.clicks} />
        </div>

        <section aria-labelledby="top-tours">
          <h2 id="top-tours" className="font-display font-bold text-lg text-[var(--text-primary)] mb-1">Most clicked tours</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-3">Recorded per tour from 5 Oct 2026, for races with live tours.</p>
          {top.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No tour clicks recorded yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--bg-secondary)] text-left text-[var(--text-secondary)]">
                  <tr><th className="px-3 py-2 font-medium">Tour</th><th className="px-3 py-2 font-medium">Race</th><th className="px-3 py-2 font-medium">Site</th><th className="px-3 py-2 font-medium text-right">Clicks</th></tr>
                </thead>
                <tbody>
                  {top.map((t) => (
                    <tr key={`${t.provider}:${t.productId}`} className="border-t border-[var(--border-subtle)]">
                      <td className="px-3 py-2 text-[var(--text-primary)]">{t.title}</td>
                      <td className="px-3 py-2 text-[var(--text-secondary)]">{t.race ? titleCase(t.race) : '—'}</td>
                      <td className="px-3 py-2 text-[var(--text-secondary)]">{SITE_LABEL(t.provider)}</td>
                      <td className="px-3 py-2 text-right mono-data">{t.n}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, muted = false }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4">
      <p className={`text-3xl font-bold mono-data ${muted ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>{value.toLocaleString()}</p>
      <p className="text-sm text-[var(--text-secondary)] mt-1">{label}</p>
    </div>
  );
}

function Breakdown({ title, rows, label, total }: { title: string; rows: Count[]; label: (k: string) => string; total: number }) {
  return (
    <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4">
      <h2 className="font-display font-bold text-base text-[var(--text-primary)] mb-3">{title}</h2>
      {rows.length === 0 ? <p className="text-sm text-[var(--text-muted)]">No clicks yet.</p> : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.key} className="text-sm">
              <div className="flex justify-between gap-3"><span className="text-[var(--text-primary)]">{label(r.key)}</span><span className="mono-data text-[var(--text-secondary)]">{r.n} · {Math.round((r.n / Math.max(1, total)) * 100)}%</span></div>
              <div className="h-1.5 rounded-full bg-[var(--bg-tertiary)] mt-1"><div className="h-1.5 rounded-full bg-[var(--accent-red)]" style={{ width: `${(r.n / Math.max(1, total)) * 100}%` }} /></div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
