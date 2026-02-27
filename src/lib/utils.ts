export function formatLapTime(seconds: number): string {
  if (typeof seconds !== 'number' || seconds <= 0) {
    return 'N/A';
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  // Pad seconds with leading zero if needed, and ensure 3 decimal places.
  return `${minutes}:${remainingSeconds.toFixed(3).padStart(6, '0')}`;
}

/**
 * Formats a Date object or a date string into a HH:mm time format.
 * @param date The date to format.
 * @returns A string in HH:mm format, or 'N/A' if the date is invalid.
 */
export function formatTime(date: Date | string): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}