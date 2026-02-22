import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { affiliate_clicks } from '@/lib/db/schema';
import { getExperienceById } from '@/services/experience.service';
import { buildAffiliateUrl } from '@/lib/affiliates';

const VALID_SOURCES = ['feed', 'itinerary', 'featured'] as const;
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

  try {
    await db.insert(affiliate_clicks).values({
      experience_id: experienceId,
      affiliate_partner: experience.affiliatePartner,
      source: source as Source,
      session_id: sessionId ?? null,
      itinerary_id: itineraryId ?? null,
      user_agent: req.headers.get('user-agent') ?? null,
      referer: req.headers.get('referer') ?? null,
    });
  } catch (err) {
    console.error('[POST /api/click] DB insert failed:', err);
    // Still return the URL — tracking failure shouldn't block the user
  }

  return NextResponse.json({ affiliateUrl, tracked: true });
}
