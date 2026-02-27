import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRaceBySlug } from '@/services/race.service';
import CircuitMap from '@/components/race/CircuitMap';
import DataInsights from '@/components/DataInsights';
import { RACE_CONTENT } from '@/data/race-content';

interface Props {
  params: Promise<{ raceSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { raceSlug } = await params;
  const race = await getRaceBySlug(raceSlug);
  if (!race) return {};
  const raceContent = RACE_CONTENT[raceSlug];
  return {
    title: raceContent?.pageTitle ?? `${race.name} Travel Guide | F1 Weekend`,
    description: raceContent?.pageDescription ?? `Your complete travel companion for the ${race.name} at ${race.circuitName}, ${race.city}. Schedule, experiences, and transport guide.`,
    alternates: { canonical: `https://f1weekend.co/races/${raceSlug}` },
    ...(raceContent?.pageKeywords?.length && { keywords: raceContent.pageKeywords }),
  };
}

const NAV_ITEMS: { href: string; label: string; icon: string; desc: string }[] = [
  { href: 'schedule', label: 'Weekend Schedule', icon: '📅', desc: 'All sessions, times & timetable' },
  { href: 'experiences', label: 'Experiences', icon: '🗺', desc: 'Curated activities for every session gap' },
  { href: 'getting-there', label: 'Getting There', icon: '🚃', desc: 'Transport, parking & gate times' },
  { href: 'tips', label: 'Tips & FAQ', icon: '💡', desc: 'Weather, budget, tips & FAQ' },
];

export default async function RaceLandingPage({ params }: Props) {
  const { raceSlug } = await params;
  const race = await getRaceBySlug(raceSlug);
  if (!race) notFound();

  // Compute first–last day dates from raceDate (Sunday = race day)
  const raceContent = RACE_CONTENT[raceSlug];
  const raceDay = new Date(race.raceDate + 'T00:00:00Z');
  const firstDayOffset = raceContent?.firstDayOffset ?? -2;
  const firstDate = new Date(raceDay);
  firstDate.setUTCDate(raceDay.getUTCDate() + firstDayOffset);
  const firstDateStr = firstDate.toLocaleDateString('en-AU', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const sunStr = raceDay.toLocaleDateString('en-AU', { month: 'short', day: 'numeric', timeZone: 'UTC' });

  const faqLd = raceContent?.faqLd ?? null;

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://f1weekend.co' },
      { '@type': 'ListItem', position: 2, name: race.name, item: `https://f1weekend.co/races/${raceSlug}` },
    ],
  };

  const isMelbourne = raceSlug === 'melbourne-2026';

