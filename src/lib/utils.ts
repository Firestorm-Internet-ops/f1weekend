import { nanoid } from 'nanoid';
import { fromZonedTime, toZonedTime, format as formatTz } from 'date-fns-tz';

/** Convert "13:30:00" or "13:30" to "1:30 PM" */
export function formatTime(time: string): string {
  const [hourStr, minuteStr] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = minuteStr ?? '00';
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${period}`;
}

/** Generate a short unique ID for itinerary URLs (e.g. "Uakgb_J5m9g") */
export function generateId(): string {
  return nanoid(12);
}

/** "Great Ocean Road Tour" → "great-ocean-road-tour" */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Format a price for display: 13500 (cents) → "A$135" */
export function formatPrice(amountCents: number, currency = 'AUD'): string {
  const amount = amountCents / 100;
  const symbol = currency === 'AUD' ? 'A$' : currency === 'USD' ? '$' : currency;
  return `${symbol}${amount % 1 === 0 ? amount : amount.toFixed(2)}`;
}

/**
 * Convert a race-local session time to an absolute UTC Date.
 * raceDate: "2026-03-06", time: "12:30" or "12:30:00", raceTz: "Australia/Melbourne"
 */
export function sessionToUtcDate(raceDate: string, time: string, raceTz: string): Date {
  const [h, m] = time.split(':').map(s => s.padStart(2, '0'));
  const localStr = `${raceDate}T${h}:${m}:00`;
  return fromZonedTime(localStr, raceTz);
}

/**
 * Format a UTC Date as a time string in the given timezone.
 * Returns "12:30 PM" (no date).
 */
export function formatInTimezone(date: Date, tz: string): string {
  return formatTz(toZonedTime(date, tz), 'h:mm aa', { timeZone: tz });
}

/**
 * Get the short timezone abbreviation for a given IANA timezone at a date.
 * e.g. "Australia/Melbourne" → "AEDT", "America/New_York" → "EDT"
 */
export function getTimezoneAbbr(tz: string, date = new Date()): string {
  return new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'short' })
    .formatToParts(date)
    .find(p => p.type === 'timeZoneName')?.value ?? tz;
}

/** "2026-03-08" → "Sunday 8 March 2026" */
export function formatDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
