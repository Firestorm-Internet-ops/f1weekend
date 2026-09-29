import type { ProviderAdapter, ProviderId } from './types';
import { viator } from './viator';
import { tiqets } from './tiqets';
import { getyourguide } from './getyourguide';

export * from './types';
export { PROVIDER_NAMES, providerName, toProviderId } from './meta';
export { buildAffiliateUrl, stripGygTracking } from './affiliate-url';
export { campaignId, pageFromPath, resolveCampaignPage, type CampaignPage } from './campaign';
export { sortOffers } from './offers';

/**
 * Search adapters. The offers pipeline (scripts/fetch-provider-offers.ts)
 * matches Viator and Tiqets to experiences whose GYG listing is already in
 * the database; the live nearby feed uses all three.
 */
export const SEARCH_ADAPTERS: Partial<Record<ProviderId, ProviderAdapter>> = { viator, tiqets };
export const ALL_SEARCH_ADAPTERS: Record<ProviderId, ProviderAdapter> = { getyourguide, viator, tiqets };
