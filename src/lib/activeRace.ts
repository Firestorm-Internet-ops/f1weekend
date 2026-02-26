// Returns the slug for the currently active race based on current time.
// Melbourne ends at 23:59:59 AEDT on Mar 8 2026, then Shanghai becomes active.
export function getActiveRaceSlug(): string {
  const now = new Date();
  const MELBOURNE_END = new Date('2026-03-08T23:59:59+11:00');
  return now < MELBOURNE_END ? 'melbourne-2026' : 'shanghai-2026';
}

export function getNextRaceSlug(): string | null {
  const now = new Date();
  const MELBOURNE_END = new Date('2026-03-08T23:59:59+11:00');
  return now < MELBOURNE_END ? 'shanghai-2026' : null;
}
