import { NextResponse } from 'next/server';
import { searchConsoleToken } from '@/lib/google-auth';
import { fetchSearchRows, searchWindow } from '@/lib/gsc';
import { runLoop } from '@/lib/seo-loop/run';
import { renderIssue } from '@/lib/seo-loop/ticket';
import { CALENDAR_2026 } from '@/data/calendar-2026';
import { raceKey } from '@/lib/race-url';
import { loadClicks } from '@/services/click-stats.service';

export async function GET() {
  if (process.env.VERCEL_ENV === 'production') return new NextResponse('Not found', { status: 404 });
  try {
    // 90 days, not the default 28: in Oct 2026 the site had ~14 query rows a month, too few to rank.
    const now = new Date(), window = searchWindow(now, 90), accessToken = await searchConsoleToken();
    const [gscRows, clicks] = await Promise.all([
      fetchSearchRows({ siteUrl: 'https://f1weekend.co/', ...window, accessToken }),
      loadClicks(new Date(now.getTime() - 90 * 86400000)),
    ]);
    const raceDates = Object.fromEntries(CALENDAR_2026.map((r) => [raceKey(r.slug), r.raceDate]));
    const tickets = runLoop({ gscRows, clickRows: clicks.rows, raceDates, now });
    return NextResponse.json({ window, tickets, issues: tickets.map(renderIssue) }, { headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } });
  }
}
