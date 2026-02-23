import type { Metadata } from 'next';
import { Suspense } from 'react';
import ExperiencesClient from '@/components/experiences/ExperiencesClient';

export const metadata: Metadata = {
  title: 'Melbourne Experiences for F1 Race Weekend 2026 | Pitlane',
  description:
    '35 curated Melbourne activities, tours, and dining experiences handpicked for the 2026 Australian Grand Prix weekend at Albert Park. Filter by category and session gap.',
  alternates: { canonical: 'https://pitlane.app/experiences' },
  keywords: [
    'Melbourne experiences F1',
    'Australian Grand Prix 2026 activities',
    'Melbourne Grand Prix weekend',
    'Albert Park things to do',
    'F1 Melbourne 2026',
    'race weekend Melbourne',
  ],
  openGraph: {
    title: 'Melbourne Experiences for F1 Race Weekend 2026 | Pitlane',
    description:
      '35 curated Melbourne activities, tours, and dining experiences for the 2026 Australian Grand Prix weekend at Albert Park.',
    url: 'https://pitlane.app/experiences',
    siteName: 'Pitlane',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Melbourne Experiences for F1 Race Weekend 2026 | Pitlane',
    description:
      '35 curated Melbourne activities, tours, and dining experiences for the 2026 Australian Grand Prix weekend.',
  },
};

export default function ExperiencesPage() {
  return (
    <div className="min-h-screen pt-24 pb-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
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

        <Suspense
          fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-72 rounded-xl shimmer" />
              ))}
            </div>
          }
        >
          <ExperiencesClient />
        </Suspense>
      </div>
    </div>
  );
}
