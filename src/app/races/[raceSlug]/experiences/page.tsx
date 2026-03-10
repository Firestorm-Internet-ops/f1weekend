import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import ExperiencesClient from '@/components/experiences/ExperiencesClient';
import RaceSwitcher from '@/components/race/RaceSwitcher';
import { getRaceBySlug, getAvailableRaces, getRaceContent } from '@/services/race.service';
import { getExperiencesByRace } from '@/services/experience.service';
import { CATEGORY_LABELS } from '@/lib/constants/categories';

export const revalidate = 3600; // 1 hour

interface Props {
  params: Promise<{ raceSlug: string }>;
  searchParams: Promise<{ category?: string; window?: string; sort?: string }>;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { raceSlug } = await params;
  const { category } = await searchParams;
  const [race, raceContent] = await Promise.all([
    getRaceBySlug(raceSlug),
    getRaceContent(raceSlug),
  ]);
  if (!race) return {};

  const categoryLabel = category ? (CATEGORY_LABELS[category] ?? category) : null;
  const canonical = `https://f1weekend.co/races/${raceSlug}/experiences`;

  // Use category-specific copy from DB if available
  const categoryCopy = (category && raceContent?.categoryMeta) ? raceContent.categoryMeta[category] : null;

  const title = categoryCopy?.title
    ?? (categoryLabel
      ? `Best ${categoryLabel} Experiences in ${race.city} During F1 ${race.season}`
      : `Things to Do in ${race.city} During F1 ${race.season}`);

  const description = categoryCopy?.description
    ?? (categoryLabel
      ? `The best ${categoryLabel.toLowerCase()} experiences in ${race.city} for the ${race.name} weekend at ${race.circuitName}. Curated picks matched to your session gaps.`
      : `Curated activities, tours, and dining experiences for the ${race.name} weekend at ${race.circuitName}. Filter by category and session gap.`);

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'F1 Weekend',
      type: 'website',
      images: [{ url: '/og.png', width: 1200, height: 630, alt: `${race.city} F1 Weekend Experiences` }],
    },
    twitter: { card: 'summary_large_image', title, description, images: ['/og.png'] },
  };
}

export default async function ExperiencesPage({ params, searchParams }: Props) {
  const { raceSlug } = await params;
  const { category } = await searchParams;
  const [race, raceContent, availableRaces] = await Promise.all([
    getRaceBySlug(raceSlug),
    getRaceContent(raceSlug),
    getAvailableRaces(),
  ]);
  if (!race) notFound();

  const exps = await getExperiencesByRace(race.id);

  const expFaqLd = raceContent?.faqLd as any;

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://f1weekend.co' },
      { '@type': 'ListItem', position: 2, name: race.city, item: `https://f1weekend.co/races/${raceSlug}` },
      { '@type': 'ListItem', position: 3, name: 'Experiences', item: `https://f1weekend.co/races/${raceSlug}/experiences` },
    ],
  };

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${race.city} F1 Race Weekend Experiences`,
    url: `https://f1weekend.co/races/${raceSlug}/experiences`,
    numberOfItems: exps.length,
    itemListElement: exps.map((exp, i) => {
      const item: Record<string, unknown> = {
        '@type': 'ListItem',
        position: i + 1,
        name: exp.title,
        url: `https://f1weekend.co/races/${raceSlug}/experiences/${exp.slug}`,
        description: exp.abstract ?? exp.shortDescription,
      };
      const img = exp.photos?.[0] ?? exp.imageUrl;
      if (img) item.image = img;
      return item;
    }),
  };

  // Consolidate all page schemas into single JSON-LD script tag
  const allSchemas = [breadcrumbLd, itemListLd, ...(expFaqLd ? [expFaqLd] : [])];

  return (
    <div className="min-h-screen pt-24 pb-24 px-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(allSchemas) }} />
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase-label text-[var(--accent-red)] mb-2">
              {race.city} {race.season}
            </p>
            <h1 className="font-display font-black text-4xl text-white uppercase-heading">
              Experiences
            </h1>
            <p className="text-[var(--text-secondary)] mt-2">
              Curated activities to fill your race weekend gaps.
            </p>
            {raceContent?.pageDescription ? (
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-xl mt-3">
                {raceContent.pageDescription}
              </p>
            ) : (
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-xl mt-3">
                {race.city} offers curated experiences for the {race.season} {race.name} — 
                from food tours and cultural walks to full-day trips. 
                Filter by category or session window to find exactly what fits your schedule.
              </p>
            )}
          </div>
          <Link
            href={`/races/${raceSlug}/experiences/map`}
            className="flex-shrink-0 mt-1 flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-sm text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-medium)] transition-colors"
          >
            <span>⊙</span>
            <span>Map</span>
          </Link>
        </div>

        <div className="mb-6">
          <RaceSwitcher currentRace={race} availableRaces={availableRaces} pageType="experiences" />
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
          <ExperiencesClient initialExperiences={exps} raceSlug={raceSlug} />
        </Suspense>
      </div>
    </div>
  );
}
