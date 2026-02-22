/**
 * Affiliate URL builder for GetYourGuide.
 * Appends partner ID and UTM tracking params to a base GYG activity URL.
 */

const GYG_PARTNER_ID = process.env.GYG_PARTNER_ID ?? 'PLACEHOLDER';

export function buildAffiliateUrl(
  baseUrl: string,
  experienceId: number,
  source: 'feed' | 'itinerary' | 'featured'
): string {
  const url = new URL(baseUrl);
  url.searchParams.set('partner_id', GYG_PARTNER_ID);
  url.searchParams.set('utm_medium', 'online_publisher');
  url.searchParams.set('utm_source', 'pitlane');
  url.searchParams.set('utm_content', source);
  url.searchParams.set('utm_term', String(experienceId));
  return url.toString();
}
