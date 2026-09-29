/**
 * Client-safe provider metadata (no API keys, no fetch).
 */
import { PROVIDER_IDS, type ProviderId } from './types';

export const PROVIDER_NAMES: Record<ProviderId, string> = {
  getyourguide: 'GetYourGuide',
  viator: 'Viator',
  tiqets: 'Tiqets',
};

/**
 * Maps a stored affiliate_partner / provider value ("getyourguide", "GYG",
 * "GetYourGuide", "") to a ProviderId. Unknown and empty values fall back to
 * GetYourGuide, which is what every legacy experience row is.
 */
export function toProviderId(value: string | null | undefined): ProviderId {
  const v = (value ?? '').toLowerCase().replace(/[^a-z]/g, '');
  if ((PROVIDER_IDS as readonly string[]).includes(v)) return v as ProviderId;
  if (v === 'gyg') return 'getyourguide';
  return 'getyourguide';
}

export function providerName(value: string | null | undefined): string {
  return PROVIDER_NAMES[toProviderId(value)];
}
