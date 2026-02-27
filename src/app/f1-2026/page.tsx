import type { Metadata } from 'next';
import Link from 'next/link';

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

interface Race {
  round: number;
  name: string;
  city: string;
  country: string;
  flag: string;
  circuit: string;
  dates: string;
  slug: string | null;
  hasGuide: boolean;
}

const F1_2026: Race[] = [
  { round: 1,  name: 'Australian Grand Prix',      city: 'Melbourne',    country: 'Australia',      flag: '🇦🇺', circuit: 'Albert Park Circuit',               dates: 'Mar 5–8',     slug: 'melbourne-2026', hasGuide: true  },
  { round: 2,  name: 'Chinese Grand Prix',          city: 'Shanghai',     country: 'China',           flag: '🇨🇳', circuit: 'Shanghai International Circuit',    dates: 'Mar 13–15',   slug: 'shanghai-2026',  hasGuide: true  },
  { round: 3,  name: 'Japanese Grand Prix',         city: 'Suzuka',       country: 'Japan',           flag: '🇯🇵', circuit: 'Suzuka Circuit',                    dates: 'Mar 27–29',   slug: null,             hasGuide: false },
  { round: 4,  name: 'Bahrain Grand Prix',          city: 'Sakhir',       country: 'Bahrain',         flag: '🇧🇭', circuit: 'Bahrain International Circuit',     dates: 'Apr 16–19',   slug: null,             hasGuide: false },
  { round: 5,  name: 'Saudi Arabian Grand Prix',    city: 'Jeddah',       country: 'Saudi Arabia',    flag: '🇸🇦', circuit: 'Jeddah Corniche Circuit',           dates: 'Apr 23–26',   slug: null,             hasGuide: false },
  { round: 6,  name: 'Miami Grand Prix',            city: 'Miami',        country: 'USA',             flag: '🇺🇸', circuit: 'Miami International Autodrome',     dates: 'May 7–10',    slug: null,             hasGuide: false },
  { round: 7,  name: 'Emilia Romagna Grand Prix',   city: 'Imola',        country: 'Italy',           flag: '🇮🇹', circuit: 'Autodromo Enzo e Dino Ferrari',     dates: 'May 21–24',   slug: null,             hasGuide: false },
  { round: 8,  name: 'Monaco Grand Prix',           city: 'Monaco',       country: 'Monaco',          flag: '🇲🇨', circuit: 'Circuit de Monaco',                 dates: 'May 28–31',   slug: null,             hasGuide: false },
  { round: 9,  name: 'Spanish Grand Prix',          city: 'Barcelona',    country: 'Spain',           flag: '🇪🇸', circuit: 'Circuit de Barcelona-Catalunya',    dates: 'Jun 4–7',     slug: null,             hasGuide: false },
  { round: 10, name: 'Canadian Grand Prix',         city: 'Montreal',     country: 'Canada',          flag: '🇨🇦', circuit: 'Circuit Gilles Villeneuve',         dates: 'Jun 11–14',   slug: null,             hasGuide: false },
  { round: 11, name: 'Austrian Grand Prix',         city: 'Spielberg',    country: 'Austria',         flag: '🇦🇹', circuit: 'Red Bull Ring',                     dates: 'Jun 25–28',   slug: null,             hasGuide: false },
  { round: 12, name: 'British Grand Prix',          city: 'Silverstone',  country: 'Great Britain',   flag: '🇬🇧', circuit: 'Silverstone Circuit',               dates: 'Jul 2–5',     slug: null,             hasGuide: false },
  { round: 13, name: 'Belgian Grand Prix',          city: 'Spa',          country: 'Belgium',         flag: '🇧🇪', circuit: 'Circuit de Spa-Francorchamps',      dates: 'Jul 17–19',   slug: null,             hasGuide: false },
  { round: 14, name: 'Hungarian Grand Prix',        city: 'Budapest',     country: 'Hungary',         flag: '🇭🇺', circuit: 'Hungaroring',                       dates: 'Jul 24–26',   slug: null,             hasGuide: false },
  { round: 15, name: 'Dutch Grand Prix',            city: 'Zandvoort',    country: 'Netherlands',     flag: '🇳🇱', circuit: 'Circuit Zandvoort',                 dates: 'Aug 27–30',   slug: null,             hasGuide: false },
  { round: 16, name: 'Italian Grand Prix',          city: 'Monza',        country: 'Italy',           flag: '🇮🇹', circuit: 'Autodromo Nazionale Monza',         dates: 'Sep 4–6',     slug: null,             hasGuide: false },
  { round: 17, name: 'Azerbaijan Grand Prix',       city: 'Baku',         country: 'Azerbaijan',      flag: '🇦🇿', circuit: 'Baku City Circuit',                 dates: 'Sep 17–20',   slug: null,             hasGuide: false },
  { round: 18, name: 'Singapore Grand Prix',        city: 'Singapore',    country: 'Singapore',       flag: '🇸🇬', circuit: 'Marina Bay Street Circuit',         dates: 'Sep 25–27',   slug: null,             hasGuide: false },
  { round: 19, name: 'United States Grand Prix',    city: 'Austin',       country: 'USA',             flag: '🇺🇸', circuit: 'Circuit of the Americas',           dates: 'Oct 15–18',   slug: null,             hasGuide: false },
  { round: 20, name: 'Mexico City Grand Prix',      city: 'Mexico City',  country: 'Mexico',          flag: '🇲🇽', circuit: 'Autodromo Hermanos Rodriguez',      dates: 'Oct 22–25',   slug: null,             hasGuide: false },
  { round: 21, name: 'São Paulo Grand Prix',        city: 'São Paulo',    country: 'Brazil',          flag: '🇧🇷', circuit: 'Autodromo Jose Carlos Pace',        dates: 'Oct 30–Nov 1',slug: null,             hasGuide: false },
  { round: 22, name: 'Las Vegas Grand Prix',        city: 'Las Vegas',    country: 'USA',             flag: '🇺🇸', circuit: 'Las Vegas Strip Circuit',           dates: 'Nov 19–22',   slug: null,             hasGuide: false },
  { round: 23, name: 'Qatar Grand Prix',            city: 'Lusail',       country: 'Qatar',           flag: '🇶🇦', circuit: 'Lusail International Circuit',      dates: 'Nov 27–29',   slug: null,             hasGuide: false },
  { round: 24, name: 'Abu Dhabi Grand Prix',        city: 'Abu Dhabi',    country: 'UAE',             flag: '🇦🇪', circuit: 'Yas Marina Circuit',                dates: 'Dec 4–6',     slug: null,             hasGuide: false },
];

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

export default function F12026Page() {
  const guideRaces = F1_2026.filter((r) => r.hasGuide);

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
                  key={race.round}
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
                  key={race.round}
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
                  ) : (
                    <span className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border border-[var(--border-subtle)] text-[var(--text-secondary)] whitespace-nowrap">
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
              <Link
                href="/races/melbourne-2026"
                className="px-6 py-3 rounded-xl bg-[var(--accent-red)] hover:bg-[var(--accent-red-hover)] text-white font-display font-bold transition-colors"
              >
                🇦🇺 Melbourne GP Guide
              </Link>
              <Link
                href="/races/shanghai-2026"
                className="px-6 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-display font-bold hover:text-white hover:border-[var(--border-medium)] transition-colors"
              >
                🇨🇳 Shanghai GP Guide
              </Link>
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
