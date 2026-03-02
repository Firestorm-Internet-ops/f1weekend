'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Experience } from '@/types/experience';
import ExperienceCard from './ExperienceCard';
import SortSelector, { type SortOption } from './SortSelector';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/lib/constants/categories';

const SESSION_KEY = 'pitlane-session';

const WINDOW_LABELS: Record<string, string> = {
  'thu-full':    'Thursday — Full Day',
  'fri-morning': 'Friday Morning — Before FP1',
  'fri-gap':     'Friday Afternoon — Between Sessions',
  'fri-evening': 'Friday Evening — After FP2',
  'sat-morning': 'Saturday Morning — Before FP3',
  'sat-gap':     'Saturday Afternoon — Between Sessions',
  'sat-evening': 'Saturday Evening — After Qualifying',
  'sun-morning': 'Sunday Morning — Race Day',
  'sun-evening': 'Sunday Evening — Post-Race',
  'post-race':   'Sunday Evening — Post-Race',
};

const CATEGORY_ORDER = ['food', 'culture', 'adventure', 'daytrip', 'nightlife'] as const;

const CATEGORY_EMOJIS: Record<string, string> = {
  food: '🍜',
  culture: '⛩️',
  adventure: '🏔️',
  daytrip: '✈️',
  nightlife: '🌙',
};

interface SessionWindow {
  slug: string;
  label: string;
  sublabel: string;
}

