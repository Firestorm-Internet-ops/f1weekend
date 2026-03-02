import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import ExperiencesClient from '@/components/experiences/ExperiencesClient';
import RaceSwitcher from '@/components/race/RaceSwitcher';
import { getRaceBySlug } from '@/services/race.service';
import { getExperiencesByRace } from '@/services/experience.service';
import { CATEGORY_LABELS } from '@/lib/constants/categories';

export const revalidate = 3600; // 1 hour

interface Props {
  params: Promise<{ raceSlug: string }>;
  searchParams: Promise<{ category?: string; window?: string; sort?: string }>;
}

// Per-city, per-category metadata copy — answers the AEO query directly
const CATEGORY_META: Record<string, Record<string, { title: string; description: string }>> = {
  Melbourne: {
    food: {
      title: 'Best Food & Drink Experiences in Melbourne During F1 2026',
      description:
        'The best food tours, coffee walks, and dining experiences in Melbourne for the 2026 Australian Grand Prix weekend — from laneway espresso to South Melbourne Market.',
    },
    culture: {
      title: 'Best Culture Experiences in Melbourne During F1 2026',
      description:
        'Top cultural experiences in Melbourne for the 2026 Australian Grand Prix — NGV galleries, street-art walking tours, and Southbank arts precincts.',
    },
    adventure: {
      title: 'Best Adventure Experiences in Melbourne During F1 2026',
      description:
        'Adventure activities in Melbourne for the 2026 Australian Grand Prix weekend — coastal kayaking, surfing lessons at St Kilda, and bay wildlife tours.',
    },
    daytrip: {
      title: 'Best Day Trips from Melbourne During F1 2026',
      description:
        'The best day trips from Melbourne for the 2026 Australian Grand Prix — Great Ocean Road (A$115), Yarra Valley wine (A$95–A$140), and Phillip Island.',
    },
    nightlife: {
      title: 'Best Nightlife Experiences in Melbourne During F1 2026',
      description:
        'Top nightlife picks in Melbourne for the 2026 Australian Grand Prix weekend — rooftop bars, live music venues, and CBD cocktail bars open until late.',
    },
  },
  Shanghai: {
    food: {
      title: 'Best Food & Drink Experiences in Shanghai During F1 2026',
      description:
        'The best food tours in Shanghai for the 2026 Chinese Grand Prix weekend — French Concession food walks (A$97–A$124), late-night street food, and dumpling masterclasses.',
    },
    culture: {
      title: 'Best Culture Experiences in Shanghai During F1 2026',
      description:
        'Top cultural experiences in Shanghai for the 2026 Chinese Grand Prix — Yu Garden, Tianzifang arts district, acrobatics shows, and tea ceremony workshops.',
    },
    adventure: {
      title: 'Best Adventure Experiences in Shanghai During F1 2026',
      description:
        'Adventure activities in Shanghai for the 2026 Chinese Grand Prix weekend — Huangpu River kayaking, cycling tours, and rooftop sightseeing experiences.',
    },
    daytrip: {
      title: 'Best Day Trips from Shanghai During F1 2026',
      description:
        'The best day trips from Shanghai for the 2026 Chinese Grand Prix — Zhujiajiao water town (A$195), Suzhou by bullet train (A$307–A$407), and Hangzhou.',
    },
    nightlife: {
      title: 'Best Nightlife Experiences in Shanghai During F1 2026',
      description:
        'Top nightlife in Shanghai for the 2026 Chinese Grand Prix weekend — Bund rooftop bars, French Concession cocktail bars, and Huangpu River evening cruises.',
    },
  },
  Suzuka: {
    food: {
      title: 'Best Food Experiences in Suzuka & Nagoya During F1 2026',
      description:
        'The best food experiences around Suzuka for the 2026 Japanese Grand Prix — miso katsu, ramen tours, Nagoya morning breakfast culture, and sake tastings.',
    },
    culture: {
      title: 'Best Culture Experiences Near Suzuka During F1 2026',
      description:
        'Top cultural experiences near Suzuka for the 2026 Japanese Grand Prix — Ise Grand Shrine, Nara deer park, Kyoto temples, and traditional craft workshops.',
    },
    adventure: {
      title: 'Best Adventure Experiences Near Suzuka During F1 2026',
      description:
        'Adventure activities near Suzuka for the 2026 Japanese Grand Prix weekend — cycling Nara to Osaka, Mount Wakakusa hike, and coastal walks on Ise Bay.',
    },
    daytrip: {
      title: 'Best Day Trips from Suzuka During F1 2026',
      description:
        'The best day trips from Suzuka for the 2026 Japanese Grand Prix — Kyoto by shinkansen, Nara in 2 hours, Osaka Dotonbori, and the Ise Shrine coastal route.',
    },
    nightlife: {
      title: 'Best Nightlife Experiences Near Suzuka During F1 2026',
      description:
        'Nightlife options near Suzuka for the 2026 Japanese Grand Prix weekend — Nagoya izakaya bars, Sakae district cocktail lounges, and craft beer venues.',
    },
  },
  Sakhir: {
    food: {
      title: 'Best Food & Dining Experiences in Bahrain During F1 2026',
      description:
        'The best food experiences in Bahrain for the 2026 Bahrain Grand Prix — traditional machboos dinners, Manama souq food walks, Adliya restaurant strip, and fresh Gulf seafood.',
    },
    culture: {
      title: 'Best Culture Experiences in Bahrain During F1 2026',
      description:
        'Top cultural experiences in Bahrain for the 2026 Bahrain Grand Prix — UNESCO-listed Bahrain Fort, Manama Gold Souk, National Museum, and Muharraq old town walking tours.',
    },
    adventure: {
      title: 'Best Adventure Experiences in Bahrain During F1 2026',
      description:
        'Adventure activities in Bahrain for the 2026 Bahrain Grand Prix weekend — desert safaris at sunset, dune bashing, camel riding, and kite-surfing off the northern coast.',
    },
    daytrip: {
      title: 'Best Day Trips & Excursions in Bahrain During F1 2026',
      description:
        'The best day trips and excursions for the 2026 Bahrain Grand Prix — dhow dinner cruises, Al Dar Islands boat trips, Tree of Life tours, and full Manama city tours.',
    },
    nightlife: {
      title: 'Best Nightlife Experiences in Bahrain During F1 2026',
      description:
        'Top nightlife in Bahrain for the 2026 Bahrain Grand Prix weekend — Adliya rooftop bars, hotel lounges after qualifying, and the electric Saturday-night circuit atmosphere.',
    },
  },
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { raceSlug } = await params;
  const { category } = await searchParams;
  const race = await getRaceBySlug(raceSlug);
  if (!race) return {};

  const categoryLabel = category ? (CATEGORY_LABELS[category] ?? category) : null;
  // Canonical always points to the unfiltered URL — filter params must never appear in canonicals
  const canonical = `https://f1weekend.co/races/${raceSlug}/experiences`;

  // Use category-specific copy if available, otherwise fall back to race-level copy
  const categoryCopy = category ? CATEGORY_META[race.city]?.[category] : null;

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
            {race.city === 'Suzuka' && (
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-xl mt-3">
                Suzuka offers curated experiences for the 2026 Japanese Grand Prix — from half-day
                Ise Grand Shrine visits and Nagoya food tours that fit your Friday morning gap, to
                full-day Kyoto or Nara day trips perfect for Thursday before sessions begin. Filter
                by category or session window to find exactly what fits your schedule.
              </p>
            )}
            {race.city === 'Sakhir' && (
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-xl mt-3">
                Bahrain offers 30+ curated experiences for the 2026 Bahrain Grand Prix — from desert
                safaris and dhow dinner cruises that fit your Friday evening gap (4 hrs), to
                UNESCO-listed Bahrain Fort and Manama souq food walks perfect for the 6-hour Saturday
                morning window. Session gaps run long here; plenty of time to explore Sakhir and
                Manama. Filter by category or session window to find exactly what fits.
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
