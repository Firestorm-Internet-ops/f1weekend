import type { Metadata } from 'next';
import Link from 'next/link';
import ExperienceMapClient from '@/components/experiences/ExperienceMapClient';

export const metadata: Metadata = {
  title: 'Experience Map — Melbourne F1 2026 | F1 Weekend',
  description:
    'Interactive map of 35 curated F1 experiences near Albert Park Circuit. Find restaurants, tours, and activities for the 2026 Australian Grand Prix weekend.',
  alternates: { canonical: 'https://f1weekend.co/experiences/map' },
  openGraph: {
    title: 'Melbourne F1 Experience Map — Australian GP 2026 | F1 Weekend',
    description: 'Interactive map of 35 curated F1 experiences near Albert Park Circuit. Find restaurants, tours, and activities for the 2026 Australian Grand Prix weekend.',
    url: 'https://f1weekend.co/experiences/map',
    type: 'website',
    images: [{ url: '/og/experiences-map.png', width: 1200, height: 630, alt: 'Melbourne F1 Experience Map — F1 Weekend' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Melbourne F1 Experience Map — Australian GP 2026 | F1 Weekend',
    description: 'Interactive map of 35 curated F1 experiences near Albert Park Circuit.',
    images: ['/og/experiences-map.png'],
  },
};

export default function ExperienceMapPage() {
  return (
    <div className="min-h-screen pt-24 pb-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase-label text-[var(--accent-red)] mb-2">
              Melbourne 2026
            </p>
            <h1 className="font-display font-black text-4xl text-white uppercase-heading">
              Experience Map
            </h1>
            <p className="text-[var(--text-secondary)] mt-2">
              All experiences relative to Albert Park Circuit.
            </p>
          </div>
          <Link
            href="/experiences"
            className="flex-shrink-0 mt-1 flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-sm text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-medium)] transition-colors"
          >
            <span>≡</span>
            <span>Grid</span>
          </Link>
        </div>

        <ExperienceMapClient />
      </div>
    </div>
  );
}
