'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Polyline } from '@react-google-maps/api';
import type { Experience } from '@/types/experience';
import { ALBERT_PARK_CIRCUIT } from '@/data/circuit-path';
import { CATEGORY_COLORS } from '@/lib/constants/categories';

const CIRCUIT = { lat: -37.8497, lng: 144.968 };

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
}

export default function ExperienceMap({ experiences, height = '500px' }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map',
    googleMapsApiKey: apiKey,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);

  const onLoad = useCallback((m: google.maps.Map) => setMap(m), []);
  const onUnmount = useCallback(() => setMap(null), []);

  // Fit bounds to nearby pins only (exclude day trips > 15 km)
  useEffect(() => {
    if (!map || !isLoaded) return;

    const nearbyPins = experiences.filter(
      (e) => e.lat != null && e.lng != null && (e.distanceKm ?? Infinity) <= 15
    );

    if (nearbyPins.length === 0) {
      map.panTo(CIRCUIT);
      map.setZoom(14);
      return;
    }

    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(CIRCUIT);
    nearbyPins.forEach((e) => bounds.extend({ lat: e.lat!, lng: e.lng! }));
    map.fitBounds(bounds, 60);
  }, [map, isLoaded, experiences]);

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
        center={CIRCUIT}
        zoom={14}
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
        {/* Circuit track — outer glow */}
        <Polyline
          path={ALBERT_PARK_CIRCUIT}
          options={{
            strokeColor: '#E10600',
            strokeOpacity: 0.15,
            strokeWeight: 14,
            zIndex: 40,
          }}
        />

        {/* Circuit track — solid inner line */}
        <Polyline
          path={ALBERT_PARK_CIRCUIT}
          options={{
            strokeColor: '#E10600',
            strokeOpacity: 1.0,
            strokeWeight: 4,
            zIndex: 50,
          }}
        />

        {/* Circuit label — 🏁 emoji at S/F line */}
        <Marker
          position={{ lat: -37.8450, lng: 144.9695 }}
          title="Albert Park Circuit"
          label={{
            text: '🏁',
            fontSize: '16px',
          }}
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 0,
          }}
          zIndex={60}
        />

        {/* Experience pins */}
        {experiences.map((exp) => {
          if (!exp.lat || !exp.lng) return null;
          const color = CATEGORY_COLORS[exp.category] ?? '#6E6E82';
          return (
            <Marker
              key={exp.id}
              position={{ lat: exp.lat, lng: exp.lng }}
              title={exp.title}
              icon={{
                path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                fillColor: color,
                fillOpacity: 0.9,
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
                <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#9a9aaf', marginBottom: '8px' }}>
                  <span>{activeExp.priceLabel}</span>
                  <span>·</span>
                  <span>{activeExp.durationLabel}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <a
                    href={`/experiences/${activeExp.slug}`}
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

      {/* Circuit legend */}
      <div
        className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium pointer-events-none"
        style={{ background: 'rgba(21,21,30,0.85)', border: '1px solid rgba(255,255,255,0.15)', color: '#e0e0f0' }}
      >
        <span
          className="inline-block rounded-full"
          style={{ width: 12, height: 12, background: '#E10600', border: '2px solid #fff', flexShrink: 0 }}
        />
        Albert Park Circuit
      </div>
    </div>
  );
}
