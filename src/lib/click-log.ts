import type { NextRequest } from 'next/server';
import { sql } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { affiliate_clicks, events } from '@/lib/db/schema';
import type { ClickSource, ProviderId } from '@/lib/providers/types';
import { isBot } from '@/lib/click-stats';

export interface ClickLog {
  /** null for live-feed products that aren't experiences in the database. */
  experienceId: number | null;
  provider: ProviderId;
  offerId: number | null;
  source: ClickSource;
  sessionId: string | null;
  itineraryId: string | null;
  /** Which tour was clicked (for the /stats report's "top tours"). */
  detail?: { race: string | null; productId: string; title: string; page: string };
}

/** The `events` table is in the schema but may not exist on an older database: create it once. */
let eventsReady: Promise<void> | null = null;
function ensureEvents(db: Awaited<ReturnType<typeof getDb>>): Promise<void> {
  eventsReady ??= db.execute(sql`CREATE TABLE IF NOT EXISTS events (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      event_type VARCHAR(50),
      event_data JSON,
      session_id VARCHAR(64),
      page_path VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`).then(() => undefined).catch((err) => { eventsReady = null; throw err; });
  return eventsReady;
}

/** Records a booking click. Never throws: tracking must not block the redirect. */
export async function logClick(req: NextRequest, c: ClickLog): Promise<void> {
  const userAgent = req.headers.get('user-agent')?.slice(0, 500) ?? null;
  const referer = req.headers.get('referer')?.slice(0, 1000) ?? null;
  try {
    const db = await getDb();
    try {
      await db.insert(affiliate_clicks).values({
        experience_id: c.experienceId,
        affiliate_partner: c.provider,
        offer_id: c.offerId,
        source: c.source,
        session_id: c.sessionId,
        itinerary_id: c.itineraryId,
        user_agent: userAgent,
        referer,
      });
    } catch {
      // affiliate_clicks.offer_id may not exist yet (migration not run): log without it.
      await db.execute(sql`INSERT INTO affiliate_clicks
        (experience_id, affiliate_partner, source, session_id, itinerary_id, user_agent, referer)
        VALUES (${c.experienceId}, ${c.provider}, ${c.source}, ${c.sessionId}, ${c.itineraryId}, ${userAgent}, ${referer})`);
    }
  } catch (err) {
    console.error('[click] DB insert failed:', err);
  }
  if (c.detail && !isBot(userAgent)) {
    try {
      const db = await getDb();
      await ensureEvents(db);
      let pagePath: string | null = null;
      try { pagePath = referer ? new URL(referer).pathname.slice(0, 255) : null; } catch { /* bad Referer */ }
      await db.insert(events).values({
        event_type: 'book_click',
        event_data: { provider: c.provider, source: c.source, ...c.detail, title: c.detail.title.slice(0, 200) },
        session_id: c.sessionId,
        page_path: pagePath,
      });
    } catch (err) {
      console.error('[click] event insert failed:', (err as Error).message);
    }
  }
}