function getSessionWindows(raceSlug: string): SessionWindow[] {
  const isMelbourne = raceSlug.startsWith('melbourne');
  const base: SessionWindow[] = [
    { slug: 'fri-morning', label: 'Fri Morning',  sublabel: 'Before FP1 · 3.5h' },
    { slug: 'fri-gap',     label: 'Fri Midday',   sublabel: 'Between Sessions · 2h' },
    { slug: 'fri-evening', label: 'Fri Evening',  sublabel: 'After FP2 · 4h' },
    { slug: 'sat-morning', label: 'Sat Morning',  sublabel: isMelbourne ? 'Before Qualifying · 3.5h' : 'Before FP3 · 3.5h' },
    ...(isMelbourne ? [] : [{ slug: 'sat-gap', label: 'Sat Midday', sublabel: 'Between Sessions · 2h' }] as SessionWindow[]),
    { slug: 'sat-evening', label: 'Sat Evening',  sublabel: 'After Qualifying · 4h' },
    { slug: 'sun-morning', label: 'Race Day AM',  sublabel: '6h before Race' },
    {
      slug: isMelbourne ? 'sun-evening' : 'post-race',
      label: 'Post-Race',
      sublabel: 'After the flag',
    },
  ];
  if (isMelbourne) {
    return [{ slug: 'thu-full', label: 'Thursday', sublabel: 'Full free day' }, ...base];
  }
  return base;
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export default function ExperiencesClient({
  initialExperiences = [],
  raceSlug,
}: {
  initialExperiences?: Experience[];
  raceSlug: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const windowSlug = searchParams.get('window') ?? '';
  const [category, setCategory] = useState(searchParams.get('category') ?? '');
  const [sort, setSort] = useState<SortOption>(
    (searchParams.get('sort') as SortOption) ?? 'popular'
  );
  const [experiences, setExperiences] = useState<Experience[]>(initialExperiences);
  const [loading, setLoading] = useState(false);
  const isFirstRender = useRef(true);
  const [bookingId, setBookingId] = useState<number | null>(null);

  const sessionWindows = useMemo(() => getSessionWindows(raceSlug), [raceSlug]);

  // Stable category counts from initial data (don't change with filter)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const exp of initialExperiences) {
      counts[exp.category] = (counts[exp.category] ?? 0) + 1;
    }
    return counts;
  }, [initialExperiences]);

  const buildUrl = useCallback(
    (newCat: string, newSort: SortOption, win: string) => {
      const params = new URLSearchParams();
      if (win) params.set('window', win);
      if (newCat) params.set('category', newCat);
      if (newSort !== 'popular') params.set('sort', newSort);
      const base = `/races/${raceSlug}/experiences`;
      return `${base}${params.size ? `?${params.toString()}` : ''}`;
    },
    [raceSlug]
  );

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    router.replace(buildUrl(cat, sort, windowSlug), { scroll: false });
  };

  const handleSortChange = (s: SortOption) => {
    setSort(s);
    router.replace(buildUrl(category, s, windowSlug), { scroll: false });
  };

  const handleWindowChange = (win: string) => {
    router.replace(buildUrl(category, sort, win), { scroll: false });
  };

  const clearWindow = () => {
    router.replace(buildUrl(category, sort, ''), { scroll: false });
  };

  useEffect(() => {
    const hasFilters = windowSlug || category || sort !== 'popular';
    if (isFirstRender.current && !hasFilters) {
      isFirstRender.current = false;
      return;
    }
    isFirstRender.current = false;

    setLoading(true);
    const params = new URLSearchParams({ race: raceSlug });
    if (windowSlug) params.set('window', windowSlug);
    if (category) params.set('category', category);
    if (sort) params.set('sort', sort);

    fetch(`/api/experiences?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setExperiences(data.data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [windowSlug, category, sort, raceSlug]);

  const handleBook = async (experienceId: number) => {
    setBookingId(experienceId);
    try {
      const res = await fetch('/api/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experienceId,
          source: 'feed',
          sessionId: getSessionId(),
        }),
      });
      const { affiliateUrl } = await res.json();
      window.open(affiliateUrl, '_blank');
    } catch {
      const exp = experiences.find((e) => e.id === experienceId);
      if (exp?.affiliateUrl) window.open(exp.affiliateUrl, '_blank');
    } finally {
      setBookingId(null);
    }
  };

  return (
    <div>
      {/* ── FILTER BAR ──────────────────────────────────────────────── */}
      <div className="sticky top-16 z-20 bg-[var(--bg-primary)]/95 backdrop-blur-sm border-b border-[var(--border-subtle)] -mx-4 px-4 py-3 mb-6">

        {/* Row 1: Category pills + Sort */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* All pill */}
          <button
            onClick={() => handleCategoryChange('')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 border ${
              category === ''
                ? 'bg-[var(--accent-red)] text-white border-[var(--accent-red)]'
                : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-medium)]'
            }`}
          >
            All <span className="opacity-60 ml-1 text-xs">{initialExperiences.length}</span>
          </button>

          {/* Category pills */}
          {CATEGORY_ORDER.map(cat => {
            const isActive = category === cat;
            const color = CATEGORY_COLORS[cat];
            const count = categoryCounts[cat] ?? 0;
            return (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                style={isActive ? { borderColor: color, color, backgroundColor: `${color}18` } : {}}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 border ${
                  isActive
                    ? ''
                    : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-medium)]'
                }`}
              >
                {CATEGORY_EMOJIS[cat]}{' '}
                <span className="hidden sm:inline">{CATEGORY_LABELS[cat]}</span>
                <span className="opacity-60 ml-1 text-xs">{count}</span>
              </button>
            );
          })}

          {/* Sort — pushed to right */}
          <div className="ml-auto">
            <SortSelector active={sort} onChange={handleSortChange} />
          </div>
        </div>

        {/* Row 2: Session window chips (horizontal scroll) */}
        {sessionWindows.length > 0 && (
          <div className="flex items-center gap-2 mt-2.5 overflow-x-auto pb-0.5 scrollbar-hide">
            {sessionWindows.map(w => {
              const isActive = windowSlug === w.slug;
              return (
                <button
                  key={w.slug}
                  onClick={() => isActive ? clearWindow() : handleWindowChange(w.slug)}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 border whitespace-nowrap ${
                    isActive
                      ? 'border-[var(--accent-teal)]/50 bg-[var(--accent-teal-muted)] text-[var(--accent-teal)]'
                      : 'border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:border-[var(--border-medium)]'
                  }`}
                >
                  {w.label}
                  {isActive && <span className="ml-1 opacity-70">✕</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Active window label */}
      {windowSlug && !loading && (
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          {experiences.length} experience{experiences.length !== 1 ? 's' : ''} during{' '}
          <span className="text-[var(--accent-teal)]">{WINDOW_LABELS[windowSlug] ?? windowSlug}</span>
        </p>
      )}

      {/* Result count */}
      {!loading && !windowSlug && experiences.length > 0 && category && (
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          {experiences.length} {CATEGORY_LABELS[category] ?? category} experience{experiences.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* ── Grid ──────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 rounded-xl shimmer" />
          ))}
        </div>

      ) : experiences.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">🏎</p>
          <p className="text-lg font-medium text-[var(--text-secondary)]">No experiences found</p>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Try a different filter or time window.
          </p>
        </div>

      ) : (
        <div
          key={`${category}-${sort}-${windowSlug}`}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {experiences.map((exp, i) => (
            <ExperienceCard
              key={exp.id}
              experience={exp}
              onBook={handleBook}
              loading={bookingId === exp.id}
              index={i}
              detailHref={`/races/${raceSlug}/experiences/${exp.slug}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
