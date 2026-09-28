import type { ProviderAdapter, ProviderId } from './types';
import { viator } from './viator';
import { tiqets } from './tiqets';

export * from './types';
export { PROVIDER_NAMES, providerName, toProviderId } from './meta';
export { buildAffiliateUrl, stripGygTracking } from './affiliate-url';
export { sortOffers } from './offers';

/**
 * Search adapters used by the offers pipeline. GetYourGuide ingestion still
 * runs through scripts/discover-gyg-tours.ts + enrich-from-gyg.ts; its
 * existing rows become offers through the backfill migration.
 */
export const SEARCH_ADAPTERS: Partial<Record<ProviderId, ProviderAdapter>> = { viator, tiqets };
