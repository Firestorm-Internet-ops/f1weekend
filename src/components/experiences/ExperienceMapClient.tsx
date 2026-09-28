'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Experience } from '@/types/experience';
import CategoryTabs from './CategoryTabs';
import ExperienceMap from './ExperienceMap';
import DistanceMap from './DistanceMap';
import { trackEvent } from '@/lib/analytics';

interface Props {
  raceSlug: string;
  circuit?: { lat: number; lng: number; name: string };
  /** Google Maps browser key from the server env (only used when the interactive map is opened). */
  mapsApiKey?: string;
}

const hasCircuit = (c?: Props['circuit']): c is NonNullable<Props['circuit']> =>
  !!c && Number.isFinite(c.lat) && Number.isFinite(c.lng) && !(c.lat === 0 && c.lng === 0);

export default function ExperienceMapClient({ raceSlug, circuit, mapsApiKey }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [category, setCategory] = useState(searchParams.get('category') ?? '');
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  // Google Maps is billed per load, so it only loads when a visitor asks for it.
  // Without circuit coordinates the drawn map can't be made, so Google is used directly.
  const [interactive, setInteractive] = useState(!hasCircuit(circuit));

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    const params = new URLSearchParams();
    if (cat) params.set('category', cat);
    const base = `/races/${raceSlug}/experiences/map`;
    router.replace(`${base}${params.size ? `?${params.toString()}` : ''}`, { scroll: false });
  };

  const openInteractive = () => {
    trackEvent('map_open', { race: raceSlug });
    setInteractive(true);
  };

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ race: raceSlug });
    if (category) params.set('category', category);

    fetch(`/api/experiences?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setExperiences(data.data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [category, raceSlug]);

  return (
    <div>
      <div className="mb-6">
        <CategoryTabs active={category} onChange={handleCategoryChange} />
      </div>

      {loading ? (
        <div className="w-full h-[600px] rounded-2xl shimmer" />
      ) : interactive || !hasCircuit(circuit) ? (
        <>
          <ExperienceMap experiences={experiences} height="600px" raceSlug={raceSlug} circuit={circuit} apiKey={mapsApiKey} />
          {hasCircuit(circuit) && (
            <div className="mt-3 text-center">
              <button
                onClick={() => setInteractive(false)}
                className="text-sm text-[var(--text-secondary)] hover:text-white underline underline-offset-4"
              >
                ← Back to simple map
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <DistanceMap experiences={experiences} raceSlug={raceSlug} circuit={circuit} />
          <div className="mt-4 text-center">
            <button
              onClick={openInteractive}
              className="px-5 py-2.5 rounded-full text-sm font-medium border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-white hover:border-[var(--border-medium)] transition-colors"
            >
              Open interactive Google map (streets &amp; directions)
            </button>
          </div>
        </>
      )}
    </div>
  );
}
