import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { affiliate_clicks } from '@/lib/db/schema';
import { getExperienceById } from '@/services/experience.service';
import { buildAffiliateUrl } from '@/lib/affiliates';

const VALID_SOURCES = ['feed', 'itinerary', 'featured', 'map', 'guide'] as const;
type Source = typeof VALID_SOURCES[number];

function getBaseUrl(trackedUrl: string): string {
  try {
    const url = new URL(trackedUrl);
    url.searchParams.delete('partner_id');
    url.searchParams.delete('utm_medium');
    url.searchParams.delete('utm_source');
    url.searchParams.delete('utm_content');
    url.searchParams.delete('utm_term');
    return url.toString();
  } catch {
    return trackedUrl;
  }
}

async function logClick(
  req: NextRequest,
  experienceId: number,
  affiliatePartner: string,
  source: Source,
  sessionId: string | null,
  itineraryId: string | null
) {
  try {
    const db = await getDb();
    await db.insert(affiliate_clicks).values({
      experience_id: experienceId,
      affiliate_partner: affiliatePartner,
      source,
      session_id: sessionId,
      itinerary_id: itineraryId,
      user_agent: req.headers.get('user-agent')?.slice(0, 500) ?? null,
      referer: req.headers.get('referer')?.slice(0, 1000) ?? null,
    });
  } catch (err) {
    console.error('[/api/click] DB insert failed:', err);
    // Still redirect — tracking failure shouldn't block the user
  }
}

/**
 * GET /api/click?id=123&source=feed&sid=abc&itinerary=xyz
 * Logs the click, then redirects to the tracked partner URL.
 * Used by the Book buttons (opened synchronously in a new tab).
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const experienceId = Number(params.get('id'));
  const sourceParam = params.get('source') ?? 'feed';
  const source: Source = VALID_SOURCES.includes(sourceParam as Source) ? (sourceParam as Source) : 'feed';

  const experience = Number.isInteger(experienceId) && experienceId > 0
    ? await getExperienceById(experienceId)
    : null;
  if (!experience?.affiliateUrl) {
    return NextResponse.redirect(new URL('/experiences', req.url), 302);
  }

  const affiliateUrl = buildAffiliateUrl(getBaseUrl(experience.affiliateUrl), experienceId, source);
  await logClick(
    req,
    experienceId,
    experience.affiliatePartner,
    source,
    params.get('sid')?.slice(0, 64) || null,
    params.get('itinerary')?.slice(0, 12) || null
  );

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

  const { experienceId, source, sessionId, itineraryId } = body as {
    experienceId?: number;
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

  if (!VALID_SOURCES.includes(source as Source)) {
    return NextResponse.json(
      { error: `Invalid source. Must be one of: ${VALID_SOURCES.join(', ')}` },
      { status: 400 }
    );
  }

  const experience = await getExperienceById(experienceId);
  if (!experience) {
    return NextResponse.json({ error: 'Experience not found' }, { status: 404 });
  }

  const baseUrl = getBaseUrl(experience.affiliateUrl);
  const affiliateUrl = buildAffiliateUrl(baseUrl, experienceId, source as Source);

  await logClick(
    req,
    experienceId,
    experience.affiliatePartner,
    source as Source,
    sessionId ?? null,
    itineraryId ?? null
  );

  return NextResponse.json({ affiliateUrl, tracked: true });
}
