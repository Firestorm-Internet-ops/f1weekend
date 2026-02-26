import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import ExperienceMapClient from '@/components/experiences/ExperienceMapClient';
import { getRaceBySlug } from '@/services/race.service';

interface Props {
  params: Promise<{ raceSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { raceSlug } = await params;
  const race = await getRaceBySlug(raceSlug);
  if (!race) return {};

  const title = `Experience Map — ${race.city} F1 ${race.season} | F1 Weekend`;
  const description = `Interactive map of curated F1 experiences near ${race.circuitName}. Find restaurants, tours, and activities for the ${race.name} weekend.`;
  const canonical = `https://f1weekend.co/races/${raceSlug}/experiences/map`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'website' },
  };
}

export default async function ExperienceMapPage({ params }: Props) {
  const { raceSlug } = await params;
  const race = await getRaceBySlug(raceSlug);
  if (!race) notFound();

  return (
    <div className="min-h-screen pt-24 pb-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase-label text-[var(--accent-red)] mb-2">
              {race.city} {race.season}
            </p>
            <h1 className="font-display font-black text-4xl text-white uppercase-heading">
              Experience Map
            </h1>
            <p className="text-[var(--text-secondary)] mt-2">
              All experiences relative to {race.circuitName}.
            </p>
          </div>
          <Link
            href={`/races/${raceSlug}/experiences`}
            className="flex-shrink-0 mt-1 flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-sm text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-medium)] transition-colors"
          >
            <span>≡</span>
            <span>Grid</span>
          </Link>
        </div>

        <Suspense fallback={<div className="h-[600px] bg-[var(--bg-secondary)] rounded-2xl animate-pulse" />}>
          <ExperienceMapClient raceSlug={raceSlug} />
        </Suspense>
      </div>
    </div>
  );
}
