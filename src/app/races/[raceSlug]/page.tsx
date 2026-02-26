import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRaceBySlug } from '@/services/race.service';
import CircuitMap from '@/components/race/CircuitMap';
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
  { href: 'guide', label: 'Melbourne Guide', icon: '📖', desc: 'Things to do, session gaps & tips' },
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
          {NAV_ITEMS.filter(item => item.href !== 'guide' || raceContent?.hasGuide).map(({ href, label, icon, desc }) => (
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
      </div>
    </div>
  );
}
