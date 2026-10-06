import { NextRequest, NextResponse } from 'next/server';
import { clickReport, reportRange, type ReportPeriod } from '@/lib/click-stats';
import { liveHost, loadClicks } from '@/services/click-stats.service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/stats-report?period=daily|weekly
 * Markdown report of yesterday's (or the last 7 days') booking clicks on the
 * live site, compared with the period before. Posted to the "Booking clicks
 * report" GitHub issue every morning by .github/workflows/click-report.yml.
 * Production needs ?key=<STATS_KEY>; staging (same database) opens without one.
 */
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  if (process.env.VERCEL_ENV === 'production' && (!process.env.STATS_KEY || key !== process.env.STATS_KEY)) {
    return new NextResponse('Not found', { status: 404 });
  }
  const period: ReportPeriod = req.nextUrl.searchParams.get('period') === 'weekly' ? 'weekly' : 'daily';
  const now = new Date();
  const { prevFrom } = reportRange(period, now);
  const { rows, tours, error } = await loadClicks(prevFrom);
  const headers = { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' };
  if (error) return new NextResponse(`Could not read the click database: ${error}`, { status: 500, headers });
  const dashboard = `${req.nextUrl.origin}/stats?days=${period === 'daily' ? 7 : 30}`;
  return new NextResponse(clickReport(period, rows, tours, liveHost(), now, dashboard), { headers });
}
