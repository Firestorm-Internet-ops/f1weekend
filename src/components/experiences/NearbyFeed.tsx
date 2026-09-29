'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import GoogleSpotsMap, { type MapSpot } from '@/components/experiences/GoogleSpotsMap';
import { TIER_STYLE } from '@/lib/constants/nearby-styles';
import { providerName } from '@/lib/providers/meta';
import { openFeedBooking, trackEvent } from '@/lib/analytics';
import { FEED_CATEGORY_LABELS, byNearest, displayTitle, type FeedCard, type FeedCategory } from '@/lib/providers/nearby-feed';
import { haversineKm, type NearbyTier } from '@/lib/nearby';
import Icon from '@/components/ui/Icon';

const WIDE = '(min-width: 768px)';
function subscribeWide(onChange: () => void) {
  const mq = window.matchMedia(WIDE);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

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
  /** City names dropped from the start of titles ("Kuala Lumpur: Batu Caves" → "Batu Caves"). */
  cities?: string[];
  /** Load Google Maps only when the visitor taps "Show map" (keeps within the daily map quota). */
  lazyMap?: boolean;
  /** Editorial picks shown above everything else. */
  picks?: FeedCard[];
  /** Hide the map (home page: the picks and list do the work; the map is on the experiences page). */
  showMap?: boolean;
  /** Cards already shown elsewhere on the page (e.g. picks rendered separately). */
  excludeKeys?: string[];
  /** Full feed size when `cards` is only the first few (compact views send less HTML). */
  totalCount?: number;
  /** Per-tier counts of the full feed, for the map card when `cards` is a subset. */
  tierTotals?: Record<NearbyTier, number>;
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

export default function NearbyFeed({ cards, raceSlug, circuit, pageSize = 24, compact = false, moreHref, mapsApiKey, cities = [], lazyMap = false, picks = [], showMap = true, excludeKeys = [], totalCount, tierTotals }: Props) {
  const [tier, setTier] = useState<TierFilter>('all');
  const [category, setCategory] = useState<FeedCategory | 'all'>('all');
  const [sort, setSort] = useState<'recommended' | 'nearest' | 'price' | 'rating'>('recommended');
  // Phones never auto-load the map (it would fill the screen before the
  // filters, and each load counts against the Maps quota); tablets and up do
  // unless the page asks for lazy loading.
  const isWide = useSyncExternalStore(subscribeWide, () => window.matchMedia(WIDE).matches, () => false);
  const [mapRequested, setMapRequested] = useState(false);
  const mapOpen = mapRequested || (!lazyMap && isWide);
  const setMapOpen = setMapRequested;
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
    subtitle: p.cards[0].travelLabel ?? p.cards[0].nearbyLabel,
    count: p.cards.length,
  }));

  const tierCounts = useMemo(() => {
    const c: Record<NearbyTier, number> = { near: 0, city: 0, daytrip: 0, unknown: 0, 'too-far': 0 };
    for (const card of cards) c[card.nearby.tier]++;
    return c;
  }, [cards]);

  const categoryCounts = useMemo(() => {
    const c = new Map<FeedCategory, number>();
    for (const card of cards) if (card.category) c.set(card.category, (c.get(card.category) ?? 0) + 1);
    return c;
  }, [cards]);

  const matches = cards.filter(
    (c) =>
      (tier === 'all' || c.nearby.tier === tier) &&
      (category === 'all' || c.category === category) &&
      (pointId === null || pointOfCard.get(c.key) === pointId)
  );
  // Cards arrive in recommended order. Rating sort favours well-reviewed ones (few reviews count less).
  const score = (c: FeedCard) => (c.rating ?? 0) * Math.min(1, Math.log10(c.reviewCount + 1) / 2);
  const filtered =
    sort === 'nearest'
      ? [...matches].sort(byNearest)
      : sort === 'price'
      ? [...matches].sort((a, b) => (a.offers[0]?.priceAmount ?? Infinity) - (b.offers[0]?.priceAmount ?? Infinity))
      : sort === 'rating'
        ? [...matches].sort((a, b) => score(b) - score(a))
        : matches;
  // In the default view the picks are already shown above; don't repeat them.
  const pickKeys = new Set([...picks.map((p) => p.key), ...excludeKeys]);
  const isDefaultView = tier === 'all' && category === 'all' && sort === 'recommended' && pointId === null;
  const listed = isDefaultView ? filtered.filter((c) => !pickKeys.has(c.key)) : filtered;
  const visible = listed.slice(0, compact ? pageSize : shown);
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
      {picks.length > 0 && (
        <FeedPicks picks={picks} raceSlug={raceSlug} cities={cities} className="mb-8"
          onPin={(c) => { const id = pointOfCard.get(c.key); if (id !== undefined) selectPoint(id); }} />
      )}
      <div className={compact && showMap ? 'grid lg:grid-cols-[minmax(0,420px)_1fr] gap-6 items-start' : ''}>
        {showMap && <div className={compact ? '' : 'mb-4 md:mb-8'}>
          {mapOpen ? <GoogleSpotsMap
            apiKey={mapsApiKey}
            raceSlug={raceSlug}
            circuit={circuit}
            spots={spots}
            onSelect={selectPoint}
            selectedId={pointId}
            legendCounts={tierCounts}
            height={compact ? '420px' : '520px'}
          /> : (
            <MapPlaceholder
              height={compact ? '420px' : '520px'}
              counts={tierTotals ?? tierCounts}
              circuitName={circuit.name}
              onOpen={() => { trackEvent('map_open', { race: raceSlug }); setMapOpen(true); }}
            />
          )}
        </div>}

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
                      ? 'border-[var(--text-primary)] text-[var(--text-primary)] bg-[var(--bg-secondary)] font-medium'
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

          {!compact && categoryCounts.size > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by type">
                {(['all', ...(Object.keys(FEED_CATEGORY_LABELS) as FeedCategory[]).filter((k) => categoryCounts.has(k))] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => { setCategory(k); setShown(pageSize); }}
                    aria-pressed={category === k}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      category === k
                        ? 'bg-[var(--accent-red)] text-white'
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {k === 'all' ? 'Everything' : `${FEED_CATEGORY_LABELS[k]} · ${categoryCounts.get(k)}`}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                Sort
                <select
                  value={sort}
                  onChange={(e) => { setSort(e.target.value as typeof sort); setShown(pageSize); }}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                >
                  <option value="recommended">Recommended</option>
                  <option value="nearest">Nearest first</option>
                  <option value="price">Lowest price</option>
                  <option value="rating">Best rated</option>
                </select>
              </label>
            </div>
          )}

          {selectedPoint && (
            <div className="flex items-center justify-between gap-3 mb-4 px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-sm">
              <span className="text-[var(--text-primary)]">
                📍 {pointName(selectedPoint)} · {selectedPoint.cards.length} experience{selectedPoint.cards.length === 1 ? '' : 's'}
              </span>
              <button onClick={() => setPointId(null)} className="text-[var(--accent-strong,#00D2BE)] hover:underline">Show all</button>
            </div>
          )}

          <div
            id="nearby-grid"
            className={`grid gap-4 scroll-mt-24 ${compact && showMap ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}
          >
            {visible.map((c) => (
              <FeedCardView key={c.key} card={c} raceSlug={raceSlug} cities={cities} onPin={() => { const id = pointOfCard.get(c.key); if (id !== undefined) selectPoint(id); }} />
            ))}
          </div>

          {filtered.length === 0 && <p className="text-[var(--text-secondary)] text-sm">Nothing here yet.</p>}

          {compact ? (
            moreHref && (
              <a href={moreHref} className="inline-flex items-center min-h-11 mt-3 text-sm font-medium text-[var(--accent-strong)] hover:underline">
                See all {totalCount ?? cards.length} experiences, nearest first →
              </a>
            )
          ) : (
            listed.length > shown && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setShown((n) => n + pageSize)}
                  className="px-5 py-2.5 rounded-full border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] hover:border-[var(--border-medium)]"
                >
                  Show more ({listed.length - shown} left)
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * "Our picks for race weekend": a swipeable row on phones, three columns
 * from tablet up. Exported so the home page can show it right under the hero.
 */
export function FeedPicks({ picks, raceSlug, cities = [], className = '', onPin, id = 'picks-heading', heading = 'Our picks for race weekend', description = 'Well reviewed, different from each other, and each one fits a gap in the F1 schedule.' }: {
  picks: FeedCard[];
  raceSlug: string;
  cities?: string[];
  className?: string;
  onPin?: (card: FeedCard) => void;
  /** Reused for other short rows (e.g. transfers on Getting There). */
  id?: string;
  heading?: string;
  description?: string;
}) {
  if (picks.length === 0) return null;
  return (
    <section className={className} aria-labelledby={id}>
      <h2 id={id} className="font-display font-bold text-lg text-[var(--text-primary)] mb-1">{heading}</h2>
      <p className="text-sm text-[var(--text-secondary)] mb-4">{description}</p>
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 sm:overflow-visible">
        {picks.map((c) => (
          <div key={c.key} className="snap-start shrink-0 w-[80%] sm:w-auto">
            <FeedCardView card={c} raceSlug={raceSlug} cities={cities} onPin={() => onPin?.(c)} />
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Stand-in for the map until the visitor asks for it: Google Maps is billed
 * per load and the daily quota is fixed, so pages that aren't mainly about
 * the map load it on demand.
 */
function MapPlaceholder({ height, counts, circuitName, onOpen }: { height: string; counts: Record<NearbyTier, number>; circuitName: string; onOpen: () => void }) {
  return (
    <>
    {/* Phones: a slim bar, so the filters and cards come first. */}
    <button
      onClick={onOpen}
      className="md:hidden w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-sm"
    >
      <span className="text-[var(--text-primary)] font-medium inline-flex items-center gap-2"><Icon name="map" size={18} /> Map around {circuitName}</span>
      <span className="font-semibold text-[var(--accent-red)]">Show map</span>
    </button>
    <div
      className="hidden md:flex w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] flex-col items-center justify-center gap-4 px-6 text-center"
      style={{ height, backgroundImage: 'radial-gradient(circle at 50% 45%, var(--bg-tertiary) 0, transparent 60%)' }}
    >
      <Icon name="map" size={40} className="text-[var(--text-secondary)]" />
      <div>
        <p className="font-semibold text-[var(--text-primary)]">Everything on a map around {circuitName}</p>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          {(['near', 'city', 'daytrip'] as NearbyTier[]).filter((t) => counts[t] > 0).map((t) => `${counts[t]} ${t === 'near' ? 'near the circuit' : t === 'city' ? 'in the city' : 'day trips'}`).join(' · ')}
        </p>
      </div>
      <button onClick={onOpen} className="px-5 py-2.5 rounded-full text-sm font-semibold bg-[var(--accent-red)] text-white hover:bg-[var(--accent-red-hover)] transition-colors">
        Show map
      </button>
    </div>
    </>
  );
}

function FeedCardView({ card, raceSlug, cities, onPin }: { card: FeedCard; raceSlug: string; cities: string[]; onPin: () => void }) {
  const style = TIER_STYLE[card.nearby.tier];
  const [best, ...others] = card.offers;
  const dur = duration(card.durationHours);
  const freeCancel = card.offers.some((o) => o.freeCancellation);
  const instant = card.offers.some((o) => o.instantConfirmation);
  const isTrip = !!card.destination || card.nearby.tier === 'daytrip';
  // Day trips say where they go (the travel line); "In Kuala Lumpur" would be wrong.
  const where = isTrip ? (card.destination ? null : 'Day trip') : card.locationName ? `${card.approximateLocation ? 'In' : 'At'} ${card.locationName}` : null;
  return (
    <article className="flex flex-col rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-secondary)] shadow-[0_1px_2px_rgba(21,21,30,0.04)] hover:shadow-[0_8px_24px_rgba(21,21,30,0.08)] transition-shadow">
      <div className="relative aspect-[16/10] bg-[var(--bg-tertiary)]">
        {card.imageUrl && (
          // Images come from three providers' CDNs; a plain <img> avoids per-host image config.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.imageUrl} alt={card.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <button
          onClick={onPin}
          disabled={card.lat == null}
          className="absolute left-3 top-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-[var(--text-primary)] disabled:cursor-default"
          style={{ background: 'rgba(255,255,255,0.94)', boxShadow: '0 1px 3px rgba(21,21,30,0.18)' }}
          title="Show on map"
        >
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: style.color }} />
          {card.travelLabel ?? 'Location unknown'}
        </button>
      </div>

      <div className="flex flex-col flex-1 p-4">
        <h3 className="font-semibold text-[var(--text-primary)] leading-snug line-clamp-2">{displayTitle(card.title, cities)}</h3>
        {(where || dur) && (
          <p className="text-sm text-[var(--text-secondary)] mt-1">{[where, dur].filter(Boolean).join(' · ')}</p>
        )}
        {card.fitsLabel && (
          <p className="text-sm font-medium text-[var(--accent-red)] mt-1.5 flex items-center gap-1.5">
            <Icon name="clock" size={16} className="shrink-0" />{card.fitsLabel}
          </p>
        )}
        {card.rating && card.reviewCount > 0 ? (
          <p className="text-sm mt-1.5">
            <span className="font-semibold text-[var(--text-primary)]">★ {card.rating.toFixed(1)}</span>
            <span className="text-[var(--text-secondary)]"> ({card.reviewCount.toLocaleString()} reviews)</span>
          </p>
        ) : (
          <p className="text-sm text-[var(--text-muted)] mt-1.5">No reviews yet</p>
        )}
        {(freeCancel || instant) && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {freeCancel && <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">Free cancellation</span>}
            {instant && <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">Instant confirmation</span>}
          </div>
        )}

        <div className="mt-auto pt-4">
          {best && (
            <>
              <div className="flex items-baseline justify-between gap-2 mb-2">
                <p className="text-[var(--text-primary)]">
                  {best.priceAmount != null && <span className="text-xs text-[var(--text-secondary)] mr-1">From</span>}
                  <span className="text-lg font-bold">{price(best.priceAmount, best.priceCurrency)}</span>
                  {others.length > 0 && best.priceAmount != null && (
                    <span className="ml-2 text-[10px] font-bold uppercase-label px-1.5 py-0.5 rounded bg-green-100 text-green-700 align-middle">Lowest</span>
                  )}
                </p>
                <span className="text-xs text-[var(--text-secondary)]">on {providerName(best.provider)}</span>
              </div>
              <button
                onClick={() => openFeedBooking(raceSlug, best)}
                className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold bg-[var(--accent-red)] text-white hover:bg-[var(--accent-red-hover)] transition-colors"
              >
                Check availability →
              </button>
            </>
          )}
          {others.length > 0 && (
            <p className="text-xs text-[var(--text-secondary)] mt-2">
              Also on{' '}
              {others.map((o, i) => (
                <span key={`${o.provider}:${o.productId}`}>
                  {i > 0 && ', '}
                  <button onClick={() => openFeedBooking(raceSlug, o)} className="underline underline-offset-2 hover:text-[var(--text-primary)]">
                    {providerName(o.provider)} {price(o.priceAmount, o.priceCurrency)}
                  </button>
                </span>
              ))}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
