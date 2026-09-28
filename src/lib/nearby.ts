/**
 * "Nearby" rules: decides which experiences are close enough to show for a race.
 *
 * Travel time is estimated from straight-line distance (no routing API):
 *   road distance ≈ straight line × 1.3
 *   first 10 road-km at 20 km/h (city traffic), the rest at 60 km/h
 * On race days (near / city tiers) that estimate is multiplied by 1.5 for
 * road closures and race traffic. Day trips happen on free days (Thu / Mon),
 * so they use the plain estimate.
 *
 * Distance is measured from the circuit and from the places fans actually stay
 * (RACE_BASES), whichever is closer — important for out-of-town circuits.
 */

export type NearbyTier = 'near' | 'city' | 'daytrip' | 'too-far' | 'unknown';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Anchor extends LatLng {
  name: string;
}

export const NEARBY_LIMITS = {
  nearMins: 30,
  cityMins: 60,
  dayTripMins: 120,
  maxDayTrips: 3,
} as const;

export const ROAD_FACTOR = 1.3;
export const RACE_TRAFFIC_FACTOR = 1.5;

/** Where fans stay, per race (slug without the year). Circuit itself is always an anchor too. */
export const RACE_BASES: Record<string, Anchor[]> = {
  'abu-dhabi': [{ name: 'Abu Dhabi city', lat: 24.4539, lng: 54.3773 }],
  austria: [{ name: 'Graz', lat: 47.0707, lng: 15.4395 }],
  bahrain: [{ name: 'Manama', lat: 26.2235, lng: 50.5876 }],
  barcelona: [{ name: 'Barcelona', lat: 41.3874, lng: 2.1686 }],
  belgium: [
    { name: 'Spa', lat: 50.492, lng: 5.8636 },
    { name: 'Liège', lat: 50.6326, lng: 5.5797 },
  ],
  brazil: [{ name: 'São Paulo (Paulista)', lat: -23.5614, lng: -46.6559 }],
  britain: [
    { name: 'Milton Keynes', lat: 52.0406, lng: -0.7594 },
    { name: 'Northampton', lat: 52.2405, lng: -0.9027 },
  ],
  canada: [{ name: 'Downtown Montreal', lat: 45.5019, lng: -73.5674 }],
  hungary: [{ name: 'Budapest', lat: 47.4979, lng: 19.0402 }],
  italy: [{ name: 'Milan', lat: 45.4642, lng: 9.19 }],
  japan: [{ name: 'Nagoya', lat: 35.1709, lng: 136.8815 }],
  madrid: [{ name: 'Central Madrid', lat: 40.4168, lng: -3.7038 }],
  melbourne: [{ name: 'Melbourne CBD', lat: -37.8136, lng: 144.9631 }],
  mexico: [{ name: 'Centro Histórico', lat: 19.4326, lng: -99.1332 }],
  miami: [
    { name: 'Downtown Miami', lat: 25.7617, lng: -80.1918 },
    { name: 'Miami Beach', lat: 25.7907, lng: -80.13 },
  ],
  netherlands: [
    { name: 'Haarlem', lat: 52.3874, lng: 4.6462 },
    { name: 'Amsterdam', lat: 52.3731, lng: 4.8922 },
  ],
  qatar: [{ name: 'Doha', lat: 25.2854, lng: 51.531 }],
  saudi: [{ name: 'Jeddah', lat: 21.5433, lng: 39.1728 }],
  shanghai: [{ name: 'Shanghai centre', lat: 31.2304, lng: 121.4737 }],
  usa: [{ name: 'Downtown Austin', lat: 30.2672, lng: -97.7431 }],
};

/** Races with evening sessions — city activities fit all day, not just mornings/evenings. */
export const NIGHT_RACES = new Set(['singapore', 'las-vegas', 'bahrain', 'saudi', 'qatar', 'abu-dhabi']);

/** 'britain-2026' → 'britain' */
export function raceKey(raceSlug: string): string {
  return raceSlug.replace(/-\d{4}$/, '');
}

export function isNightRace(raceSlug: string): boolean {
  return NIGHT_RACES.has(raceKey(raceSlug));
}

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Normal (non-race-day) travel time in minutes, before rounding. */
export function estimateTravelMins(straightLineKm: number): number {
  const roadKm = straightLineKm * ROAD_FACTOR;
  if (roadKm <= 10) return (roadKm / 20) * 60;
  return 30 + ((roadKm - 10) / 60) * 60;
}

function roundTo5(mins: number): number {
  return Math.max(5, Math.round(mins / 5) * 5);
}

export function anchorsForRace(raceSlug: string, circuit: LatLng | null): Anchor[] {
  const anchors: Anchor[] = [];
  if (circuit) anchors.push({ name: 'the circuit', ...circuit });
  anchors.push(...(RACE_BASES[raceKey(raceSlug)] ?? []));
  return anchors;
}

