'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Polyline, CircleF } from '@react-google-maps/api';
import type { Experience } from '@/types/experience';
import { ALBERT_PARK_CIRCUIT } from '@/data/circuit-path';
import { CATEGORY_COLORS } from '@/lib/constants/categories';
import BookButton from '@/components/experiences/BookButton';
import {
  classifyExperience,
  nearbyLabel,
  radiusKmForMins,
  raceKey,
  NEARBY_LIMITS,
  RACE_BASES,
  type LatLng,
  type NearbyInfo,
  type NearbyTier,
} from '@/lib/nearby';
import { TIER_STYLE } from '@/lib/constants/nearby-styles';

// Used only when a race has no circuit coordinates (original Melbourne default)
const FALLBACK_CENTER = { lat: -37.8497, lng: 144.968 };

const isValidPoint = (p?: Partial<LatLng> | null): p is LatLng =>
  !!p && Number.isFinite(p.lat) && Number.isFinite(p.lng) && !(p.lat === 0 && p.lng === 0);

// Google Maps dark style matching app's #15151E background
const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a26' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#15151e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9a9aaf' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#c8c8d8' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#9a9aaf' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1f2a1f' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#4a7a4a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2c3e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1a1a26' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#7878a0' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3a3a52' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1a1a26' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#a0a0c0' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2a2a3e' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#9a9aaf' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d1b2a' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4a6a8a' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#0d1b2a' }] },
];

interface Props {
  experiences: Experience[];
  height?: string;
  raceSlug?: string;
  /** The race's circuit; the map centres here and measures distances from it. */
  circuit?: { lat: number; lng: number; name: string };
  /** Browser Maps key, passed from the server (GOOGLE_MAPS_API_KEY). */
  apiKey?: string;
}

