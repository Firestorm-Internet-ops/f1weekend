'use client';

import { useMemo, useState } from 'react';
import GoogleSpotsMap, { type MapSpot } from '@/components/experiences/GoogleSpotsMap';
import { TIER_STYLE } from '@/lib/constants/nearby-styles';
import { providerName } from '@/lib/providers/meta';
import { openFeedBooking } from '@/lib/analytics';
import type { FeedCard } from '@/lib/providers/nearby-feed';
import { haversineKm, type NearbyTier } from '@/lib/nearby';

/** Experiences closer together than this share one pin (pins would overlap at map scale). */
const CLUSTER_KM = 2;

interface Props {
  cards: FeedCard[];
  raceSlug: string;
  circuit: { lat: number; lng: number; name: string };
  /** Cards shown before "Show more". */
  pageSize?: number;
  /** Home page version: map + first cards + link to the full list. */
  compact?: boolean;
  moreHref?: string;
  /** Google Maps browser key (GOOGLE_MAPS_API_KEY), passed from the server. */
  mapsApiKey: string;
}

type TierFilter = 'all' | NearbyTier;

function price(amount: number | null, currency: string): string {
  if (amount == null) return 'See price';
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Math.ceil(amount));
  } catch {
    return `${currency} ${Math.ceil(amount)}`;
  }
}

function duration(h: number | null): string | null {
  if (!h) return null;
  if (h < 1) return `${Math.round(h * 60)} min`;
  return `${Number.isInteger(h) ? h : h.toFixed(1)} h`;
}

interface MapPoint {
  id: number;
  lat: number;
  lng: number;
  cards: FeedCard[];
}

/** Greedy clustering: each card joins the first pin within CLUSTER_KM, else starts one. */
function clusterCards(cards: FeedCard[]): MapPoint[] {
  const points: MapPoint[] = [];
  for (const c of cards) {
    if (c.lat == null || c.lng == null) continue;
    const here = { lat: c.lat, lng: c.lng };
    const near = points.find((p) => haversineKm(p, here) <= CLUSTER_KM);
    if (near) near.cards.push(c);
    else points.push({ id: points.length, lat: c.lat, lng: c.lng, cards: [c] });
  }
  return points;
}

