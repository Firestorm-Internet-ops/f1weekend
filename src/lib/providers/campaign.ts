/**
 * Campaign ID on every affiliate link: "f1-{race}-{page}", e.g.
 * "f1-bahrain-experiences" or "f1-abu-dhabi-itinerary", so provider reports
 * show which race and which page earned each booking.
 * Pure functions (shared by the browser and the click routes).
 */

export const CAMPAIGN_PAGES = [
  'home', 'race', 'experiences', 'experience', 'map', 'schedule', 'getting-there', 'tips', 'itinerary', 'calendar', 'other',
] as const;
export type CampaignPage = typeof CAMPAIGN_PAGES[number];

/** Which page a click came from, by its path. */
export function pageFromPath(path: string | null | undefined): CampaignPage {
  const p = (path ?? '').split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  if (p === '/') return 'home';
  if (p.startsWith('/itinerary')) return 'itinerary';
  if (/^\/f1-\d{4}/.test(p)) return 'calendar';
  const m = p.match(/^\/races\/[^/]+(?:\/(.*))?$/) ?? p.match(/^\/()(experiences.*|schedule|getting-there)$/);
  if (!m) return 'other';
  const rest = m[2] ?? m[1] ?? '';
  if (rest === '' || rest === 'guide') return 'race';
  if (rest === 'experiences') return 'experiences';
  if (rest === 'experiences/map') return 'map';
  if (rest.startsWith('experiences/')) return 'experience';
  if (rest === 'schedule' || rest === 'getting-there' || rest === 'tips') return rest;
  return 'other';
}

export function isCampaignPage(v: string | null | undefined): v is CampaignPage {
  return (CAMPAIGN_PAGES as readonly string[]).includes(v ?? '');
}

/** "bahrain-2026" → "bahrain"; anything unsafe becomes "-". */
function raceName(raceSlug: string | null | undefined): string {
  const name = (raceSlug ?? '').toLowerCase().replace(/-\d{4}$/, '').replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
  return name || 'site';
}

export function campaignId(raceSlug: string | null | undefined, page: CampaignPage): string {
  return `f1-${raceName(raceSlug)}-${page}`;
}

/**
 * The page for a click: what the browser sent, else the Referer's path,
 * else the itinerary for itinerary clicks.
 */
export function resolveCampaignPage(pageParam: string | null, referer: string | null, source?: string): CampaignPage {
  if (isCampaignPage(pageParam)) return pageParam;
  if (referer) {
    try {
      const fromRef = pageFromPath(new URL(referer).pathname);
      if (fromRef !== 'other') return fromRef;
    } catch { /* bad Referer: ignore */ }
  }
  return source === 'itinerary' ? 'itinerary' : 'other';
}
