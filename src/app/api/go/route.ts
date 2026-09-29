import { NextRequest, NextResponse } from 'next/server';
import { logClick } from '@/lib/click-log';
import { getRaceBySlug } from '@/services/race.service';
import { findFeedOffer } from '@/services/nearby-feed.service';
import { buildAffiliateUrl, campaignId, resolveCampaignPage, type ClickSource } from '@/lib/providers';
import { hasLiveExperiences } from '@/data/calendar-2026';
import { raceKey } from '@/lib/race-url';

const VALID_SOURCES: ClickSource[] = ['feed', 'itinerary', 'featured', 'map', 'guide'];

/**
 * GET /api/go?race=bahrain-2026&provider=viator&product=12345P1&source=feed&sid=abc
 * Booking click for a live-feed card (products that aren't experiences in the
 * database). The product must be in the race's current feed, so this can't
 * be used to redirect anywhere else. Logs the click, then redirects.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const raceSlug = params.get('race') ?? '';
  const provider = params.get('provider') ?? '';
  const productId = params.get('product') ?? '';
  const sourceParam = params.get('source') as ClickSource;
  const source: ClickSource = VALID_SOURCES.includes(sourceParam) ? sourceParam : 'feed';

  const race = hasLiveExperiences(raceSlug) ? await getRaceBySlug(raceSlug) : null;
  const found = race ? await findFeedOffer(race, provider, productId) : null;
  if (!race || !found) {
    return NextResponse.redirect(new URL(race ? `/races/${raceKey(race.slug)}/experiences` : '/experiences', req.url), 302);
  }

  const campaign = campaignId(race.slug, resolveCampaignPage(params.get('page'), req.headers.get('referer'), source));
  const url = buildAffiliateUrl(found.offer.provider, found.offer.url, { experienceId: null, productId, source, campaign });
  await logClick(req, {
    experienceId: null,
    provider: found.offer.provider,
    offerId: null,
    source,
    sessionId: params.get('sid')?.slice(0, 64) || null,
    itineraryId: null,
  });

  const res = NextResponse.redirect(url, 302);
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  res.headers.set('Cache-Control', 'no-store');
  return res;
}
