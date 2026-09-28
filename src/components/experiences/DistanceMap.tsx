'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { layoutDistanceMap, type DistanceMapInput } from '@/lib/distance-map';
import { TIER_STYLE } from '@/lib/constants/nearby-styles';
import type { NearbyTier } from '@/lib/nearby';

/**
 * Free, self-drawn distance map: circuit in the middle, ~30 / ~60 min rings,
 * every activity as a dot at its real bearing and distance. No Google Maps
 * load, so it costs nothing however many people view it.
 */
interface Props {
  experiences: DistanceMapInput[];
  raceSlug: string;
  circuit: { lat: number; lng: number; name: string };
  /** Smaller version for the experiences list page. */
  compact?: boolean;
}

const SIZE = 600;

export default function DistanceMap({ experiences, raceSlug, circuit, compact = false }: Props) {
  const layout = useMemo(
    () => layoutDistanceMap(experiences, raceSlug, { lat: circuit.lat, lng: circuit.lng }, SIZE),
    [experiences, raceSlug, circuit.lat, circuit.lng]
  );
  const [hoverId, setHoverId] = useState<number | null>(null);
  const hovered = hoverId !== null ? layout.dots.find((d) => d.id === hoverId) : null;

  const counts = useMemo(() => {
    const c: Record<NearbyTier, number> = { near: 0, city: 0, daytrip: 0, 'too-far': 0, unknown: 0 };
    layout.dots.forEach((d) => c[d.tier]++);
    return c;
  }, [layout]);

  // Scale bar: a round number of km close to a fifth of the view
  const pxPerKm = (layout.center * 0.94) / layout.viewRadiusKm;
  const scaleKm = [1, 2, 5, 10, 20, 50, 100].find((k) => k * pxPerKm >= SIZE / 8) ?? 100;

  // Draw far dots first so near ones sit on top
  const order: NearbyTier[] = ['too-far', 'unknown', 'daytrip', 'city', 'near'];
  const dots = [...layout.dots].sort((a, b) => order.indexOf(a.tier) - order.indexOf(b.tier));

  return (
    <div className={compact ? '' : 'w-full'}>
      <div
        className="relative mx-auto rounded-2xl overflow-hidden border border-[var(--border-subtle)]"
        style={{ background: '#1a1a26', maxWidth: compact ? 420 : 640, aspectRatio: '1 / 1' }}
      >
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ userSelect: 'none' }}
          className="w-full h-full block"
          role="img"
          aria-label={`Map of experiences around ${circuit.name}, with 30 and 60 minute travel rings`}
        >
          {/* Rings: ~60 min (outer) and ~30 min (inner) on race day */}
          {[...layout.rings].reverse().map((ring) => {
            const tier = ring.mins <= 30 ? 'near' : 'city';
            return (
              <g key={ring.mins} pointerEvents="none">
                <circle
                  cx={layout.center}
                  cy={layout.center}
                  r={ring.r}
                  fill={TIER_STYLE[tier].color}
                  fillOpacity={0.06}
                  stroke={TIER_STYLE[tier].color}
                  strokeOpacity={0.7}
                  strokeDasharray="6 5"
                />
                <text
                  x={layout.center}
                  y={layout.center - ring.r - 6}
                  textAnchor="middle"
                  fontSize="13"
                  fill={TIER_STYLE[tier].color}
                >
                  ~{ring.mins} min
                </text>
              </g>
            );
          })}

          {/* Where fans stay */}
          {layout.bases.map((b) => (
            <g key={b.name} pointerEvents="none">
              <text x={b.x} y={b.y + 6} textAnchor="middle" fontSize="18">🏨</text>
              <text x={b.x} y={b.y + 24} textAnchor="middle" fontSize="12" fill="#c8c8d8">
                {b.name}
              </text>
            </g>
          ))}

          {/* Activities */}
          {dots.map((d) => {
            const style = TIER_STYLE[d.tier];
            const active = d.id === hoverId;
            return (
              <Link
                key={d.id}
                href={`/races/${raceSlug}/experiences/${d.slug}`}
                aria-label={`${d.title}${d.label ? `, ${d.label}` : ''}`}
                onMouseEnter={() => setHoverId(d.id)}
                onMouseLeave={() => setHoverId((id) => (id === d.id ? null : id))}
                onFocus={() => setHoverId(d.id)}
                onBlur={() => setHoverId((id) => (id === d.id ? null : id))}
              >
                <circle
                  cx={d.x}
                  cy={d.y}
                  r={active ? 10 : d.offMap ? 6 : 7}
                  fill={d.offMap ? '#1a1a26' : style.color}
                  fillOpacity={d.offMap ? 1 : style.opacity}
                  stroke={d.offMap ? style.color : '#ffffff'}
                  strokeWidth={d.offMap ? 2 : 1.5}
                  strokeOpacity={d.offMap ? 0.8 : 0.9}
                  style={{ cursor: 'pointer', transition: 'r 120ms' }}
                />
                {/* Larger invisible target for easier hovering / tapping */}
                <circle cx={d.x} cy={d.y} r={14} fill="transparent" />
              </Link>
            );
          })}

          {/* Circuit */}
          <text x={layout.center} y={layout.center + 8} textAnchor="middle" fontSize="22" pointerEvents="none">🏁</text>
          <text x={layout.center} y={layout.center + 28} textAnchor="middle" fontSize="12" fontWeight="600" fill="#ffffff" pointerEvents="none">
            {circuit.name}
          </text>

          {/* North arrow + scale */}
          <text x={22} y={30} textAnchor="middle" fontSize="13" fill="#9a9aaf">N</text>
          <path d="M22 36 L16 50 L22 46 L28 50 Z" fill="#9a9aaf" />
          <g transform={`translate(${SIZE - 20 - scaleKm * pxPerKm}, ${SIZE - 24})`}>
            <line x1={0} y1={0} x2={scaleKm * pxPerKm} y2={0} stroke="#9a9aaf" strokeWidth={2} />
            <line x1={0} y1={-4} x2={0} y2={4} stroke="#9a9aaf" strokeWidth={2} />
            <line x1={scaleKm * pxPerKm} y1={-4} x2={scaleKm * pxPerKm} y2={4} stroke="#9a9aaf" strokeWidth={2} />
            <text x={(scaleKm * pxPerKm) / 2} y={-8} textAnchor="middle" fontSize="12" fill="#9a9aaf">
              {scaleKm} km
            </text>
          </g>
        </svg>

        {/* Hover card */}
        {hovered && (
          <div
            className="absolute pointer-events-none px-3 py-2 rounded-lg text-xs shadow-lg"
            style={{
              left: `${(hovered.x / SIZE) * 100}%`,
              top: `${(hovered.y / SIZE) * 100}%`,
              transform: `translate(${hovered.x > SIZE * 0.65 ? '-100%' : '0'}, ${hovered.y > SIZE * 0.8 ? 'calc(-100% - 14px)' : '14px'})`,
              background: 'rgba(21,21,30,0.95)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: '#e0e0f0',
              maxWidth: 240,
              zIndex: 10,
            }}
          >
            <div className="font-semibold text-white leading-snug">{hovered.title}</div>
            {hovered.label && (
              <div style={{ color: TIER_STYLE[hovered.tier].color }} className="mt-0.5 font-medium">
                {hovered.label}
                {hovered.tier === 'too-far' ? ' · too far' : ''}
              </div>
            )}
            {hovered.offMap && <div className="mt-0.5 text-[#9a9aaf]">Further away than shown →</div>}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">
        {(['near', 'city', 'daytrip', 'too-far'] as NearbyTier[])
          .filter((t) => counts[t] > 0)
          .map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5">
              <span className="inline-block rounded-full" style={{ width: 9, height: 9, background: TIER_STYLE[t].color, opacity: TIER_STYLE[t].opacity }} />
              {TIER_STYLE[t].label} · {counts[t]}
            </span>
          ))}
        {layout.bases.length > 0 && <span>🏨 Where fans stay</span>}
        <span>○ Outer dots are further than shown</span>
      </div>
      {!compact && (
        <p className="mt-1 text-center text-xs text-[var(--text-secondary)] opacity-70">
          Travel times are estimates for race day (traffic included). Hover or tap a dot for details.
        </p>
      )}
    </div>
  );
}
