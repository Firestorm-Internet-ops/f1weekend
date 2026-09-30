'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { GoogleMap, InfoWindowF, MarkerF, useJsApiLoader } from '@react-google-maps/api';
import { LIGHT_MAP_STYLE } from '@/lib/map-style';
import { TIER_STYLE } from '@/lib/constants/nearby-styles';
import { RACE_BASES, raceKey, type NearbyTier } from '@/lib/nearby';
import { groupByZoom, type PinGroup } from '@/lib/map-groups';

/** One pin: a single experience, or several at (nearly) the same place. */
export interface MapSpot {
  id: number;
  lat: number;
  lng: number;
  tier: NearbyTier;
  title: string;
  /** e.g. "30 min from the circuit". */
  subtitle?: string | null;
  /** Experiences at this pin (drawn on the pin when > 1). */
  count?: number;
  /** Link shown in the pin's info window. */
  href?: string;
  /** No exact spot (placed near its city centre): drawn as a hollow pin. */
  approx?: boolean;
}

interface Props {
  spots: MapSpot[];
  raceSlug: string;
  circuit: { lat: number; lng: number; name: string };
  /** Browser Maps key, passed from the server (GOOGLE_MAPS_API_KEY). */
  apiKey: string;
  height?: string;
  /** A pin (or a group you can't zoom into further) was chosen: the spot ids in it. */
  onSelect?: (ids: number[]) => void;
  selectedIds?: number[] | null;
  /** Legend numbers per distance group; defaults to pins per group. */
  legendCounts?: Partial<Record<NearbyTier, number>>;
}

const LEGEND_TIERS: NearbyTier[] = ['near', 'city', 'daytrip'];
/** Pins closer than this on screen are drawn as one group; zooming in splits them. */
const GROUP_PX = 44;
/** From this zoom a group opens instead of zooming further. */
const MAX_GROUP_ZOOM = 16;

type Group = PinGroup<MapSpot>;