export default function ExperienceMap({ experiences, height = '500px', raceSlug = '', circuit, apiKey: apiKeyProp }: Props) {
  const apiKey = apiKeyProp || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map',
    googleMapsApiKey: apiKey,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);

  const onLoad = useCallback((m: google.maps.Map) => setMap(m), []);
  const onUnmount = useCallback(() => setMap(null), []);

  const circuitPoint = isValidPoint(circuit) ? { lat: circuit.lat, lng: circuit.lng } : null;
  const bases = useMemo(() => RACE_BASES[raceKey(raceSlug)] ?? [], [raceSlug]);
  const isMelbourne = raceKey(raceSlug) === 'melbourne';

  // Distance group for every experience, using the same rules as the audit
  const nearbyById = useMemo(() => {
    const out = new Map<number, NearbyInfo>();
    for (const e of experiences) {
      out.set(e.id, classifyExperience({ lat: e.lat ?? undefined, lng: e.lng ?? undefined }, raceSlug, circuitPoint));
    }
    return out;
    // circuitPoint is derived from `circuit`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experiences, raceSlug, circuit?.lat, circuit?.lng]);

  const tierCounts = useMemo(() => {
    const counts: Record<NearbyTier, number> = { near: 0, city: 0, daytrip: 0, 'too-far': 0, unknown: 0 };
    nearbyById.forEach((n) => counts[n.tier]++);
    return counts;
  }, [nearbyById]);

  const center = circuitPoint ?? bases[0] ?? FALLBACK_CENTER;

  // Fit the view to the circuit, where fans stay, and the near / city pins
  useEffect(() => {
    if (!map || !isLoaded) return;

    const closePins = experiences.filter((e) => {
      const tier = nearbyById.get(e.id)?.tier;
      return isValidPoint({ lat: e.lat ?? undefined, lng: e.lng ?? undefined }) && (tier === 'near' || tier === 'city');
    });
    const anchors = [...(circuitPoint ? [circuitPoint] : []), ...bases];

    if (closePins.length === 0 && anchors.length <= 1) {
      map.panTo(center);
      map.setZoom(13);
      return;
    }

    const bounds = new window.google.maps.LatLngBounds();
    anchors.forEach((a) => bounds.extend({ lat: a.lat, lng: a.lng }));
    closePins.forEach((e) => bounds.extend({ lat: e.lat!, lng: e.lng! }));
    map.fitBounds(bounds, 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, isLoaded, experiences, nearbyById]);

  const neighborhoodGroups = useMemo(() => {
    const groups: Record<string, { count: number; lat: number; lng: number }> = {};
    for (const exp of experiences) {
      if (!exp.lat || !exp.lng || !exp.neighborhood) continue;
      if (!groups[exp.neighborhood]) {
        groups[exp.neighborhood] = { count: 0, lat: exp.lat, lng: exp.lng };
      }
      groups[exp.neighborhood].count += 1;
    }
    return Object.entries(groups)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([neighborhood, { count, lat, lng }]) => ({ neighborhood, count, lat, lng }));
  }, [experiences]);

  if (loadError) {
    return (
      <div className="w-full rounded-2xl flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border-subtle)]" style={{ height }}>
        <p className="text-[var(--text-secondary)] text-sm">Map failed to load.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return <div className="w-full rounded-2xl shimmer" style={{ height }} />;
  }

  const activeExp = activeId !== null ? experiences.find((e) => e.id === activeId) : null;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-[var(--border-subtle)]" style={{ height }}>
      <GoogleMap
        mapContainerClassName="w-full h-full"
        center={center}
        zoom={13}
        options={{
          styles: DARK_MAP_STYLE,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          clickableIcons: false,
        }}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        {/* Travel-time rings: ~30 / ~60 min from the circuit on race day */}
        {circuitPoint && (
          <>
            <CircleF
              center={circuitPoint}
              radius={radiusKmForMins(NEARBY_LIMITS.cityMins) * 1000}
              options={{ strokeColor: TIER_STYLE.city.color, strokeOpacity: 0.7, strokeWeight: 1.5, fillColor: TIER_STYLE.city.color, fillOpacity: 0.04, clickable: false, zIndex: 1 }}
            />
            <CircleF
              center={circuitPoint}
              radius={radiusKmForMins(NEARBY_LIMITS.nearMins) * 1000}
              options={{ strokeColor: TIER_STYLE.near.color, strokeOpacity: 0.8, strokeWeight: 1.5, fillColor: TIER_STYLE.near.color, fillOpacity: 0.06, clickable: false, zIndex: 2 }}
            />
          </>
        )}

        {/* Where fans stay (out-of-town circuits): marker + ~60 min ring */}
        {bases.map((b) => (
          <CircleF
            key={`ring-${b.name}`}
            center={{ lat: b.lat, lng: b.lng }}
            radius={radiusKmForMins(NEARBY_LIMITS.cityMins) * 1000}
            options={{ strokeColor: TIER_STYLE.city.color, strokeOpacity: 0.45, strokeWeight: 1, fillColor: TIER_STYLE.city.color, fillOpacity: 0.02, clickable: false, zIndex: 1 }}
          />
        ))}
        {bases.map((b) => (
          <Marker
            key={`base-${b.name}`}
            position={{ lat: b.lat, lng: b.lng }}
            title={`Where fans stay: ${b.name}`}
            label={{ text: '🏨', fontSize: '16px' }}
            icon={{ path: window.google.maps.SymbolPath.CIRCLE, scale: 0 }}
            zIndex={55}
          />
        ))}

        {/* Circuit track (outline data exists for Albert Park only) — outer glow */}
        {isMelbourne && <Polyline
          path={ALBERT_PARK_CIRCUIT}
          options={{
            strokeColor: '#E10600',
            strokeOpacity: 0.15,
            strokeWeight: 14,
            zIndex: 40,
          }}
        />}

        {/* Circuit track — solid inner line */}
        {isMelbourne && <Polyline
          path={ALBERT_PARK_CIRCUIT}
          options={{
            strokeColor: '#E10600',
            strokeOpacity: 1.0,
            strokeWeight: 4,
            zIndex: 50,
          }}
        />}

        {/* Circuit label — 🏁 at the race's circuit */}
        {circuitPoint && <Marker
          position={circuitPoint}
          title={circuit?.name ?? 'Circuit'}
          label={{
            text: '🏁',
            fontSize: '16px',
          }}
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 0,
          }}
          zIndex={60}
        />}

        {/* Experience pins, coloured by distance group */}
        {experiences.map((exp) => {
          if (!exp.lat || !exp.lng) return null;
          const style = TIER_STYLE[nearbyById.get(exp.id)?.tier ?? 'unknown'];
          const color = style.color;
          return (
            <Marker
              key={exp.id}
              position={{ lat: exp.lat, lng: exp.lng }}
              title={exp.title}
              icon={{
                path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                fillColor: color,
                fillOpacity: style.opacity,
                strokeColor: '#ffffff',
                strokeWeight: 1,
                scale: 1.5,
                anchor: new window.google.maps.Point(12, 22),
              }}
              zIndex={10}
              onClick={() => setActiveId(exp.id)}
            />
          );
        })}

        {/* Info window */}
        {activeExp && activeExp.lat && activeExp.lng && (
          <InfoWindow
            position={{ lat: activeExp.lat, lng: activeExp.lng }}
            onCloseClick={() => setActiveId(null)}
            options={{ pixelOffset: new window.google.maps.Size(0, -14) }}
          >
            <div
              style={{
                background: '#1e1e2e',
                border: '1px solid #3a3a52',
                borderRadius: '10px',
                overflow: 'hidden',
                minWidth: '220px',
                maxWidth: '260px',
                color: '#e0e0f0',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {/* Image or emoji header */}
              {activeExp.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeExp.imageUrl}
                  alt={activeExp.title}
                  style={{ width: '100%', height: '130px', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div style={{
                  height: '100px',
                  background: `linear-gradient(135deg, ${CATEGORY_COLORS[activeExp.category] ?? '#6E6E82'}30 0%, #1e1e2e 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '40px',
                }}>
                  {activeExp.imageEmoji}
                </div>
              )}
              {/* Content */}
              <div style={{ padding: '10px 12px' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', lineHeight: '1.3', marginBottom: '6px', color: '#ffffff' }}>
                  {activeExp.title}
                </div>
                {(() => {
                  const info = nearbyById.get(activeExp.id);
                  const text = info ? nearbyLabel(info) : null;
                  if (!info || !text) return null;
                  return (
                    <div style={{ fontSize: '12px', fontWeight: 600, color: TIER_STYLE[info.tier].color, marginBottom: '4px' }}>
                      {text}{info.tier === 'too-far' ? ' · too far' : ''}
                    </div>
                  );
                })()}
                <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#9a9aaf', marginBottom: '8px' }}>
                  <span>{activeExp.priceLabel}</span>
                  <span>·</span>
                  <span>{activeExp.durationLabel}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <a
                    href={raceSlug ? `/races/${raceSlug}/experiences/${activeExp.slug}` : `/experiences/${activeExp.slug}`}
                    style={{ fontSize: '12px', color: '#00D2BE', textDecoration: 'none', fontWeight: 500 }}
                  >
                    View →
                  </a>
                  <span style={{ color: '#3a3a52' }}>·</span>
                  <a
                    href={`https://maps.google.com/?q=${activeExp.lat},${activeExp.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '12px', color: '#9a9aaf', textDecoration: 'none' }}
                  >
                    Directions
                  </a>
                </div>
                <div style={{ marginTop: '8px' }}>
                  <BookButton
                    experience={activeExp}
                    source="map"
                    label="Book →"
                    className="w-full py-1.5 rounded-lg text-xs font-medium bg-[#E10600] hover:bg-[#c00500] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Neighborhood hint pills */}
      {neighborhoodGroups.length > 0 && (
        <div className="absolute top-4 right-14 flex flex-col gap-1.5" style={{ zIndex: 10 }}>
          {neighborhoodGroups.map(({ neighborhood, count, lat, lng }) => (
            <button
              key={neighborhood}
              onClick={() => { map?.panTo({ lat, lng }); map?.setZoom(15); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap cursor-pointer"
              style={{
                background: 'rgba(21,21,30,0.85)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#e0e0f0',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
            >
              <span style={{ color: '#9a9aaf' }}>←</span>
              {neighborhood}
              <span
                className="inline-flex items-center justify-center rounded-full text-[10px] font-semibold"
                style={{ background: '#E10600', color: '#fff', width: 18, height: 18, flexShrink: 0 }}
              >
                {count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Legend: circuit + distance groups */}
      <div
        className="absolute bottom-4 left-4 flex flex-col gap-1 px-3 py-2 rounded-xl text-xs font-medium pointer-events-none"
        style={{ background: 'rgba(21,21,30,0.88)', border: '1px solid rgba(255,255,255,0.15)', color: '#e0e0f0', zIndex: 10 }}
      >
        <div className="flex items-center gap-2">
          <span>🏁</span>
          {circuit?.name || 'Circuit'}
        </div>
        {(['near', 'city', 'daytrip', 'too-far'] as NearbyTier[])
          .filter((t) => tierCounts[t] > 0)
          .map((t) => (
            <div key={t} className="flex items-center gap-2">
              <span className="inline-block rounded-full" style={{ width: 10, height: 10, background: TIER_STYLE[t].color, opacity: TIER_STYLE[t].opacity, flexShrink: 0 }} />
              {TIER_STYLE[t].label} · {tierCounts[t]}
            </div>
          ))}
        {bases.length > 0 && (
          <div className="flex items-center gap-2"><span>🏨</span>Where fans stay</div>
        )}
        {circuitPoint && (
          <div style={{ color: '#9a9aaf' }}>Rings: ~{NEARBY_LIMITS.nearMins} / ~{NEARBY_LIMITS.cityMins} min on race day</div>
        )}
      </div>
    </div>
  );
}
