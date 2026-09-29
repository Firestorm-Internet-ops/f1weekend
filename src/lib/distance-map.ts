/**
 * Layout for the free, self-drawn distance map (no Google Maps load).
 * Projects lat/lng around the circuit onto a square SVG: circuit in the
 * middle, north up, ~30 / ~60 min race-day rings, activities as dots.
 * Anything outside the view is pinned to the edge in its real direction.
 */
import {
  classifyExperience,
  haversineKm,
  nearbyLabel,
  radiusKmForMins,
  RACE_BASES,
  raceKey,
  NEARBY_LIMITS,
  type LatLng,
  type NearbyTier,
} from '@/lib/nearby';

export interface DistanceMapInput {
  id: number;
  title: string;
  slug: string;
  lat?: number | null;
  lng?: number | null;
}

export interface MapDot {
  id: number;
  title: string;
  slug: string;
  x: number;
  y: number;
  tier: NearbyTier;
  label: string | null;
  /** True when the real position is outside the view and the dot sits on the edge. */
  offMap: boolean;
}

export interface MapBase {
  name: string;
  x: number;
  y: number;
  offMap: boolean;
}

export interface DistanceMapLayout {
  size: number;
  center: number;
  /** Where the circuit is drawn (the middle, unless the view is fitted to content). */
  circuit: { x: number; y: number };
  viewRadiusKm: number;
  rings: { mins: number; r: number }[];
  dots: MapDot[];
  bases: MapBase[];
  /** Activities with no coordinates (not drawn). */
  missing: number;
}

const KM_PER_DEG_LAT = 110.574;
const KM_PER_DEG_LNG_EQUATOR = 111.32;
/** Keep dots inside the drawing: fraction of the radius used for the outermost position. */
const EDGE = 0.94;

/** Local flat projection around `origin`, in km (x east, y north). */
export function toLocalKm(p: LatLng, origin: LatLng): { x: number; y: number } {
  const cosLat = Math.cos((origin.lat * Math.PI) / 180);
  return {
    x: (p.lng - origin.lng) * KM_PER_DEG_LNG_EQUATOR * cosLat,
    y: (p.lat - origin.lat) * KM_PER_DEG_LAT,
  };
}

function hasCoords(e: { lat?: number | null; lng?: number | null }): e is { lat: number; lng: number } {
  return typeof e.lat === 'number' && typeof e.lng === 'number' && Number.isFinite(e.lat) && Number.isFinite(e.lng) && !(e.lat === 0 && e.lng === 0);
}

export interface LayoutOptions {
  /**
   * Centre the view on the circuit, fan bases and near / city activities
   * together instead of on the circuit. Zooms in when everything sits to one
   * side of the circuit (Sepang → Kuala Lumpur, 40 km north).
   */
  fitContent?: boolean;
}

export function layoutDistanceMap(
  items: DistanceMapInput[],
  raceSlug: string,
  circuit: LatLng,
  size = 600,
  opts: LayoutOptions = {}
): DistanceMapLayout {
  const center = size / 2;
  const bases = RACE_BASES[raceKey(raceSlug)] ?? [];
  const cityRingKm = radiusKmForMins(NEARBY_LIMITS.cityMins);

  const classified = items.map((item) => ({
    item,
    info: classifyExperience(hasCoords(item) ? { lat: item.lat, lng: item.lng } : null, raceSlug, circuit),
  }));

  // View radius: the ~60 min ring, stretched to fit fan bases and near / city activities.
  let viewRadiusKm = cityRingKm * 1.15;
  for (const b of bases) viewRadiusKm = Math.max(viewRadiusKm, haversineKm(circuit, b) * 1.15);
  for (const { item, info } of classified) {
    if (hasCoords(item) && (info.tier === 'near' || info.tier === 'city')) {
      viewRadiusKm = Math.max(viewRadiusKm, haversineKm(circuit, item) * 1.1);
    }
  }

  // View centre, in km from the circuit.
  let cx = 0;
  let cy = 0;
  if (opts.fitContent) {
    const pts = [{ x: 0, y: 0 }, ...bases.map((b) => toLocalKm(b, circuit))];
    for (const { item, info } of classified) {
      if (hasCoords(item) && (info.tier === 'near' || info.tier === 'city')) pts.push(toLocalKm(item, circuit));
    }
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    viewRadiusKm = Math.max(5, Math.max(...pts.map((p) => Math.hypot(p.x - cx, p.y - cy))) * 1.15);
  }

  const pxPerKm = (center * EDGE) / viewRadiusKm;

  const place = (p: LatLng) => {
    const local = toLocalKm(p, circuit);
    const x = local.x - cx;
    const y = local.y - cy;
    const dist = Math.hypot(x, y);
    const maxKm = viewRadiusKm;
    const offMap = dist > maxKm;
    const k = offMap ? maxKm / dist : 1;
    return {
      x: center + x * k * pxPerKm,
      y: center - y * k * pxPerKm, // north up
      offMap,
    };
  };

  const dots: MapDot[] = [];
  let missing = 0;
  for (const { item, info } of classified) {
    if (!hasCoords(item)) {
      missing++;
      continue;
    }
    dots.push({
      id: item.id,
      title: item.title,
      slug: item.slug,
      tier: info.tier,
      label: nearbyLabel(info),
      ...place(item),
    });
  }

  return {
    size,
    center,
    circuit: { x: center - cx * pxPerKm, y: center + cy * pxPerKm },
    viewRadiusKm,
    rings: [NEARBY_LIMITS.nearMins, NEARBY_LIMITS.cityMins].map((mins) => ({
      mins,
      r: radiusKmForMins(mins) * pxPerKm,
    })),
    dots,
    bases: bases.map((b) => ({ name: b.name, ...place(b) })),
    missing,
  };
}
