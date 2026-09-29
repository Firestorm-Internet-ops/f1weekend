import { NextRequest, NextResponse } from 'next/server';
import { logClick } from '@/lib/click-log';
import { getExperienceById } from '@/services/experience.service';
import { getOffersForExperience } from '@/services/offer.service';
import { buildAffiliateUrl, campaignId, resolveCampaignPage, type ClickSource } from '@/lib/providers';
import { getRaceById } from '@/services/race.service';

const VALID_SOURCES = ['feed', 'itinerary', 'featured', 'map', 'guide'] as const;
type Source = ClickSource;

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

/** "f1-{race}-{page}" for an experience's link: its own race, the page the click came from. */
async function campaignFor(experience: { raceId: number }, pageParam: string | null, referer: string | null, source: string): Promise<string> {
  const race = experience.raceId ? await getRaceById(experience.raceId) : null;
  return campaignId(race?.slug ?? null, resolveCampaignPage(pageParam, referer, source));
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

  const campaign = await campaignFor(resolved.experience, params.get('page'), req.headers.get('referer'), source);
  const affiliateUrl = buildAffiliateUrl(resolved.offer.provider, resolved.offer.url, { experienceId, source, campaign });
  await logClick(req, {
    experienceId,
    provider: resolved.offer.provider,
    offerId: resolved.offer.id,
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

  const campaign = await campaignFor(resolved.experience, (body as { page?: string }).page ?? null, req.headers.get('referer'), validSource);
  const affiliateUrl = buildAffiliateUrl(resolved.offer.provider, resolved.offer.url, { experienceId, source: validSource, campaign });
  await logClick(req, {
    experienceId,
    provider: resolved.offer.provider,
    offerId: resolved.offer.id,
    source: validSource,
    sessionId: sessionId ?? null,
    itineraryId: itineraryId ?? null,
  });

  return NextResponse.json({ affiliateUrl, tracked: true });
}
