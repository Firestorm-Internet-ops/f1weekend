/**
 * Reads booking clicks for the /stats page and the daily/weekly report:
 * affiliate_clicks (with the experience title for experience-page clicks)
 * and the "book_click" events that name the tour (live-feed clicks).
 */
import { and, eq, gte } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { affiliate_clicks, events, experiences } from '@/lib/db/schema';
import { toProviderId } from '@/lib/providers/meta';
import type { ClickRow, TourClick } from '@/lib/click-stats';

export interface LoadedClicks {
  rows: ClickRow[];
  tours: TourClick[];
  error: string | null;
}

export async function loadClicks(from: Date): Promise<LoadedClicks> {
  let rows: ClickRow[] = [];
  let tours: TourClick[] = [];
  try {
    const db = await getDb();
    const raw = await db
      .select({
        clickedAt: affiliate_clicks.clicked_at, partner: affiliate_clicks.affiliate_partner, source: affiliate_clicks.source,
        sessionId: affiliate_clicks.session_id, userAgent: affiliate_clicks.user_agent, referer: affiliate_clicks.referer,
        experienceTitle: experiences.title,
      })
      .from(affiliate_clicks)
      .leftJoin(experiences, eq(affiliate_clicks.experience_id, experiences.id))
      .where(gte(affiliate_clicks.clicked_at, from));
    // Older rows spell the site differently ("GetYourGuide", "gyg"): one key per site.
    rows = raw.map((r) => ({ ...r, partner: toProviderId(r.partner), clickedAt: new Date(r.clickedAt ?? 0) }));
    try {
      const ev = await db
        .select({ createdAt: events.created_at, data: events.event_data, sessionId: events.session_id })
        .from(events)
        .where(and(eq(events.event_type, 'book_click'), gte(events.created_at, from)));
      tours = ev.flatMap((e) => {
        const d = (typeof e.data === 'string' ? JSON.parse(e.data) : e.data) as Record<string, string> | null;
        return d?.productId ? [{ clickedAt: new Date(e.createdAt ?? 0), provider: d.provider, race: d.race ?? null, productId: d.productId, title: d.title ?? d.productId, sessionId: e.sessionId }] : [];
      });
    } catch { /* events table not created yet: no clicks recorded per tour */ }
    return { rows, tours, error: null };
  } catch (err) {
    return { rows, tours, error: (err as Error).message };
  }
}

/** The live site's host: staging shares its database, so reports always count f1weekend.co. */
export const liveHost = () => new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://f1weekend.co').host;
