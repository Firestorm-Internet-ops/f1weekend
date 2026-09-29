/**
 * Per-provider affiliate link builders. Pure functions: safe to unit test.
 */
import type { AffiliateContext, ProviderId } from './types';

/** Our reference in partner reports: experience id, or "p<productId>" for live-feed products. */
function ref(ctx: AffiliateContext): string {
  return ctx.experienceId != null ? String(ctx.experienceId) : `p${ctx.productId ?? ''}`;
}

const GYG_TRACKING_PARAMS = ['partner_id', 'utm_medium', 'utm_source', 'utm_content', 'utm_term'];

/** Removes GYG tracking params stored on legacy affiliate_url values. */
export function stripGygTracking(trackedUrl: string): string {
  try {
    const url = new URL(trackedUrl);
    for (const k of GYG_TRACKING_PARAMS) url.searchParams.delete(k);
    return url.toString();
  } catch {
    return trackedUrl;
  }
}

function gyg(baseUrl: string, ctx: AffiliateContext): string {
  // Keep the partner ID GetYourGuide's API already put on the URL when ours isn't configured.
  const existing = new URL(baseUrl).searchParams.get('partner_id');
  const url = new URL(stripGygTracking(baseUrl));
  const partnerId = process.env.GYG_PARTNER_ID || (existing && existing !== 'PLACEHOLDER' ? existing : null);
  if (partnerId) url.searchParams.set('partner_id', partnerId);
  url.searchParams.set('utm_medium', 'online_publisher');
  url.searchParams.set('utm_source', 'pitlane');
  url.searchParams.set('utm_content', ctx.source);
  url.searchParams.set('utm_term', ref(ctx));
  return url.toString();
}

/** Viator: product URL already carries pid/mcid; `campaign` is the sub-ID shown in Viator reports. */
function viator(baseUrl: string, ctx: AffiliateContext): string {
  const url = new URL(baseUrl);
  url.searchParams.set('campaign', `f1w-${ref(ctx)}-${ctx.source}`);
  return url.toString();
}

/** Tiqets: product URL already carries partner; `tq_campaign` is the sub-ID. */
function tiqets(baseUrl: string, ctx: AffiliateContext): string {
  const url = new URL(baseUrl);
  if (!url.searchParams.get('partner') && process.env.TIQETS_PARTNER_ID) {
    url.searchParams.set('partner', process.env.TIQETS_PARTNER_ID);
  }
  url.searchParams.set('tq_campaign', `f1w-${ref(ctx)}-${ctx.source}`);
  return url.toString();
}

const BUILDERS: Record<ProviderId, (baseUrl: string, ctx: AffiliateContext) => string> = {
  getyourguide: gyg,
  viator,
  tiqets,
};

export function buildAffiliateUrl(provider: ProviderId, baseUrl: string, ctx: AffiliateContext): string {
  return BUILDERS[provider](baseUrl, ctx);
}
