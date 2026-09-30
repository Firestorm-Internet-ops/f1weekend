/**
 * Map pin maths, shared by the experiences map and tested on its own:
 *  - groupByZoom: pins closer than ~44 px at the current zoom are one group,
 *    so zooming in splits them;
 *  - spreadAround: points with no exact spot (a city centre) are laid out in
 *    an even sunflower pattern around it instead of one pile.
 */
import { haversineKm, type LatLng, type NearbyTier } from '@/lib/nearby';

const TIER_RANK: Record<NearbyTier, number> = { near: 0, city: 1, unknown: 2, daytrip: 3, 'too-far': 4 };

export interface Pin extends LatLng {
  id: number;
  tier: NearbyTier;
  count?: number;
}

export interface PinGroup<T extends Pin> extends LatLng {
  key: string;
  members: T[];
  count: number;
  /** The closest tier in the group (its colour). */
  tier: NearbyTier;
}

/** Kilometres covered by `px` screen pixels at `zoom` and latitude (Web Mercator). */
export function kmPerPixels(px: number, zoom: number, lat: number): number {
  return (px * 156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom / 1000;
}

export function groupByZoom<T extends Pin>(pins: T[], zoom: number, lat: number, px = 44): PinGroup<T>[] {
  const km = kmPerPixels(px, zoom, lat);
  const groups: PinGroup<T>[] = [];
  for (const p of [...pins].sort((a, b) => (b.count ?? 1) - (a.count ?? 1))) {
    const g = groups.find((x) => haversineKm(x, p) <= km);
    const n = p.count ?? 1;
    if (g) {
      g.lat = (g.lat * g.count + p.lat * n) / (g.count + n);
      g.lng = (g.lng * g.count + p.lng * n) / (g.count + n);
      g.members.push(p);
      g.count += n;
      if (TIER_RANK[p.tier] < TIER_RANK[g.tier]) g.tier = p.tier;
    } else {
      groups.push({ key: `s${p.id}`, lat: p.lat, lng: p.lng, members: [p], count: n, tier: p.tier });
    }
  }
  return groups;
}

/** `n` points evenly spread within `radiusKm` of the centre (sunflower / golden-angle pattern). */
export function spreadAround(centre: LatLng, n: number, radiusKm: number): LatLng[] {
  return Array.from({ length: n }, (_, i) => {
    const r = radiusKm * Math.sqrt((i + 0.5) / n);
    const a = i * 2.39996; // golden angle, radians
    return {
      lat: centre.lat + (r * Math.cos(a)) / 111.32,
      lng: centre.lng + (r * Math.sin(a)) / (111.32 * Math.cos((centre.lat * Math.PI) / 180)),
    };
  });
}
