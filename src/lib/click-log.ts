import type { NextRequest } from 'next/server';
import { sql } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { affiliate_clicks } from '@/lib/db/schema';
import type { ClickSource, ProviderId } from '@/lib/providers/types';

export interface ClickLog {
  /** null for live-feed products that aren't experiences in the database. */
  experienceId: number | null;
  provider: ProviderId;
  offerId: number | null;
  source: ClickSource;
  sessionId: string | null;
  itineraryId: string | null;
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
}
