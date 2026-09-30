'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { GoogleMap, InfoWindowF, MarkerF, useJsApiLoader } from '@react-google-maps/api';
import { LIGHT_MAP_STYLE } from '@/lib/map-style';
import { TIER_STYLE } from '@/lib/constants/nearby-styles';
import { RACE_BASES, raceKey, type NearbyTier } from '@/lib/nearby';

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
  /** Tours without an exact spot (somewhere in the city): drawn as a pale area, not a pin. */
  area?: boolean;
}

interface Props {
  spots: MapSpot[];
  raceSlug: string;
  circuit: { lat: number; lng: number; name: string };
  /** Browser Maps key, passed from the server (GOOGLE_MAPS_API_KEY). */
  apiKey: string;
  height?: string;
  onSelect?: (id: number) => void;
  selectedId?: number | null;
  /** Legend numbers per distance group; defaults to pins per group. */
  legendCounts?: Partial<Record<NearbyTier, number>>;
}

const LEGEND_TIERS: NearbyTier[] = ['near', 'city', 'daytrip'];

/** Real Google map of experiences around a circuit, pins coloured by travel time. */
export default function GoogleSpotsMap({ spots, raceSlug, circuit, apiKey, height = '480px', onSelect, selectedId = null, legendCounts }: Props) {
  const { isLoaded, loadError } = useJsApiLoader({ id: 'google-map', googleMapsApiKey: apiKey });
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const bases = useMemo(() => RACE_BASES[raceKey(raceSlug)] ?? [], [raceSlug]);

  // Stable initial centre: a new object each render would re-centre the map
  // and undo the fit below.
  const initialCenter = useMemo(() => ({ lat: circuit.lat, lng: circuit.lng }), [circuit.lat, circuit.lng]);

  const onLoad = useCallback((m: google.maps.Map) => setMap(m), []);
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

  const open = openId !== null ? spots.find((s) => s.id === openId) : null;
  const G = window.google.maps;

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
          onClick={() => setOpenId(null)}
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
          {spots.map((s) => {
            const n = s.count ?? 1;
            const selected = s.id === selectedId;
            if (s.area) {
              return (
                <MarkerF
                  key={s.id}
                  position={{ lat: s.lat, lng: s.lng }}
                  title={s.title}
                  zIndex={selected ? 800 : 1}
                  label={{ text: String(n), color: '#15151E', fontSize: '12px', fontWeight: '700' }}
                  icon={{
                    path: G.SymbolPath.CIRCLE,
                    scale: 26,
                    fillColor: TIER_STYLE[s.tier].color,
                    fillOpacity: 0.18,
                    strokeColor: selected ? '#15151E' : TIER_STYLE[s.tier].color,
                    strokeWeight: selected ? 3 : 1.5,
                  }}
                  onClick={() => {
                    setOpenId(s.id);
                    onSelect?.(s.id);
                  }}
                />
              );
            }
            return (
              <MarkerF
                key={s.id}
                position={{ lat: s.lat, lng: s.lng }}
                title={s.title}
                zIndex={selected ? 800 : n}
                label={n > 1 ? { text: String(n), color: '#FFFFFF', fontSize: '11px', fontWeight: '700' } : undefined}
                icon={{
                  path: G.SymbolPath.CIRCLE,
                  scale: n > 1 ? Math.min(20, 10 + Math.log2(n) * 2) : 7,
                  fillColor: TIER_STYLE[s.tier].color,
                  fillOpacity: 1,
                  strokeColor: selected ? '#15151E' : '#FFFFFF',
                  strokeWeight: selected ? 3 : 2,
                }}
                onClick={() => {
                  setOpenId(s.id);
                  onSelect?.(s.id);
                }}
              />
            );
          })}
          {open && (
            <InfoWindowF position={{ lat: open.lat, lng: open.lng }} onCloseClick={() => setOpenId(null)}>
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
        {spots.some((s) => s.area) && (
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block rounded-full border" style={{ width: 11, height: 11, borderColor: TIER_STYLE.city.color, background: `${TIER_STYLE.city.color}2e` }} />
            Across the city (no exact spot)
          </span>
        )}
      </div>
    </div>
  );
}
