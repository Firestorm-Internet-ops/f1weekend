export type SessionStatus = 'upcoming' | 'live' | 'completed';

// Day → AEDT date (UTC+11) for Melbourne 2026
export const DAY_DATES: Record<string, string> = {
  Thursday: '2026-03-05',
  Friday:   '2026-03-06',
  Saturday: '2026-03-07',
  Sunday:   '2026-03-08',
};

/** Get session status relative to now (AEDT = UTC+11). */
export function getSessionStatus(
  day: string,
  startTime: string,
  endTime: string,
): SessionStatus {
  const dateStr = DAY_DATES[day];
  if (!dateStr) return 'upcoming';

  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);

  const offsetMs = 11 * 60 * 60 * 1000;
  const startUtcMs =
    Date.parse(
      `${dateStr}T${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')}:00.000Z`,
    ) - offsetMs;
  const endUtcMs =
    Date.parse(
      `${dateStr}T${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}:00.000Z`,
    ) - offsetMs;
  const nowMs = Date.now();

  if (nowMs >= endUtcMs) return 'completed';
  if (nowMs >= startUtcMs) return 'live';
  return 'upcoming';
}

/** Progress 0–100 for a live session. */
export function getSessionProgress(
  day: string,
  startTime: string,
  endTime: string,
): number {
  const dateStr = DAY_DATES[day];
  if (!dateStr) return 0;

  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);

  const offsetMs = 11 * 60 * 60 * 1000;
  const startUtcMs =
    Date.parse(
      `${dateStr}T${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')}:00.000Z`,
    ) - offsetMs;
  const endUtcMs =
    Date.parse(
      `${dateStr}T${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}:00.000Z`,
    ) - offsetMs;
  const nowMs = Date.now();

  const progress = ((nowMs - startUtcMs) / (endUtcMs - startUtcMs)) * 100;
  return Math.max(0, Math.min(100, progress));
}
