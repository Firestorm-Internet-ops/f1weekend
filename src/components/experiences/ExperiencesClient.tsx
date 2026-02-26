'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Experience } from '@/types/experience';
import ExperienceCard from './ExperienceCard';
import CategoryTabs from './CategoryTabs';
import SortSelector, { type SortOption } from './SortSelector';
import { CATEGORY_LABELS } from '@/lib/constants/categories';

const SESSION_KEY = 'pitlane-session';

const WINDOW_LABELS: Record<string, string> = {
  'thu-full':    'Thursday — Full Day',
  'fri-morning': 'Friday Morning — Before FP1',
  'fri-gap':     'Friday Afternoon — Between Sessions',
  'fri-evening': 'Friday Evening — After FP2',
  'sat-morning': 'Saturday Morning — Before FP3',
  'sat-evening': 'Saturday Evening — After Qualifying',
  'sun-morning': 'Sunday Morning — Race Day',
  'sun-evening': 'Sunday Evening — Post-Race',
};

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
  const [windowLabel, setWindowLabel] = useState(windowSlug);

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
        setWindowLabel(windowSlug);
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
      {/* Active window pill */}
      {windowLabel && (
        <div className="mb-6 flex items-center gap-3 flex-wrap">
          <span className="text-base px-5 py-2.5 rounded-full bg-[var(--accent-teal-muted)] text-[var(--accent-teal)] border border-[var(--accent-teal)]/30">
            {WINDOW_LABELS[windowLabel] ?? windowLabel}
            {!loading && ` · ${experiences.length} experience${experiences.length !== 1 ? 's' : ''}`}
          </span>
          <button
            onClick={clearWindow}
            className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors"
          >
            ✕ Clear
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between mb-4">
        <CategoryTabs active={category} onChange={handleCategoryChange} />
        <SortSelector active={sort} onChange={handleSortChange} />
      </div>

      {/* Result count */}
      {!loading && experiences.length > 0 && (
        <p className="text-sm text-[var(--text-secondary)] mb-5">
          {experiences.length} experience{experiences.length !== 1 ? 's' : ''}
          {category ? ` · ${CATEGORY_LABELS[category] ?? category}` : ''}
        </p>
      )}

      {/* Grid */}
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
