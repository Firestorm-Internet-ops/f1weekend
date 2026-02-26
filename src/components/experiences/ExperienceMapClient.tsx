'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Experience } from '@/types/experience';
import CategoryTabs from './CategoryTabs';
import ExperienceMap from './ExperienceMap';

export default function ExperienceMapClient({ raceSlug }: { raceSlug: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [category, setCategory] = useState(searchParams.get('category') ?? '');
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    const params = new URLSearchParams();
    if (cat) params.set('category', cat);
    const base = `/races/${raceSlug}/experiences/map`;
    router.replace(`${base}${params.size ? `?${params.toString()}` : ''}`, { scroll: false });
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
      ) : (
        <ExperienceMap experiences={experiences} height="600px" />
      )}
    </div>
  );
}
