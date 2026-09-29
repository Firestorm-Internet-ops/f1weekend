import { NextResponse } from 'next/server';
import { getAllRaces, getAvailableRaces, getJolpicaSeason } from '@/services/race.service';
import { getActiveRaceSlug } from '@/lib/activeRace';
import { nextCalendarRace } from '@/data/calendar-2026';
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
  const today = new Date().toISOString().slice(0, 10);
  const [races, available, season, activeRace] = await Promise.all([
    getAllRaces(), getAvailableRaces(), getJolpicaSeason(2026), getActiveRaceSlug(),
  ]);
  const issues = checkSchedules(races, season, today);
  // Why the home page shows the race it shows.
  const homePage = {
    activeRace,
    calendarNext: nextCalendarRace(today)?.slug ?? null,
    pinnedByEnv: process.env.ACTIVE_RACE_SLUG ?? null, // ACTIVE_RACE_SLUG overrides everything
    availableRaces: available.map((r) => r.slug),
    notAvailable: races.filter((r) => !available.some((a) => a.slug === r.slug)).map((r) => r.slug),
  };
  return NextResponse.json(
    { homePage, jolpicaRaces: season.length, checked: races.length, ok: season.length > 0 && issues.length === 0, issues },
    { headers: { 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' } }
  );
}
