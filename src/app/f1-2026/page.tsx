import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllRaces } from '@/services/race.service';
import { formatRaceDates } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'F1 2026 Season Travel Guide — All 24 Races, Cities & Dates | F1 Weekend',
  description:
    'Complete F1 2026 calendar with travel guides, city breakdowns, and race dates for all 24 grands prix. Plan your Formula 1 travel for Melbourne, Shanghai, Monaco, Silverstone and more.',
  alternates: { canonical: 'https://f1weekend.co/f1-2026' },
  keywords: [
    'F1 2026 calendar',
    'Formula 1 2026 season',
    'F1 2026 race dates',
    'F1 travel guide 2026',
    'Formula One 2026 schedule',
    'F1 grand prix 2026',
  ],
  openGraph: {
    title: 'F1 2026 Season Travel Guide — All 24 Races | F1 Weekend',
    description: 'Complete F1 2026 calendar with travel guides for every race city. 24 races, 24 cities, 5 continents.',
    url: 'https://f1weekend.co/f1-2026',
    siteName: 'F1 Weekend',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'F1 2026 Season Travel Guide — All 24 Races | F1 Weekend',
    description: 'Complete F1 2026 calendar with travel guides for every race city.',
  },
};

const FAQ = [
  {
    q: 'When is the 2026 F1 season?',
    a: 'The 2026 Formula 1 season runs from March 5 to December 6, spanning 24 grands prix across 24 cities on 5 continents. It starts in Melbourne, Australia and finishes at Yas Marina in Abu Dhabi.',
  },
  {
    q: 'Which cities host F1 races in 2026?',
    a: 'The 2026 F1 calendar includes Melbourne, Shanghai, Suzuka, Sakhir, Jeddah, Miami, Imola, Monaco, Barcelona, Montreal, Spielberg, Silverstone, Spa, Budapest, Zandvoort, Monza, Baku, Singapore, Austin, Mexico City, São Paulo, Las Vegas, Lusail, and Abu Dhabi.',
  },
  {
    q: 'What is the best F1 race to travel to in 2026?',
    a: 'Melbourne is widely regarded as one of the best F1 races for first-time F1 travellers — incredible atmosphere, world-class city to explore, and a street-style circuit at Albert Park. Monaco, Silverstone, and Spa are other legendary destinations worth considering.',
  },
  {
    q: 'How do I plan an F1 race trip?',
    a: 'Book your race tickets and accommodation early — popular races like Melbourne and Monaco sell out months in advance. Plan activities for session gaps using guides like ours. Arrive a day before and stay a day after to enjoy the host city without race-day crowds.',
  },
  {
    q: 'Is Melbourne a good destination for the 2026 Australian Grand Prix?',
    a: 'Yes — Melbourne is one of the most liveable cities in the world with an exceptional food scene, vibrant culture, and easy access to the Albert Park Circuit. The city is compact and walkable, making it ideal for F1 travellers who want to explore between sessions.',
  },
  {
    q: 'When should I book for the 2026 F1 races?',
    a: 'For the Australian GP (Mar 5–8) you should book now — hotels and tickets sell out fast. For later races like Silverstone and Monaco, book 6–12 months in advance. Las Vegas, Miami, and Singapore require early booking due to limited accommodation options.',
  },
];

const CANCELLED_RACES = new Set(['bahrain-2026', 'saudi-2026']);

