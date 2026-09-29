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

export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return '';
  }
}

export function trackEvent(name: string, props: EventProps = {}): void {
  if (typeof window === 'undefined') return;
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