/** Real Google map of experiences around a circuit, pins coloured by travel time. */
export default function GoogleSpotsMap({ spots, raceSlug, circuit, apiKey, height = '480px', onSelect, selectedIds = null, legendCounts }: Props) {
  const { isLoaded, loadError } = useJsApiLoader({ id: 'google-map', googleMapsApiKey: apiKey });
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [zoom, setZoom] = useState(11);
  const bases = useMemo(() => RACE_BASES[raceKey(raceSlug)] ?? [], [raceSlug]);

  // Stable initial centre: a new object each render would re-centre the map
  // and undo the fit below.
  const initialCenter = useMemo(() => ({ lat: circuit.lat, lng: circuit.lng }), [circuit.lat, circuit.lng]);

  const onLoad = useCallback((m: google.maps.Map) => setMap(m), []);
  const onZoom = useCallback(() => { if (map) setZoom(map.getZoom() ?? 11); }, [map]);
  const groups = useMemo(() => groupByZoom(spots, zoom, circuit.lat, GROUP_PX), [spots, zoom, circuit.lat]);
  const selected = useMemo(() => new Set(selectedIds ?? []), [selectedIds]);
  const onUnmount = useCallback(() => setMap(null), []);

  // Fit to the circuit, where fans stay, and everything near / in the city.
  useEffect(() => {
    if (!map || !isLoaded) return;
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend({ lat: circuit.lat, lng: circuit.lng });
    bases.forEach((b) => bounds.extend({ lat: b.lat, lng: b.lng }));
    spots.filter((s) => s.tier === 'near' || s.tier === 'city').forEach((s) => bounds.extend({ lat: s.lat, lng: s.lng }));
    map.fitBounds(bounds, 48);
  }, [map, isLoaded, spots, bases, circuit.lat, circuit.lng]);

  const counts = useMemo(() => {
    const c: Record<NearbyTier, number> = { near: 0, city: 0, daytrip: 0, 'too-far': 0, unknown: 0 };
    spots.forEach((s) => c[s.tier]++);
    return { ...c, ...legendCounts };
  }, [spots, legendCounts]);

  if (!apiKey || loadError) {
    return (
      <div className="w-full rounded-2xl flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border-subtle)]" style={{ height }}>
        <p className="text-[var(--text-secondary)] text-sm">Map unavailable right now.</p>
      </div>
    );
  }
  if (!isLoaded) return <div className="w-full rounded-2xl shimmer" style={{ height }} />;

  const openGroup = openKey !== null ? groups.find((g) => g.key === openKey) : null;
  const open = openGroup
    ? openGroup.members.length === 1
      ? openGroup.members[0]
      : { lat: openGroup.lat, lng: openGroup.lng, title: `${openGroup.count} experiences here`, subtitle: 'Listed below the map', href: undefined }
    : null;
  const G = window.google.maps;

  /** A group zooms in until its pins separate; a single pin (or a tight group) opens. */
  const choose = (g: Group) => {
    if (g.members.length > 1 && map && zoom < MAX_GROUP_ZOOM) {
      const b = new G.LatLngBounds();
      g.members.forEach((m) => b.extend({ lat: m.lat, lng: m.lng }));
      map.fitBounds(b, 64);
      if ((map.getZoom() ?? 0) <= zoom) map.setZoom(zoom + 2);
      setOpenKey(null);
      return;
    }
    setOpenKey(g.key);
    onSelect?.(g.members.map((m) => m.id));
  };

  return (
    <div>
      <div className="relative w-full rounded-2xl overflow-hidden border border-[var(--border-subtle)]" style={{ height }}>
        <GoogleMap
          mapContainerClassName="w-full h-full"
          center={initialCenter}
          zoom={11}
          options={{
            styles: LIGHT_MAP_STYLE,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            clickableIcons: false,
            gestureHandling: 'cooperative',
          }}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onZoomChanged={onZoom}
          onClick={() => setOpenKey(null)}
        >
          <MarkerF
            position={{ lat: circuit.lat, lng: circuit.lng }}
            title={circuit.name}
            label={{ text: '🏁', fontSize: '22px' }}
            icon={{ path: G.SymbolPath.CIRCLE, scale: 0 }}
            zIndex={1000}
          />
          {bases.map((b) => (
            <MarkerF
              key={b.name}
              position={{ lat: b.lat, lng: b.lng }}
              title={`${b.name} — where fans stay`}
              label={{ text: '🏨', fontSize: '18px' }}
              icon={{ path: G.SymbolPath.CIRCLE, scale: 0 }}
              zIndex={900}
            />
          ))}
          {groups.map((g) => {
            const n = g.count;
            const isSelected = g.members.some((m) => selected.has(m.id));
            // A group of only approximate pins is drawn hollow too.
            const approx = g.members.every((m) => m.approx);
            const color = TIER_STYLE[g.tier].color;
            return (
              <MarkerF
                key={g.key}
                position={{ lat: g.lat, lng: g.lng }}
                title={g.members.length === 1 ? g.members[0].title : `${n} experiences`}
                zIndex={isSelected ? 800 : approx ? 1 : n + 1}
                label={n > 1 ? { text: String(n), color: approx ? color : '#FFFFFF', fontSize: '11px', fontWeight: '700' } : undefined}
                icon={{
                  path: G.SymbolPath.CIRCLE,
                  scale: n > 1 ? Math.min(20, 10 + Math.log2(n) * 2) : 7,
                  fillColor: approx ? '#FFFFFF' : color,
                  fillOpacity: 1,
                  strokeColor: isSelected ? '#15151E' : approx ? color : '#FFFFFF',
                  strokeWeight: isSelected ? 3 : 2,
                }}
                onClick={() => choose(g)}
              />
            );
          })}
          {open && (
            <InfoWindowF position={{ lat: open.lat, lng: open.lng }} onCloseClick={() => setOpenKey(null)}>
              <div style={{ color: '#15151e', maxWidth: 220 }}>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{open.title}</div>
                {open.subtitle && <div style={{ fontSize: 12 }}>{open.subtitle}</div>}
                {open.href && (
                  <Link href={open.href} style={{ fontSize: 12, color: '#E10600', display: 'inline-block', marginTop: 4 }}>
                    View experience →
                  </Link>
                )}
              </div>
            </InfoWindowF>
          )}
        </GoogleMap>
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">
        {LEGEND_TIERS.filter((t) => counts[t] > 0).map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5">
            <span className="inline-block rounded-full" style={{ width: 9, height: 9, background: TIER_STYLE[t].color }} />
            {TIER_STYLE[t].label} · {counts[t]}
          </span>
        ))}
        {bases.length > 0 && <span>🏨 Where fans stay</span>}
        {spots.some((s) => s.approx) && (
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block rounded-full border-2 bg-white" style={{ width: 11, height: 11, borderColor: TIER_STYLE.city.color }} />
            Approximate (no exact spot from the booking site)
          </span>
        )}
      </div>
    </div>
  );
}
