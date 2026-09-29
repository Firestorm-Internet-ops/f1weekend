/**
 * Race URLs have no year: /races/bahrain, /races/abu-dhabi. The page always
 * shows that race's current or next weekend, so rankings carry over from one
 * season to the next. Internally races keep their database slug
 * ("bahrain-2026"); links are built from its key.
 */

/** "bahrain-2026" → "bahrain" (a key passes through unchanged). */
export function raceKey(slug: string): string {
  return slug.replace(/-\d{4}$/, '');
}

/** True for a database slug with a season ("bahrain-2026"), false for a URL key ("bahrain"). */
export function hasSeason(slugOrKey: string): boolean {
  return /-\d{4}$/.test(slugOrKey);
}

/** Season of a database slug: "bahrain-2026" → 2026. */
export function seasonOfSlug(slug: string): number | null {
  const m = slug.match(/-(\d{4})$/);
  return m ? Number(m[1]) : null;
}