  return (
    <div className="min-h-screen pt-24 pb-24 px-4">
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <div className="max-w-3xl mx-auto">
        <p className="text-xs font-medium uppercase-label text-[var(--accent-red)] mb-2">
          Round {race.round} · {race.season}
        </p>
        <h1 className="font-display font-black text-4xl sm:text-5xl text-white uppercase-heading leading-none mb-3">
          {race.name}
        </h1>
        <p className="text-[var(--text-secondary)] text-lg mb-1">
          {race.circuitName}
        </p>
        <p className="text-sm text-[var(--text-secondary)] mono-data mb-10">
          {race.city}, {race.country} · {firstDateStr}–{sunStr}, {race.season}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {NAV_ITEMS.filter(item => item.href !== 'tips' || !!raceContent?.tips).map(({ href, label, icon, desc }) => (
            <Link
              key={href}
              href={`/races/${raceSlug}/${href}`}
              className="group p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:border-[var(--accent-teal)]/50 hover:bg-[var(--bg-surface)] transition-all"
            >
              <span className="text-2xl block mb-3">{icon}</span>
              <p className="font-display font-bold text-white group-hover:text-[var(--accent-teal)] transition-colors mb-1">
                {label}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">{desc}</p>
            </Link>
          ))}
        </div>

        <p className="text-[var(--text-secondary)] text-sm leading-relaxed mt-6 mb-2">
          Looking for things to do between sessions?{' '}
          <Link href={`/races/${raceSlug}/experiences`} className="text-[var(--accent-teal)] hover:underline">
            Browse {race.city} F1 {race.season} experiences
          </Link>{' '}
          — curated activities matched to every session gap in the weekend.
        </p>

        {raceContent?.whyCityText && (
          <section className="mt-12 pt-8 border-t border-[var(--border-subtle)]">
            <h2 className="font-display font-bold text-xl text-white uppercase-heading mb-4">
              Why {race.city} Is the Perfect F1 City
            </h2>
            <p className="text-[var(--text-secondary)] text-base leading-relaxed max-w-2xl mb-6">
              {raceContent.whyCityText}
            </p>
            {raceContent.circuitMapSrc && (
              <CircuitMap
                src={raceContent.circuitMapSrc}
                alt={`${race.circuitName} — Track Map`}
                width={1252}
                height={704}
                className="rounded-xl overflow-hidden border border-[var(--border-subtle)] mb-6"
              />
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Round', value: `${race.round} of 24` },
                { label: 'Dates', value: `${firstDateStr}–${sunStr}` },
                { label: 'Circuit', value: race.circuitName },
                { label: 'City', value: `${race.city}, ${race.countryCode}` },
              ].map(({ label, value }) => (
                <div key={label} className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                  <p className="text-xs font-medium uppercase-label text-[var(--text-secondary)] mb-1">{label}</p>
                  <p className="font-display font-bold text-white text-sm">{value}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Race Weekend Format — Melbourne only */}
        {isMelbourne && (
          <section className="mt-12 pt-8 border-t border-[var(--border-subtle)]">
            <h2 className="font-display font-bold text-2xl text-white uppercase-heading mb-4">
              Race Weekend Format
            </h2>
            <p className="text-[var(--text-secondary)] text-base leading-relaxed mb-6">
              The 2026 Australian Grand Prix follows the Sprint weekend format, compressing qualifying,
              a Sprint shootout, and a Sprint race into Saturday alongside the main qualifying session.
              Here is how the four days break down, and where the gaps fall.
            </p>
            <div className="space-y-4">
              {[
                {
                  day: 'Thursday, March 5',
                  badge: 'FREE DAY',
                  badgeColor: 'var(--accent-teal)',
                  desc: 'Fan activations at the circuit and Central Business District. No competitive sessions. Best day for a full Great Ocean Road trip or Yarra Valley wine tour. Gates open but no timing pressure.',
                  gap: 'All day — 10+ hours available',
                },
                {
                  day: 'Friday, March 6',
                  badge: 'FP1 + FP2',
                  badgeColor: 'var(--accent-red)',
                  desc: 'FP1 at 11:30 AEDT (gates open ~09:30). FP2 in the afternoon. Morning gap of 3.5 hours before gates open — ideal for a laneway food tour. Evening gap of 4+ hours after FP2 for dinner.',
                  gap: 'Morning: 3.5 hrs · Evening: 4+ hrs',
                },
                {
                  day: 'Saturday, March 7',
                  badge: 'SPRINT + QUALI',
                  badgeColor: 'var(--accent-red)',
                  desc: 'Sprint Shootout in the morning, F1 Sprint in the afternoon, main Qualifying in the evening. Gaps are shorter — ideal for quick St Kilda foreshore walks or nearby café visits.',
                  gap: 'Morning: 2.5 hrs · Between sessions: 1.5 hrs',
                },
                {
                  day: 'Sunday, March 8',
                  badge: 'RACE DAY',
                  badgeColor: 'var(--accent-red)',
                  desc: 'Race start at 15:00 AEDT. Morning free until ~11:00 when gates open — 3+ hours for the South Melbourne Market, St Kilda beach, or a relaxed Central Business District brunch before the main event.',
                  gap: 'Morning: 3+ hrs before gates open',
                },
              ].map(({ day, badge, badgeColor, desc, gap }) => (
                <div key={day} className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-display font-bold text-white">{day}</p>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ color: badgeColor, backgroundColor: `${badgeColor}20`, border: `1px solid ${badgeColor}40` }}
                    >
                      {badge}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-2">{desc}</p>
                  <p className="text-xs font-medium text-[var(--accent-teal)] mono-data">{gap}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Thursday Free Day — Melbourne only */}
        {isMelbourne && (
          <section id="thursday" className="mt-12 pt-8 border-t border-[var(--border-subtle)]">
            <h2 className="font-display font-bold text-2xl text-white uppercase-heading mb-4">
              Thursday March 5 — Your Free Day
            </h2>
            <p className="text-[var(--text-secondary)] text-base leading-relaxed mb-6">
              Thursday is the only day with no competitive sessions on track. If you hold a 4-day or
              Thursday pass, this is your day to explore. Use it for experiences that need a full day
              — the Great Ocean Road, Yarra Valley, or an early hot air balloon flight before Friday.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                <p className="text-xs font-medium uppercase-label text-[var(--accent-teal)] mb-2">FULL DAY · 10 HRS</p>
                <p className="font-display font-bold text-white mb-2">Great Ocean Road</p>
                <p className="text-xs text-[var(--text-secondary)] mb-4">
                  12 Apostles, rainforest gorges, Lorne — the definitive Melbourne day trip.
                  Departs ~07:30, returns ~19:30. From A$115.
                </p>
                <Link href="/races/melbourne-2026/experiences/great-ocean-road-day-trip" className="text-xs font-medium text-[var(--accent-teal)] hover:text-white transition-colors">
                  See experience →
                </Link>
              </div>
              <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                <p className="text-xs font-medium uppercase-label text-[var(--accent-red)] mb-2">MORNING · 3–4 HRS</p>
                <p className="font-display font-bold text-white mb-2">Hot Air Balloon</p>
                <p className="text-xs text-[var(--text-secondary)] mb-4">
                  Dawn flight over the Yarra Valley — a unique perspective on Victoria.
                  Departs at sunrise (~05:30), returns by 09:30. From A$365.
                </p>
                <Link href="/races/melbourne-2026/experiences/hot-air-balloon-yarra-valley" className="text-xs font-medium text-[var(--accent-teal)] hover:text-white transition-colors">
                  See experience →
                </Link>
              </div>
              <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                <p className="text-xs font-medium uppercase-label mb-2" style={{ color: '#E67E22' }}>HALF DAY · 3 HRS</p>
                <p className="font-display font-bold text-white mb-2">Melbourne Laneways Food Tour</p>
                <p className="text-xs text-[var(--text-secondary)] mb-4">
                  10 tastings across the CBD laneways — espresso, dumplings, baklava, craft beer.
                  Perfect Thursday introduction to Melbourne. From A$99.
                </p>
                <Link href="/races/melbourne-2026/experiences/melbourne-laneways-food-tour" className="text-xs font-medium text-[var(--accent-teal)] hover:text-white transition-colors">
                  See experience →
                </Link>
              </div>
            </div>
            <Link
              href="/races/melbourne-2026/experiences?category=daytrip"
              className="inline-block text-sm font-medium text-[var(--accent-teal)] hover:text-white transition-colors"
            >
              Browse all Thursday day trips →
            </Link>
          </section>
        )}

        {/* DataInsights — races with openF1 historical data */}
        {raceContent?.openF1 && (
          <div className="mt-12 pt-8 border-t border-[var(--border-subtle)]">
            <DataInsights
              countryName={raceContent.openF1.countryName}
              year={raceContent.openF1.year}
              circuitName={race.circuitName}
            />
          </div>
        )}
      </div>
    </div>
  );
}