/** The place name most cards at a pin share, e.g. "Kuala Lumpur". */
function pointName(p: MapPoint): string {
  const counts = new Map<string, number>();
  for (const c of p.cards) if (c.locationName) counts.set(c.locationName, (counts.get(c.locationName) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? p.cards[0].title;
}

export default function NearbyFeed({ cards, raceSlug, circuit, pageSize = 24, compact = false, moreHref, mapsApiKey }: Props) {
  const [tier, setTier] = useState<TierFilter>('all');
  const [pointId, setPointId] = useState<number | null>(null);
  const [shown, setShown] = useState(pageSize);

  const points = useMemo(() => clusterCards(cards), [cards]);

  const pointOfCard = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of points) for (const c of p.cards) m.set(c.key, p.id);
    return m;
  }, [points]);

  const spots: MapSpot[] = points.map((p) => ({
    id: p.id,
    lat: p.lat,
    lng: p.lng,
    tier: p.cards[0].nearby.tier,
    title: p.cards.length > 1 ? `${pointName(p)} · ${p.cards.length} experiences` : p.cards[0].title,
    subtitle: p.cards[0].nearbyLabel,
    count: p.cards.length,
  }));

  const tierCounts = useMemo(() => {
    const c: Record<NearbyTier, number> = { near: 0, city: 0, daytrip: 0, unknown: 0, 'too-far': 0 };
    for (const card of cards) c[card.nearby.tier]++;
    return c;
  }, [cards]);

  const filtered = cards.filter(
    (c) => (tier === 'all' || c.nearby.tier === tier) && (pointId === null || pointOfCard.get(c.key) === pointId)
  );
  const visible = filtered.slice(0, compact ? pageSize : shown);
  const selectedPoint = pointId !== null ? points.find((p) => p.id === pointId) : null;

  const selectPoint = (id: number) => {
    setPointId((cur) => (cur === id ? null : id));
    setShown(pageSize);
    if (!compact) document.getElementById('nearby-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const chips: { id: TierFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: cards.length },
    { id: 'near', label: 'Near the circuit', count: tierCounts.near },
    { id: 'city', label: 'In the city', count: tierCounts.city },
    { id: 'daytrip', label: 'Day trips', count: tierCounts.daytrip },
  ];

  return (
    <div>
      <div className={compact ? 'grid lg:grid-cols-[minmax(0,420px)_1fr] gap-6 items-start' : ''}>
        <div className={compact ? '' : 'mb-8'}>
          <GoogleSpotsMap
            apiKey={mapsApiKey}
            raceSlug={raceSlug}
            circuit={circuit}
            spots={spots}
            onSelect={selectPoint}
            selectedId={pointId}
            legendCounts={tierCounts}
            height={compact ? '420px' : '520px'}
          />
        </div>

        <div>
          {!compact && (
            <div className="flex flex-wrap items-center gap-2 mb-4" role="group" aria-label="Filter by distance">
              {chips.filter((c) => c.id === 'all' || c.count > 0).map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setTier(c.id); setShown(pageSize); }}
                  aria-pressed={tier === c.id}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    tier === c.id
                      ? 'border-white text-[var(--text-primary)] bg-[var(--bg-tertiary)]'
                      : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {c.id !== 'all' && (
                    <span className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle" style={{ background: TIER_STYLE[c.id as NearbyTier].color }} />
                  )}
                  {c.label} · {c.count}
                </button>
              ))}
            </div>
          )}

          {selectedPoint && (
            <div className="flex items-center justify-between gap-3 mb-4 px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-sm">
              <span className="text-[var(--text-primary)]">
                📍 {pointName(selectedPoint)} · {selectedPoint.cards.length} experience{selectedPoint.cards.length === 1 ? '' : 's'}
              </span>
              <button onClick={() => setPointId(null)} className="text-[var(--accent-teal,#00D2BE)] hover:underline">Show all</button>
            </div>
          )}

          <div
            id="nearby-grid"
            className={`grid gap-4 scroll-mt-24 ${compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}
          >
            {visible.map((c) => (
              <FeedCardView key={c.key} card={c} raceSlug={raceSlug} onPin={() => { const id = pointOfCard.get(c.key); if (id !== undefined) selectPoint(id); }} />
            ))}
          </div>

          {filtered.length === 0 && <p className="text-[var(--text-secondary)] text-sm">Nothing here yet.</p>}

          {compact ? (
            moreHref && (
              <a href={moreHref} className="inline-block mt-5 text-sm text-[var(--accent-teal,#00D2BE)] hover:underline">
                See all {cards.length} experiences, nearest first →
              </a>
            )
          ) : (
            filtered.length > shown && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setShown((n) => n + pageSize)}
                  className="px-5 py-2.5 rounded-full border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] hover:border-[var(--border-medium)]"
                >
                  Show more ({filtered.length - shown} left)
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function FeedCardView({ card, raceSlug, onPin }: { card: FeedCard; raceSlug: string; onPin: () => void }) {
  const style = TIER_STYLE[card.nearby.tier];
  const best = card.offers[0];
  const dur = duration(card.durationHours);
  return (
    <article className="flex flex-col rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-secondary)] shadow-[0_1px_2px_rgba(21,21,30,0.04)] hover:shadow-[0_8px_24px_rgba(21,21,30,0.08)] transition-shadow">
      <div className="relative aspect-[16/10] bg-[var(--bg-tertiary)]">
        {card.imageUrl && (
          // Images come from three providers' CDNs; a plain <img> avoids per-host image config.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.imageUrl} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <button
          onClick={onPin}
          disabled={card.lat == null}
          className="absolute left-3 top-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-[var(--text-primary)] disabled:cursor-default"
          style={{ background: 'rgba(255,255,255,0.94)', boxShadow: '0 1px 3px rgba(21,21,30,0.18)' }}
          title="Show on map"
        >
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: style.color }} />
          {card.nearbyLabel ?? 'Location unknown'}
        </button>
      </div>

      <div className="flex flex-col flex-1 p-4">
        <h3 className="font-semibold text-[var(--text-primary)] leading-snug mb-1.5 line-clamp-2">{card.title}</h3>
        <p className="text-xs text-[var(--text-secondary)] mb-3">
          {card.circuitKm != null && <>{card.circuitKm} km from the circuit</>}
          {card.locationName && <> · {card.approximateLocation ? 'in ' : 'at '}{card.locationName}</>}
          {dur && <> · {dur}</>}
          {card.rating ? <> · ★ {card.rating.toFixed(1)}{card.reviewCount ? ` (${card.reviewCount.toLocaleString()})` : ''}</> : null}
        </p>

        <div className="mt-auto space-y-1.5">
          {card.offers.map((o, i) => {
            const lowest = i === 0 && card.offers.length > 1 && o.priceAmount != null;
            return (
              <button
                key={`${o.provider}:${o.productId}`}
                onClick={() => openFeedBooking(raceSlug, o)}
                className={`group w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${
                  i === 0
                    ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-white hover:bg-[var(--accent-red)] hover:border-[var(--accent-red)]'
                    : 'border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--text-primary)]'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {providerName(o.provider)}
                  {lowest && <span className="text-[10px] font-bold uppercase-label px-1.5 py-0.5 rounded bg-white/15">Lowest</span>}
                </span>
                <span className="font-semibold">{price(o.priceAmount, o.priceCurrency)} →</span>
              </button>
            );
          })}
          {best?.freeCancellation && <p className="text-[11px] text-[var(--text-secondary)]">Free cancellation on {providerName(best.provider)}</p>}
        </div>
      </div>
    </article>
  );
}
