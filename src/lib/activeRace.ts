import { getActiveRace, getAllRaces } from '@/services/race.service';
import { calendarEntry, isRaceOver } from '@/data/calendar-2026';

// ── Active Race Override ──────────────────────────────────────────────────────
// To pin the site to a specific race (e.g. for a launch or preview), set
// ACTIVE_RACE_SLUG in your .env.local. 
// If not set, the site auto-rotates based on race_date.
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Get the current active race slug.
 * Logic:
 * 1. Environment variable override (highest priority)
 * 2. Database query for current/closest upcoming race
 * 3. Fallback to first race in DB (sorted by date)
 */
export async function getActiveRaceSlug(): Promise<string> {
  // 1. Environment override — only while that race is still to come, so a
  //    forgotten pin can't hold the site on a finished race.
  const pinned = process.env.ACTIVE_RACE_SLUG;
  const pinnedCal = pinned ? calendarEntry(pinned) : undefined;
  if (pinned && !(pinnedCal && isRaceOver(pinnedCal, new Date()))) {
    return pinned;
  }

  // 2. DB query for active/closest upcoming
  const race = await getActiveRace();
  if (race?.slug) return race.slug;

  // 3. Fallback to first race in calendar
  try {
    const all = await getAllRaces();
    if (all.length > 0) return all[0].slug;
  } catch (e) {
    console.error('Failed to fetch fallback race slug:', e);
  }

  return 'melbourne-2026'; // Absolute fallback if DB is empty or fails
}
