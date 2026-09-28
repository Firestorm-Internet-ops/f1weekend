import { NextRequest, NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { affiliate_clicks } from '@/lib/db/schema';
import { getExperienceById } from '@/services/experience.service';
import { getOffersForExperience } from '@/services/offer.service';
import { buildAffiliateUrl, type ClickSource, type Offer } from '@/lib/providers';

const VALID_SOURCES = ['feed', 'itinerary', 'featured', 'map', 'guide'] as const;
type Source = ClickSource;

interface ClickLog {
  experienceId: number;
  offer: Offer;
  source: Source;
  sessionId: string | null;
  itineraryId: string | null;
}

async function logClick(req: NextRequest, c: ClickLog) {
  const userAgent = req.headers.get('user-agent')?.slice(0, 500) ?? null;
  const referer = req.headers.get('referer')?.slice(0, 1000) ?? null;
  const db = await getDb();
  try {
    await db.insert(affiliate_clicks).values({
      experience_id: c.experienceId,
      affiliate_partner: c.offer.provider,
      offer_id: c.offer.id,
      source: c.source,
      session_id: c.sessionId,
      itinerary_id: c.itineraryId,
      user_agent: userAgent,
      referer,
    });
  } catch (err) {
    // affiliate_clicks.offer_id may not exist yet (migration not run): log without it.
    try {
      await db.execute(sql`INSERT INTO affiliate_clicks
        (experience_id, affiliate_partner, source, session_id, itinerary_id, user_agent, referer)
        VALUES (${c.experienceId}, ${c.offer.provider}, ${c.source}, ${c.sessionId}, ${c.itineraryId}, ${userAgent}, ${referer})`);
    } catch {
      console.error('[/api/click] DB insert failed:', err);
      // Still redirect — tracking failure shouldn't block the user
    }
  }
}

function parseSource(value: string | null | undefined): Source | null {
  return VALID_SOURCES.includes(value as Source) ? (value as Source) : null;
}

/** The requested offer if it belongs to the experience, else the default (primary, then cheapest). */
async function resolveOffer(experienceId: number, offerId: number | null) {
  const experience = Number.isInteger(experienceId) && experienceId > 0
    ? await getExperienceById(experienceId)
    : null;
  if (!experience) return null;
  const offers = await getOffersForExperience(experience);
  const offer = (offerId ? offers.find((o) => o.id === offerId) : undefined) ?? offers[0];
  return offer ? { experience, offer } : null;
}

/**
 * GET /api/click?id=123&offer=456&source=feed&sid=abc&itinerary=xyz
 * Logs the click, then redirects to the offer's tracked partner URL.
 * `offer` is optional; without it the experience's default offer is used.
 * Used by the Book buttons (opened synchronously in a new tab).
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const experienceId = Number(params.get('id'));
  const offerId = Number(params.get('offer')) || null;
  const source = parseSource(params.get('source')) ?? 'feed';

  const resolved = await resolveOffer(experienceId, offerId);
  if (!resolved) {
    return NextResponse.redirect(new URL('/experiences', req.url), 302);
  }

  const affiliateUrl = buildAffiliateUrl(resolved.offer.provider, resolved.offer.url, { experienceId, source });
  await logClick(req, {
    experienceId,
    offer: resolved.offer,
    source,
    sessionId: params.get('sid')?.slice(0, 64) || null,
    itineraryId: params.get('itinerary')?.slice(0, 12) || null,
  });

  const res = NextResponse.redirect(affiliateUrl, 302);
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { experienceId, offerId, source, sessionId, itineraryId } = body as {
    experienceId?: number;
    offerId?: number;
    source?: string;
    sessionId?: string;
    itineraryId?: string;
  };

  if (!experienceId || !source) {
    return NextResponse.json(
      { error: 'experienceId and source are required' },
      { status: 400 }
    );
  }

  const validSource = parseSource(source);
  if (!validSource) {
    return NextResponse.json(
      { error: `Invalid source. Must be one of: ${VALID_SOURCES.join(', ')}` },
      { status: 400 }
    );
  }

  const resolved = await resolveOffer(experienceId, offerId ?? null);
  if (!resolved) {
    return NextResponse.json({ error: 'Experience not found' }, { status: 404 });
  }

  const affiliateUrl = buildAffiliateUrl(resolved.offer.provider, resolved.offer.url, { experienceId, source: validSource });
  await logClick(req, {
    experienceId,
    offer: resolved.offer,
    source: validSource,
    sessionId: sessionId ?? null,
    itineraryId: itineraryId ?? null,
  });

  return NextResponse.json({ affiliateUrl, tracked: true });
}
