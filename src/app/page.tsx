import type { Metadata } from 'next';
import Link from 'next/link';
import { getRaceBySlug, getSessionsByRace, getWindowsByRace } from '@/services/race.service';
import { getExperiencesByWindow, getFeaturedExperiences } from '@/services/experience.service';
import RaceSchedule from '@/components/race/RaceSchedule';
import RaceCountdown from '@/components/race/RaceCountdown';
import CircuitMap from '@/components/race/CircuitMap';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'F1 Weekend | Race Weekend Companion — Melbourne 2026',
  description:
    'Discover the best Melbourne experiences for the 2026 Australian Grand Prix. Session-gap planning, curated tours, restaurants, and activities near Albert Park Circuit.',
  alternates: { canonical: 'https://f1weekend.co' },
  keywords: [
    'Australian Grand Prix 2026',
    'Melbourne F1 2026',
    'F1 race weekend Melbourne',
    'Albert Park Circuit activities',
    'things to do Melbourne Grand Prix',
    'F1 Melbourne experiences',
  ],
  openGraph: {
    title: 'F1 Weekend | Race Weekend Companion — Melbourne 2026',
    description:
      'Discover the best Melbourne experiences for the 2026 Australian Grand Prix. Session-gap planning, curated tours, and activities near Albert Park.',
    url: 'https://f1weekend.co',
    type: 'website',
  },
  twitter: {
    title: 'F1 Weekend | Race Weekend Companion — Melbourne 2026',
    description: 'Discover the best Melbourne experiences for the 2026 Australian Grand Prix.',
  },
};

const websiteLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'F1 Weekend',
  url: 'https://f1weekend.co',
  description: 'F1 race weekend companion — curated Melbourne experiences for the 2026 Australian Grand Prix',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: 'https://f1weekend.co/experiences?q={search_term_string}' },
    'query-input': 'required name=search_term_string',
  },
};

const eventLd = {
  '@context': 'https://schema.org',
  '@type': 'SportsEvent',
  name: '2026 Formula 1 Australian Grand Prix',
  alternateName: 'Australian GP 2026',
  startDate: '2026-03-05',
  endDate: '2026-03-08',
  eventStatus: 'https://schema.org/EventScheduled',
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  location: {
    '@type': 'Place',
    name: 'Albert Park Circuit',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Albert Park',
      addressLocality: 'Melbourne',
      addressRegion: 'Victoria',
      postalCode: '3004',
      addressCountry: 'AU',
    },
    geo: { '@type': 'GeoCoordinates', latitude: -37.8497, longitude: 144.9756 },
  },
  organizer: { '@type': 'Organization', name: 'Formula One Management', url: 'https://www.formula1.com' },
  sport: 'Motorsport',
  url: 'https://f1weekend.co',
};

