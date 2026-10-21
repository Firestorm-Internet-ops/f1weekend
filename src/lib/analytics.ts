/**
 * Client-side analytics: sends one event to every analytics tool on the page
 * (Ahrefs Web Analytics, GA4 when configured, Vercel Analytics).
 * Each call is guarded so a missing or blocked tracker never breaks the UI.
 */
import { track } from '@vercel/analytics';
import { pageFromPath } from '@/lib/providers/campaign';

type EventProps = Record<string, string | number | boolean | null>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    AhrefsAnalytics?: { sendEvent: (name: string, props?: EventProps) => void };
  }
}

export const SESSION_KEY = 'pitlane-session';
/** Set by visiting any page with ?internal=1 (cleared with ?internal=0): our own and test browsers. */
export const INTERNAL_KEY = 'f1w-internal';
/** Session IDs of internal browsers start with this, so reports can leave their clicks out. */
export const INTERNAL_PREFIX = 'internal-';

export function isInternal(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(INTERNAL_KEY) === '1';
  } catch {
    return false;
  }
}

/** Reads ?internal=1 / ?internal=0 from the address and remembers it in this browser. */
export function rememberInternalFlag(search: string): void {
  const v = new URLSearchParams(search).get('internal');
  try {
    if (v === '1') localStorage.setItem(INTERNAL_KEY, '1');
    else if (v === '0') localStorage.removeItem(INTERNAL_KEY);
  } catch { /* storage blocked */ }
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(SESSION_KEY, id);
    }
    return isInternal() ? `${INTERNAL_PREFIX}${id}`.slice(0, 64) : id;
  } catch {
    return '';
  }
}

export function trackEvent(name: string, props: EventProps = {}): void {
  if (typeof window === 'undefined' || isInternal()) return;
  try { window.AhrefsAnalytics?.sendEvent(name, props); } catch {}
  try { window.gtag?.('event', name, props); } catch {}
  try { track(name, props); } catch {}
}

export type ClickSource = 'feed' | 'itinerary' | 'featured' | 'map' | 'guide';

/**
 * Records a booking click and opens the partner site in a new tab.
 * The tab is opened synchronously (inside the click handler) on our own
 * /api/click redirect, so browsers don't treat it as a blocked popup.
 */
export function openBooking(
  experienceId: number,
  source: ClickSource,
  itineraryId?: string,
  offer?: { id: number | null; provider: string }
): void {
  trackEvent('book_click', {
    experience_id: experienceId,
    source,
    page: window.location.pathname,
    ...(offer ? { provider: offer.provider } : {}),
  });

  // page → the "f1-{race}-{page}" campaign ID on the partner link.
  const params = new URLSearchParams({ id: String(experienceId), source, page: pageFromPath(window.location.pathname) });
  if (offer?.id) params.set('offer', String(offer.id));
  const sessionId = getSessionId();
  if (sessionId) params.set('sid', sessionId);
  if (itineraryId) params.set('itinerary', itineraryId);

  window.open(`/api/click?${params.toString()}`, '_blank', 'noopener');
}

/** Booking click on a live-feed card (a provider product, not a database experience). */
export function openFeedBooking(raceSlug: string, offer: { provider: string; productId: string }, source: ClickSource = 'feed'): void {
  trackEvent('book_click', { race: raceSlug, provider: offer.provider, product_id: offer.productId, source, page: window.location.pathname });
  const params = new URLSearchParams({ race: raceSlug, provider: offer.provider, product: offer.productId, source, page: pageFromPath(window.location.pathname) });
  const sessionId = getSessionId();
  if (sessionId) params.set('sid', sessionId);
  window.open(`/api/go?${params.toString()}`, '_blank', 'noopener');
}
