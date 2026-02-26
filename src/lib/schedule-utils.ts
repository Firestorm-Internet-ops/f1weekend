export type SessionStatus = 'upcoming' | 'live' | 'completed';

/** Compute ISO date strings for Thu/Fri/Sat/Sun from race Sunday date. */
export function computeISODayDates(raceDate: string): Record<string, string> {
  const base = new Date(raceDate + 'T00:00:00Z').getTime();
  return {
    Thursday: new Date(base - 3 * 86_400_000).toISOString().split('T')[0],
    Friday:   new Date(base - 2 * 86_400_000).toISOString().split('T')[0],
    Saturday: new Date(base - 1 * 86_400_000).toISOString().split('T')[0],
    Sunday:   raceDate,
  };
}

/** Extract UTC offset in decimal hours from an IANA timezone on a given date. */
export function getUtcOffsetHours(timezone: string, dateStr: string): number {
  try {
    const d = new Date(dateStr + 'T12:00:00Z');
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    }).formatToParts(d);
    const tzPart = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+0';
    const match = tzPart.match(/GMT([+-]\d{1,2}(?::\d{2})?)/);
    if (!match) return 0;
    const raw = match[1];
    const [hStr, mStr = '0'] = raw.replace(/^[+-]/, '').split(':');
    const sign = raw.startsWith('-') ? -1 : 1;
    return sign * (parseInt(hStr) + parseInt(mStr) / 60);
  } catch {
    return 0;
  }
}

/** Get session status relative to now. */
export function getSessionStatus(
  day: string,
  startTime: string,
  endTime: string,
  dayDates: Record<string, string>,
  utcOffsetHours: number,
): SessionStatus {
  const dateStr = dayDates[day];
  if (!dateStr) return 'upcoming';

  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);

  const offsetMs = utcOffsetHours * 60 * 60 * 1000;
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
  dayDates: Record<string, string>,
  utcOffsetHours: number,
): number {
  const dateStr = dayDates[day];
  if (!dateStr) return 0;

  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);

  const offsetMs = utcOffsetHours * 60 * 60 * 1000;
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