export default async function HomePage() {
  const race = await getRaceBySlug('melbourne-2026');

  if (!race) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[var(--text-secondary)]">
        Race data unavailable.
      </div>
    );
  }

  const [sessions, windows, featuredExps] = await Promise.all([
    getSessionsByRace(race.id),
    getWindowsByRace(race.id),
    getFeaturedExperiences(race.id),
  ]);

  const windowData = await Promise.all(
    windows.map(async (w) => {
      const exps = await getExperiencesByWindow(w.slug, race.id);
      return {
        slug: w.slug,
        count: exps.length,
        experiences: exps.slice(0, 4).map((e) => ({
          title: e.title,
          imageEmoji: e.imageEmoji,
          durationLabel: e.durationLabel,
        })),
      };
    })
  );

  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventLd) }} />
      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-20 pb-12 px-4">
        {/* Background layers */}
        <div className="absolute inset-0 carbon-texture" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 70% 50%, rgba(225,6,0,0.06) 0%, transparent 70%)',
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-24 hero-gradient" />

        <div className="relative max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center min-h-[420px]">
            {/* Left: text + countdown */}
            <div className="flex flex-col justify-center py-8">
              <p className="text-xs font-medium uppercase-label text-[var(--accent-red)] mb-5 tracking-widest">
                🏎 Australian Grand Prix 2026 · Melbourne · Mar 5–8
              </p>

              <h1 className="font-display font-black text-5xl md:text-6xl text-white uppercase-heading leading-tight mb-4">
                Melbourne has
                <br />
                <span className="text-[var(--accent-red)]">more to offer.</span>
              </h1>

              <p className="text-[var(--text-secondary)] text-base md:text-lg max-w-sm">
                Discover the best of Melbourne — curated experiences for every session gap of the
                race weekend.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 mb-8 mt-6">
                <Link
                  href="/experiences"
                  className="px-5 py-2.5 bg-[var(--accent-teal)] hover:bg-[var(--accent-teal-hover)] text-[var(--bg-primary)] font-semibold text-sm rounded-full transition-colors whitespace-nowrap"
                >
                  Explore Melbourne
                </Link>
                <Link
                  href="/itinerary"
                  className="px-5 py-2.5 border border-white/20 hover:border-white/40 text-white hover:bg-white/5 font-semibold text-sm rounded-full transition-colors whitespace-nowrap"
                >
                  Build Itinerary
                </Link>
              </div>

              {/* Countdown */}
              <div>
                <p className="text-xs font-medium uppercase-label text-[var(--text-secondary)] mb-3 tracking-widest">
                  LIGHTS OUT IN
                </p>
                <RaceCountdown />
              </div>

              {/* Category pills — mobile only */}
              <div className="flex flex-wrap gap-2 mt-6 md:hidden">
                {[
                  { label: 'Food',      cat: 'food',      color: '#FF6B35' },
                  { label: 'Culture',   cat: 'culture',   color: '#A855F7' },
                  { label: 'Adventure', cat: 'adventure', color: '#22C55E' },
                  { label: 'Day Trip',  cat: 'daytrip',   color: '#3B82F6' },
                  { label: 'Nightlife', cat: 'nightlife', color: '#EC4899' },
                ].map(({ label, cat, color }) => (
                  <Link
                    key={cat}
                    href={`/experiences?category=${cat}`}
                    className="px-3 py-1 rounded-full text-xs font-semibold uppercase-label transition-colors"
                    style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right: circuit map */}
            <div className="hidden md:flex items-center justify-center relative">
              {/* Glow behind circuit */}
              <div
                className="absolute w-64 h-64 rounded-full pointer-events-none"
                style={{
                  background:
                    'radial-gradient(circle, rgba(225,6,0,0.12) 0%, transparent 70%)',
                }}
              />
              <CircuitMap className="w-full max-w-lg opacity-90" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Experiences ── */}
      {featuredExps.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-black text-xl text-white uppercase-heading">
              Top Picks
            </h2>
            <Link
              href="/experiences"
              className="text-sm font-medium text-[var(--accent-teal)] hover:text-white transition-colors"
            >
              View all →
            </Link>
          </div>

          {/* Horizontal scroll on mobile, wrapping row on desktop */}
          <div className="flex gap-4 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible scrollbar-hide">
            {featuredExps.slice(0, 6).map((exp) => {
              const CATEGORY_COLORS: Record<string, string> = {
                food: '#FF6B35', culture: '#A855F7', adventure: '#22C55E',
                daytrip: '#3B82F6', nightlife: '#EC4899',
              };
              const color = CATEGORY_COLORS[exp.category] ?? '#6E6E82';
              return (
                <Link
                  key={exp.id}
                  href={`/experiences/${exp.slug}`}
                  className="group shrink-0 w-48 sm:w-44 p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--accent-teal)]/50 hover:bg-[var(--bg-surface)] transition-all"
                >
                  <div className="text-3xl mb-3">{exp.imageEmoji}</div>
                  <p className="text-sm font-semibold text-white group-hover:text-[var(--accent-teal)] transition-colors line-clamp-2 leading-tight mb-2">
                    {exp.title}
                  </p>
                  <p className="text-xs font-medium mb-1" style={{ color }}>
                    {exp.category.charAt(0).toUpperCase() + exp.category.slice(1)}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mono-data">
                    {exp.durationLabel} · {exp.priceLabel}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Race schedule + gap cards ── */}
      <section className="max-w-3xl mx-auto px-4 pb-24">
        <div className="racing-stripe mb-8" />
        <RaceSchedule sessions={sessions} windows={windows} windowData={windowData} />
      </section>
    </div>
  );
}