export interface NearbyInfo {
  tier: NearbyTier;
  /** Straight-line km to the closest anchor. */
  distanceKm: number | null;
  /** Rounded minutes shown to users (race-day adjusted for near/city). */
  travelMins: number | null;
  /** Which anchor the travel time is measured from. */
  from: string | null;
}

function isValidLatLng(p: Partial<LatLng> | null | undefined): p is LatLng {
  return (
    !!p &&
    typeof p.lat === 'number' &&
    typeof p.lng === 'number' &&
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lng) &&
    !(p.lat === 0 && p.lng === 0)
  );
}

export function classifyExperience(
  location: Partial<LatLng> | null | undefined,
  raceSlug: string,
  circuit: LatLng | null
): NearbyInfo {
  const anchors = anchorsForRace(raceSlug, isValidLatLng(circuit) ? circuit : null);
  if (!isValidLatLng(location) || anchors.length === 0) {
    return { tier: 'unknown', distanceKm: null, travelMins: null, from: null };
  }

  let closest = anchors[0];
  let closestKm = haversineKm(location, closest);
  for (const a of anchors.slice(1)) {
    const km = haversineKm(location, a);
    if (km < closestKm) {
      closest = a;
      closestKm = km;
    }
  }

  const baseMins = estimateTravelMins(closestKm);
  const raceDayMins = baseMins * RACE_TRAFFIC_FACTOR;
  const distanceKm = Math.round(closestKm * 10) / 10;

  // "Near" is measured from the circuit only.
  if (isValidLatLng(circuit)) {
    const circuitMins = estimateTravelMins(haversineKm(location, circuit)) * RACE_TRAFFIC_FACTOR;
    if (circuitMins <= NEARBY_LIMITS.nearMins) {
      return {
        tier: 'near',
        distanceKm: Math.round(haversineKm(location, circuit) * 10) / 10,
        travelMins: roundTo5(circuitMins),
        from: 'the circuit',
      };
    }
  }

  if (raceDayMins <= NEARBY_LIMITS.cityMins) {
    return { tier: 'city', distanceKm, travelMins: roundTo5(raceDayMins), from: closest.name };
  }
  if (baseMins <= NEARBY_LIMITS.dayTripMins) {
    return { tier: 'daytrip', distanceKm, travelMins: roundTo5(baseMins), from: closest.name };
  }
  return { tier: 'too-far', distanceKm, travelMins: roundTo5(baseMins), from: closest.name };
}

const TIER_ORDER: Record<NearbyTier, number> = { near: 0, city: 1, unknown: 2, daytrip: 3, 'too-far': 4 };

export interface Classified<T> {
  item: T;
  nearby: NearbyInfo;
}

/**
 * Applies the rules to a list that is already in the preferred order
 * (e.g. most popular first):
 *  - drops 'too-far'
 *  - keeps only the first `maxDayTrips` day trips
 *  - keeps 'unknown' (missing coordinates) so nothing disappears by accident
 * Returns what to show and what was hidden (for the audit).
 */
export function applyNearbyRules<T extends Partial<LatLng>>(
  items: T[],
  raceSlug: string,
  circuit: LatLng | null
): { visible: Classified<T>[]; hidden: Classified<T>[] } {
  const visible: Classified<T>[] = [];
  const hidden: Classified<T>[] = [];
  let dayTrips = 0;

  for (const item of items) {
    const nearby = classifyExperience(item, raceSlug, circuit);
    if (nearby.tier === 'too-far') {
      hidden.push({ item, nearby });
    } else if (nearby.tier === 'daytrip') {
      if (dayTrips < NEARBY_LIMITS.maxDayTrips) {
        dayTrips++;
        visible.push({ item, nearby });
      } else {
        hidden.push({ item, nearby });
      }
    } else {
      visible.push({ item, nearby });
    }
  }
  return { visible, hidden };
}

/** Stable sort: near → city → unknown → day trips; within a tier, shortest travel first. */
export function sortByNearest<T>(list: Classified<T>[]): Classified<T>[] {
  return [...list].sort((a, b) => {
    const t = TIER_ORDER[a.nearby.tier] - TIER_ORDER[b.nearby.tier];
    if (t !== 0) return t;
    return (a.nearby.travelMins ?? Infinity) - (b.nearby.travelMins ?? Infinity);
  });
}

/** Card label, e.g. "15 min from the circuit" or "Day trip · 1h 30 from Nagoya". */
export function nearbyLabel(info: NearbyInfo): string | null {
  if (info.travelMins == null || !info.from) return null;
  const m = info.travelMins;
  const time = m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}` : ''}` : `${m} min`;
  if (info.tier === 'daytrip') return `Day trip · ${time} from ${info.from}`;
  return `${time} from ${info.from}`;
}
