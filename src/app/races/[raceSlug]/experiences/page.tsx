import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import ExperiencesClient from '@/components/experiences/ExperiencesClient';
import GoogleSpotsMap from '@/components/experiences/GoogleSpotsMap';
import { classifyExperience, nearbyLabel } from '@/lib/nearby';
import RaceSwitcher from '@/components/race/RaceSwitcher';
import { getRaceBySlug, getAvailableRaces, getRaceContent, getWindowsByRace } from '@/services/race.service';
import { getExperiencesByRace, getExperiencesByWindow } from '@/services/experience.service';
import { CATEGORY_LABELS } from '@/lib/constants/categories';
import NearbyFeed from '@/components/experiences/NearbyFeed';
import { getWeekendFeed } from '@/services/nearby-feed.service';
import { hasLiveExperiences } from '@/data/calendar-2026';
import { providerName } from '@/lib/providers/meta';

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

  if (hasLiveExperiences(raceSlug)) {
    return <LiveExperiencesPage race={race} availableRaces={availableRaces} />;
  }

  const exps = await getExperiencesByRace(race.id);
  // Session-window chips only for windows this race has experiences in.
  const windows = await getWindowsByRace(race.id);
  const windowCounts = Object.fromEntries(
    await Promise.all(windows.map(async (w) => [w.slug, (await getExperiencesByWindow(w.slug, race.id)).length] as const))
  );


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
  // The race FAQ (and its schema) lives on the race page, where it is shown.
  const allSchemas = [breadcrumbLd, itemListLd];

  return (
    <div className="min-h-screen pt-24 pb-24 px-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(allSchemas) }} />
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase-label text-[var(--accent-red)] mb-2">
              {race.city} {race.season}
            </p>
            <h1 className="font-display font-black text-4xl text-[var(--text-primary)] uppercase-heading">
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
            className="flex-shrink-0 mt-1 flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-medium)] transition-colors"
          >
            <span>⊙</span>
            <span>Map</span>
          </Link>
        </div>

        <div className="mb-6">
          <RaceSwitcher currentRace={race} availableRaces={availableRaces} pageType="experiences" />
        </div>

        {Number.isFinite(race.circuitLat) && Number.isFinite(race.circuitLng) && !(race.circuitLat === 0 && race.circuitLng === 0) && exps.length > 0 && (
          <section className="mb-10 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5">
            <div className="flex items-baseline justify-between gap-4 mb-4">
              <h2 className="font-display font-bold text-lg text-[var(--text-primary)]">How far is everything from the circuit?</h2>
              <Link href={`/races/${raceSlug}/experiences/map`} className="text-sm text-[var(--accent-teal,#00D2BE)] hover:underline whitespace-nowrap">
                Open full map →
              </Link>
            </div>
            <GoogleSpotsMap
              raceSlug={raceSlug}
              circuit={{ lat: race.circuitLat, lng: race.circuitLng, name: race.circuitName }}
              apiKey={process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
              spots={exps
                .filter((e) => e.lat != null && e.lng != null && !(e.lat === 0 && e.lng === 0))
                .map((e) => {
                  const nearby = classifyExperience({ lat: e.lat!, lng: e.lng! }, raceSlug, { lat: race.circuitLat, lng: race.circuitLng });
                  return {
                    id: e.id,
                    lat: e.lat!,
                    lng: e.lng!,
                    tier: nearby.tier,
                    title: e.title,
                    subtitle: nearbyLabel(nearby),
                    href: `/races/${raceSlug}/experiences/${e.slug}`,
                  };
                })}
            />
          </section>
        )}

        <Suspense
          fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-72 rounded-xl shimmer" />
              ))}
            </div>
          }
        >
          <ExperiencesClient initialExperiences={exps} raceSlug={raceSlug} windowCounts={windowCounts} />
        </Suspense>
      </div>
    </div>
  );
}

/**
 * Races whose experiences come live from GetYourGuide, Viator and Tiqets
 * (see src/data/calendar-2026.ts): every product around the circuit, nearest
 * first, on a map and as cards.
 */
async function LiveExperiencesPage({
  race,
  availableRaces,
}: {
  race: NonNullable<Awaited<ReturnType<typeof getRaceBySlug>>>;
  availableRaces: Awaited<ReturnType<typeof getAvailableRaces>>;
}) {
  const feed = await getWeekendFeed(race);
  const providers = ['getyourguide', 'viator', 'tiqets'].map(providerName).join(', ');

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://f1weekend.co' },
      { '@type': 'ListItem', position: 2, name: race.city, item: `https://f1weekend.co/races/${race.slug}` },
      { '@type': 'ListItem', position: 3, name: 'Experiences', item: `https://f1weekend.co/races/${race.slug}/experiences` },
    ],
  };

  return (
    <div className="min-h-screen pt-24 pb-24 px-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <p className="text-xs font-medium uppercase-label text-[var(--accent-red)] mb-2">
            {race.name} {race.season} · {race.circuitName}
          </p>
          <h1 className="font-display font-black text-4xl text-[var(--text-primary)] uppercase-heading">Things to do in {race.city} on race weekend</h1>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-2xl mt-3">
            Every experience on {providers} within reach of {race.circuitName}. Each card says how long it takes to
            get to the circuit and which gap in the F1 schedule it fits; when the same experience is sold on more
            than one site, you see every price.
          </p>
        </div>

        <div className="mb-8">
          <RaceSwitcher currentRace={race} availableRaces={availableRaces} pageType="experiences" />
        </div>

        {feed.cards.length > 0 ? (
          <NearbyFeed
            cards={feed.cards}
            picks={feed.picks}
            raceSlug={race.slug}
            circuit={{ lat: race.circuitLat, lng: race.circuitLng, name: race.circuitName }}
            mapsApiKey={process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
            cities={[race.city]}
          />
        ) : (
          <p className="text-[var(--text-secondary)]">Experiences are loading from our partners — please check back shortly.</p>
        )}

        <p className="mt-10 text-xs text-[var(--text-secondary)] opacity-70">
          Prices in {feed.currency}, per person, updated {new Date(feed.fetchedAt).toUTCString().slice(5, 22)} UTC.
          Most tours are placed at the city they start from; venue tickets at the venue.
          {feed.failed.length > 0 && <> {feed.failed.join(', ')} unavailable right now.</>}
        </p>
      </div>
    </div>
  );
}
