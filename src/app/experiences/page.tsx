import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import ExperiencesClient from '@/components/experiences/ExperiencesClient';
import { getRaceBySlug } from '@/services/race.service';
import { getExperiencesByRace } from '@/services/experience.service';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Melbourne Experiences for F1 Race Weekend 2026 | F1 Weekend',
  description:
    '35 curated Melbourne activities, tours, and dining experiences handpicked for the 2026 Australian Grand Prix weekend at Albert Park. Filter by category and session gap.',
  alternates: { canonical: 'https://f1weekend.co/experiences' },
  keywords: [
    'Melbourne experiences F1',
    'Australian Grand Prix 2026 activities',
    'Melbourne Grand Prix weekend',
    'Albert Park things to do',
    'F1 Melbourne 2026',
    'race weekend Melbourne',
  ],
  openGraph: {
    title: 'Melbourne Experiences for F1 Race Weekend 2026 | F1 Weekend',
    description:
      '35 curated Melbourne activities, tours, and dining experiences for the 2026 Australian Grand Prix weekend at Albert Park.',
    url: 'https://f1weekend.co/experiences',
    siteName: 'F1 Weekend',
    type: 'website',
    images: [{ url: '/og/experiences.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Melbourne Experiences for F1 Race Weekend 2026 | F1 Weekend',
    description:
      '35 curated Melbourne activities, tours, and dining experiences for the 2026 Australian Grand Prix weekend.',
  },
};

export default async function ExperiencesPage() {
  const race = await getRaceBySlug('melbourne-2026');
  const exps = race ? await getExperiencesByRace(race.id) : [];

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Melbourne F1 Race Weekend Experiences',
    description: 'Curated activities, tours, and dining for the 2026 Australian Grand Prix weekend',
    url: 'https://f1weekend.co/experiences',
    numberOfItems: exps.length,
    itemListElement: exps.map((exp, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: exp.title,
      url: `https://f1weekend.co/experiences/${exp.slug}`,
      image: exp.photos?.[0] ?? exp.imageUrl ?? undefined,
      description: exp.abstract ?? exp.shortDescription,
    })),
  };

  return (
    <div className="min-h-screen pt-24 pb-24 px-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase-label text-[var(--accent-red)] mb-2">
              Melbourne 2026
            </p>
            <h1 className="font-display font-black text-4xl text-white uppercase-heading">
              Experiences
            </h1>
            <p className="text-[var(--text-secondary)] mt-2">
              Curated activities to fill your race weekend gaps.
            </p>
          </div>
          <Link
            href="/experiences/map"
            className="flex-shrink-0 mt-1 flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-sm text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-medium)] transition-colors"
          >
            <span>⊙</span>
            <span>Map</span>
          </Link>
        </div>

        <Suspense
          fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-72 rounded-xl shimmer" />
              ))}
            </div>
          }
        >
          <ExperiencesClient initialExperiences={exps} />
        </Suspense>
      </div>
    </div>
  );
}
