import { NextResponse } from 'next/server';
import { getAllRaces, getJolpicaSeason } from '@/services/race.service';
import { checkSchedules } from '@/lib/schedule-check';

export const dynamic = 'force-dynamic';

/**
 * GET /api/schedule-check → JSON list of races whose calendar date or
 * hand-entered timetable differs from Jolpica (the F1 timing API).
 * READ-ONLY. Disabled on production, like /api/nearby-audit.
 */
export async function GET() {
  if (process.env.VERCEL_ENV === 'production') {
    return new NextResponse('Not found', { status: 404 });
  }
  const races = await getAllRaces();
  const season = await getJolpicaSeason(2026);
  const issues = checkSchedules(races, season, new Date().toISOString().slice(0, 10));
  return NextResponse.json(
    { jolpicaRaces: season.length, checked: races.length, ok: season.length > 0 && issues.length === 0, issues },
    { headers: { 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' } }
  );
}
