import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import ExperiencesClient from '@/components/experiences/ExperiencesClient';
import RaceSwitcher from '@/components/race/RaceSwitcher';
import { getRaceBySlug } from '@/services/race.service';
import { getExperiencesByRace } from '@/services/experience.service';

export const revalidate = 3600; // 1 hour

interface Props {
  params: Promise<{ raceSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { raceSlug } = await params;
  const race = await getRaceBySlug(raceSlug);
  if (!race) return {};

  const title = `Things to Do in ${race.city} During F1 ${race.season} | f1weekend.co`;
  const description = `Curated activities, tours, and dining experiences for the ${race.name} weekend at ${race.circuitName}. Filter by category and session gap.`;
  const canonical = `https://f1weekend.co/races/${raceSlug}/experiences`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, siteName: 'F1 Weekend', type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function ExperiencesPage({ params }: Props) {
  const { raceSlug } = await params;
  const race = await getRaceBySlug(raceSlug);
  if (!race) notFound();

  const exps = await getExperiencesByRace(race.id);

  const expFaqLd = race.city === 'Melbourne' ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What are the best food experiences during Melbourne F1 2026?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Top food experiences include the Melbourne Laneways Food Tour (10 tastings, 3 hrs, A$99–A$130), a self-guided Degraves Street espresso walk (free), dinner at Chin Chin on Flinders Lane (A$50–A$80pp), and the South Melbourne Market on Sunday morning (A$20–A$40). All fit into session gaps between Friday practice sessions.',
        },
      },
      {
        '@type': 'Question',
        name: 'Which Melbourne experiences fit between F1 sessions?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Experiences are matched to four windows: Before FP1 (3.5 hrs) — suits a food tour or city walk; Between sessions (1.5 hrs) — café crawl or Botanic Gardens; Evening (4+ hrs) — dinner and rooftop bars; Sunday morning (3 hrs) — South Melbourne Market or beach walk. Filter by window using the controls above.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are there day trips from Melbourne during F1 weekend?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. The Great Ocean Road (10 hours, A$115) and Yarra Valley wine region (8 hours, A$95–A$140) are both feasible on Thursday March 5 before sessions begin, or Sunday morning before the race start at 15:00 AEDT. Both depart from Melbourne Central Business District.',
        },
      },
      {
        '@type': 'Question',
        name: 'How much do Melbourne F1 weekend experiences cost?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Experiences range from free (Botanic Gardens, St Kilda beach) to A$350+ for private tours. Most popular guided experiences average A$79–A$130 per person. Budget A$150–A$250/day for a mix of guided and self-guided activities, meals, and transport.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I book Melbourne F1 weekend experiences?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: "All experiences link directly to the operator's booking page (GetYourGuide, Airbnb Experiences, or direct), with instant confirmation. Most offer free cancellation up to 24 hours before. Book at least 7 days in advance for food tours and Great Ocean Road trips, which sell out during race week.",
        },
      },
    ],
  } : race.city === 'Shanghai' ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What are the best food experiences during Shanghai F1 2026?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Top food experiences: Shanghai 3-Hour Local Food Tasting Tour (A$112, 10–15 dishes), Evening Walking Food Tour in the French Concession (A$97, 3.5 hrs), Late Night Food Tour (A$124, 3 hrs). All fit between F1 sessions.',
        },
      },
      {
        '@type': 'Question',
        name: 'Which Shanghai experiences fit between F1 sessions?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Experiences are matched to 8 windows: fri-morning/sat-morning (3.5 hrs before FP1) — food tours and cultural walks; fri-gap/sat-gap (1.5 hrs) — tea ceremony or short stop; fri-evening/sat-evening (4 hrs) — river cruise, pub crawl, acrobatics; sun-morning (6 hrs) — Zhujiajiao day trip or full city tour; post-race (3 hrs) — nightlife.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are there day trips from Shanghai during F1 weekend?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Zhujiajiao water town (5 hrs, A$195) fits Sunday race morning. Suzhou by bullet train (9 hrs, A$307–A$407) is a full Sunday morning run. Both return well before the 15:00 race start.',
        },
      },
      {
        '@type': 'Question',
        name: 'How much do Shanghai F1 weekend experiences cost?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A$20 (zoo entry) to A$560+ (Great Wall day trip). Most popular guided experiences A$48–A$217. Budget A$150–A$400/day for a mix of activities, meals, and transport in Shanghai.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I book Shanghai F1 weekend experiences?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'All experiences link to GetYourGuide with instant confirmation. Most offer free cancellation up to 24 hours before. Book 7+ days ahead for food tours and Suzhou/Zhujiajiao day trips, which sell out during race week.',
        },
      },
    ],
  } : null;

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${race.city} F1 Race Weekend Experiences`,
    url: `https://f1weekend.co/races/${raceSlug}/experiences`,
    numberOfItems: exps.length,
    itemListElement: exps.map((exp, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: exp.title,
      url: `https://f1weekend.co/races/${raceSlug}/experiences/${exp.slug}`,
      image: exp.photos?.[0] ?? exp.imageUrl ?? undefined,
      description: exp.abstract ?? exp.shortDescription,
    })),
  };

  return (
    <div className="min-h-screen pt-24 pb-24 px-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      {expFaqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(expFaqLd) }} />}
      <div className="max-w-6xl mx-auto">
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
            {race.city === 'Melbourne' && (
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-xl mt-3">
                Melbourne offers 30+ curated experiences for the 2026 Australian Grand Prix — from
                3-hour laneway food tours (A$99–A$130) that fit your Friday morning gap, to full-day
                Great Ocean Road trips (A$115) perfect for Thursday before sessions begin. Filter by
                category or session window to find exactly what fits your schedule.
              </p>
            )}
            {race.city === 'Shanghai' && (
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-xl mt-3">
                Shanghai offers 42 curated experiences for the 2026 Chinese Grand Prix — from 3-hour
                French Concession food tours (A$97–A$124) that fit your Friday morning gap, to full-day
                Suzhou bullet train day trips (A$307–A$407) perfect for race-day Sunday morning before
                the 15:00 CST start. Filter by category or session window to find exactly what fits.
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
          <RaceSwitcher raceSlug={raceSlug} pageType="experiences" />
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