export default async function F12026Page() {
  const allRaces = await getAllRaces();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const F1_2026 = allRaces.map(r => ({
    round: r.round,
    name: r.name,
    city: r.city,
    country: r.country,
    flag: r.flag ?? '🏁',
    circuit: r.circuitName,
    dates: formatRaceDates(r.raceDate, r.hasThursdayFreeDay),
    raceEnd: r.raceDate,
    slug: r.slug,
    hasGuide: !!r.available,
    isAvailable: !!r.available,
    isCancelled: CANCELLED_RACES.has(r.slug),
  }));

  const eventSeriesLd = {
    '@context': 'https://schema.org',
    '@type': 'EventSeries',
    name: '2026 Formula 1 World Championship',
    url: 'https://f1weekend.co/f1-2026',
    description: 'The 2026 FIA Formula One World Championship — 24 grands prix across 24 cities.',
    organizer: { '@type': 'Organization', name: 'Formula One Management', url: 'https://www.formula1.com' },
    startDate: '2026-03-05',
    endDate: '2026-12-06',
  };

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: '2026 F1 Calendar — All 24 Grands Prix',
    url: 'https://f1weekend.co/f1-2026',
    numberOfItems: F1_2026.length,
    itemListElement: F1_2026.map((race, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: race.name,
      item: race.slug ? `https://f1weekend.co/races/${race.slug}` : `https://f1weekend.co/f1-2026`,
    })),
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  // Next 2 upcoming guide races (race weekend not yet over)
  const guideRaces = F1_2026
    .filter((r) => r.isAvailable && r.raceEnd && new Date(r.raceEnd) >= today)
    .slice(0, 2);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSeriesLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <div className="min-h-screen pt-24 pb-24 px-4">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="mb-10">
            <p className="text-xs font-medium uppercase-label text-[var(--accent-red)] mb-3 tracking-widest">
              2026 SEASON
            </p>
            <h1 className="font-display font-black text-4xl sm:text-5xl text-white uppercase-heading leading-none mb-4">
              The 2026 F1 Season<br />
              <span className="text-[var(--accent-teal)]">Travel Guide</span>
            </h1>
            <p className="text-[var(--text-secondary)] text-lg max-w-xl">
              24 races. 24 cities. One insane year. Your complete guide to following Formula 1 around the world.
            </p>
          </div>

          {/* Stat pills */}
          <div className="flex flex-wrap gap-3 mb-12">
            {[
              { value: '24', label: 'Races' },
              { value: '24', label: 'Host Cities' },
              { value: '5', label: 'Continents' },
              { value: '10', label: 'Months' },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="px-5 py-3 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-secondary)]"
              >
                <span className="font-display font-black text-white text-lg">{value}</span>
                <span className="text-[var(--text-secondary)] text-sm ml-2">{label}</span>
              </div>
            ))}
          </div>

          {/* Full guides section */}
          <section className="mb-10">
            <h2 className="font-display font-bold text-xl text-white uppercase-heading mb-5">
              Full Guides Available
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {guideRaces.map((race) => (
                <Link
                  key={race.slug}
                  href={`/races/${race.slug}`}
                  className="group p-5 rounded-xl border border-[var(--accent-teal)]/30 bg-[var(--bg-secondary)] hover:border-[var(--accent-teal)]/70 hover:bg-[var(--bg-surface)] transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{race.flag}</span>
                        <span className="text-xs font-bold uppercase-label text-[var(--accent-teal)]">
                          Round {race.round}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-white group-hover:text-[var(--accent-teal)] transition-colors">
                        {race.name}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                        {race.circuit}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] mono-data mt-1">
                        {race.dates}, 2026
                      </p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--accent-teal)]/15 text-[var(--accent-teal)] whitespace-nowrap mt-1">
                      Full Guide →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Full calendar grid */}
          <section className="mb-14">
            <h2 className="font-display font-bold text-xl text-white uppercase-heading mb-5">
              Full 2026 Calendar
            </h2>
            <div className="rounded-xl border border-[var(--border-subtle)] overflow-hidden">
              {F1_2026.map((race, i) => (
                <div
                  key={race.slug}
                  className={`flex items-center gap-4 px-5 py-4 ${
                    i < F1_2026.length - 1 ? 'border-b border-[var(--border-subtle)]' : ''
                  } ${race.hasGuide ? 'bg-[var(--bg-secondary)]' : ''}`}
                >
                  <span className="text-xs font-bold text-[var(--text-secondary)] mono-data w-6 shrink-0">
                    {String(race.round).padStart(2, '0')}
                  </span>
                  <span className="text-xl shrink-0">{race.flag}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{race.name}</p>
                    <p className="text-xs text-[var(--text-secondary)] mono-data">{race.circuit} · {race.dates}</p>
                  </div>
                  {race.hasGuide && race.slug ? (
                    <Link
                      href={`/races/${race.slug}`}
                      className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full bg-[var(--accent-teal)]/15 text-[var(--accent-teal)] hover:bg-[var(--accent-teal)]/25 transition-colors whitespace-nowrap"
                    >
                      Guide →
                    </Link>
                  ) : race.isCancelled ? (
                    <span className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border border-dashed border-red-500/30 text-red-400/70 whitespace-nowrap cursor-default">
                      Called off
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border border-dashed border-[var(--border-subtle)] text-[var(--text-secondary)]/50 whitespace-nowrap cursor-default">
                      Coming Soon
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-14">
            <h2 className="font-display font-bold text-2xl text-white uppercase-heading mb-6">
              F1 Travel FAQ
            </h2>
            <div className="space-y-4">
              {FAQ.map(({ q, a }) => (
                <details
                  key={q}
                  className="group rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] overflow-hidden"
                >
                  <summary className="px-5 py-4 cursor-pointer font-medium text-white list-none flex items-center justify-between gap-3 hover:text-[var(--accent-teal)] transition-colors">
                    <span>{q}</span>
                    <span className="text-[var(--text-secondary)] group-open:rotate-180 transition-transform shrink-0">▾</span>
                  </summary>
                  <div className="px-5 pb-4 text-sm text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-subtle)] pt-3">
                    {a}
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* Bottom CTAs */}
          <section className="pt-8 border-t border-[var(--border-subtle)]">
            <p className="text-sm font-medium uppercase-label text-[var(--text-secondary)] mb-5 tracking-widest">
              Start Planning
            </p>
            <div className="flex flex-wrap gap-4">
              {F1_2026.filter(r => r.isAvailable).slice(0, 3).map(race => (
                <Link
                  key={race.slug}
                  href={`/itinerary?race=${race.slug}`}
                  className="px-6 py-3 rounded-xl bg-[var(--accent-red)] hover:bg-[var(--accent-red-hover)] text-white font-display font-bold transition-colors"
                >
                  {race.flag} {race.city} GP Guide
                </Link>
              ))}
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
