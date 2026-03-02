import { getActiveRace, getNextRace } from '@/services/race.service';

// ── Active Race Override ──────────────────────────────────────────────────────
// To pin the site to a specific race (e.g. for a launch or preview), set
// ACTIVE_RACE_SLUG in .env and uncomment the two lines below.
// Remove the comment to activate, re-comment to go back to DB-driven mode.
//
// import { RACES } from '@/lib/constants/races';
// if (process.env.ACTIVE_RACE_SLUG && RACES[process.env.ACTIVE_RACE_SLUG]) {
//   const pinned = process.env.ACTIVE_RACE_SLUG;
//   export async function getActiveRaceSlug() { return pinned; }
//   export async function getNextRaceSlug() { return null; }
// }
// ─────────────────────────────────────────────────────────────────────────────

// Returns the slug for the currently active race, derived from DB race_date.
// "Active" = race happening now or in the future (with 1-day grace period after race day).
// Falls back to the last seeded race if all races are complete.
export async function getActiveRaceSlug(): Promise<string> {
  // Uncomment to pin to a specific race (set ACTIVE_RACE_SLUG in .env):
  if (process.env.ACTIVE_RACE_SLUG) return process.env.ACTIVE_RACE_SLUG;

  const race = await getActiveRace();
  return race?.slug ?? 'melbourne-2026';
}

// Returns the slug of the race immediately after the active one, or null.
export async function getNextRaceSlug(): Promise<string | null> {
  // Uncomment to pin to a specific race (set ACTIVE_RACE_SLUG in .env):
  if (process.env.ACTIVE_RACE_SLUG) return null;

  const race = await getNextRace();
  return race?.slug ?? null;
}
