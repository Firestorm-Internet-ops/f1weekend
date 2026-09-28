import { NEARBY_LIMITS, type NearbyTier } from '@/lib/nearby';

/** Pin colours by distance group, shared by the drawn map and the Google map. */
export const TIER_STYLE: Record<NearbyTier, { color: string; label: string; opacity: number }> = {
  near: { color: '#22C55E', label: `Near circuit (≤ ${NEARBY_LIMITS.nearMins} min)`, opacity: 0.95 },
  city: { color: '#3B82F6', label: `In the city (≤ ${NEARBY_LIMITS.cityMins} min)`, opacity: 0.95 },
  daytrip: { color: '#F59E0B', label: 'Day trip (≤ 2 h)', opacity: 0.95 },
  'too-far': { color: '#6B7280', label: 'Too far (will be hidden)', opacity: 0.4 },
  unknown: { color: '#6B7280', label: 'No location', opacity: 0.4 },
};
