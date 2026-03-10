import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRaceBySlug, getRaceContent } from '@/services/race.service';
import { getExperiencesByWindow } from '@/services/experience.service';
import CircuitMap from '@/components/race/CircuitMap';
import DataInsights from '@/components/DataInsights';
import Breadcrumb from '@/components/Breadcrumb';
import RaceSwitcher from '@/components/race/RaceSwitcher';
import { getAvailableRaces } from '@/services/race.service';

interface Props {
  params: Promise<{ raceSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { raceSlug } = await params;
  const [race, raceContent] = await Promise.all([
    getRaceBySlug(raceSlug),
    getRaceContent(raceSlug),
  ]);
  if (!race) return {};
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
  const [race, raceContent, availableRaces] = await Promise.all([
    getRaceBySlug(raceSlug),
    getRaceContent(raceSlug),
    getAvailableRaces(),
  ]);
  if (!race) notFound();

  // Fetch Thursday experiences if they exist
  const thursdayExperiences = await getExperiencesByWindow('thursday', race.id);

  // Compute first–last day dates from raceDate (Sunday = race day)
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

  const hasThursdayFreeDay = raceContent?.hasThursdayFreeDay ?? false;

  return (
    <div className="min-h-screen pt-24 pb-24 px-4">
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <div className="max-w-3xl mx-auto">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: race.name },
        ]} />
        
        <p className="text-xs font-medium uppercase-label text-[var(--accent-red)] mb-2 mt-6">
          Round {race.round} · {race.season}
        </p>
        
        <div className="mb-4">
          <RaceSwitcher currentRace={race} availableRaces={availableRaces} pageType="schedule" />
        </div>

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
          {NAV_ITEMS.filter(item => item.href !== 'tips' || !!raceContent?.tipsContent).map(({ href, label, icon, desc }) => (
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
            
            {/* Quick Facts Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Round', value: `${race.round} of 24` },
                { label: 'Dates', value: `${firstDateStr}–${sunStr}` },
                { label: 'Circuit', value: race.circuitName },
                { label: 'City', value: `${race.city}, ${race.countryCode}` },
                // Extra facts from metaJson
                ...Object.entries((raceContent.metaJson?.circuit_facts as Record<string, string>) || {}).map(([label, value]) => ({
                  label,
                  value
                }))
              ].map(({ label, value }) => (
                <div key={label} className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                  <p className="text-xs font-medium uppercase-label text-[var(--text-secondary)] mb-1">{label}</p>
                  <p className="font-display font-bold text-white text-sm">{value}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Race Weekend Format — if has Thursday free day */}
        {hasThursdayFreeDay && (
          <section className="mt-12 pt-8 border-t border-[var(--border-subtle)]">
            <h2 className="font-display font-bold text-2xl text-white uppercase-heading mb-4">
              Race Weekend Format
            </h2>
            <p className="text-[var(--text-secondary)] text-base leading-relaxed mb-6">
              The {race.season} {race.name} runs across four days. 
              Here is how the four days break down, and where the gaps fall.
            </p>
            <div className="space-y-4">
              {[
                {
                  day: 'Thursday',
                  badge: 'FREE DAY',
                  badgeColor: 'var(--accent-teal)',
                  desc: `Fan activations at the circuit and ${race.city} city centre. No competitive sessions. Best day for full-day excursions or local tours. Gates open but no timing pressure.`,
                  gap: 'All day — 10+ hours available',
                },
                {
                  day: 'Friday',
                  badge: 'PRACTICE',
                  badgeColor: 'var(--accent-red)',
                  desc: 'Typically two practice sessions. Morning gap before gates open and evening gap after sessions end for dining and nightlife.',
                  gap: 'Morning: 3+ hrs · Evening: 4+ hrs',
                },
                {
                  day: 'Saturday',
                  badge: 'QUALI / SPRINT',
                  badgeColor: 'var(--accent-red)',
                  desc: 'Qualifying or Sprint sessions. Gaps are typically shorter between high-stakes sessions.',
                  gap: 'Morning: 2+ hrs · Between sessions: 1–2 hrs',
                },
                {
                  day: 'Sunday',
                  badge: 'RACE DAY',
                  badgeColor: 'var(--accent-red)',
                  desc: 'Main race start. Morning typically free until gates open — ideal for a relaxed city brunch or market visit.',
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

        {/* Thursday Free Day — if has Thursday free day */}
        {hasThursdayFreeDay && (
          <section id="thursday" className="mt-12 pt-8 border-t border-[var(--border-subtle)]">
            <h2 className="font-display font-bold text-2xl text-white uppercase-heading mb-4">
              Thursday — Your Free Day
            </h2>
            <p className="text-[var(--text-secondary)] text-base leading-relaxed mb-6">
              Thursday is typically the only day with no competitive sessions on track. If you hold a 4-day or
              Thursday pass, this is your day to explore. Use it for experiences that need a full day.
            </p>
            {thursdayExperiences.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {thursdayExperiences.slice(0, 3).map((exp) => (
                  <div key={exp.id} className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                    <p className="text-xs font-medium uppercase-label text-[var(--accent-teal)] mb-2">
                      {exp.durationLabel}
                    </p>
                    <p className="font-display font-bold text-white mb-2">{exp.title}</p>
                    <p className="text-xs text-[var(--text-secondary)] mb-4 line-clamp-3">
                      {exp.abstract ?? exp.shortDescription}
                    </p>
                    <Link href={`/races/${raceSlug}/experiences/${exp.slug}`} className="text-xs font-medium text-[var(--accent-teal)] hover:text-white transition-colors">
                      See experience →
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-secondary)] italic mb-6">
                Full-day experiences for Thursday will be available here soon.
              </p>
            )}
            <Link
              href={`/races/${raceSlug}/experiences?window=thursday`}
              className="inline-block text-sm font-medium text-[var(--accent-teal)] hover:text-white transition-colors"
            >
              Browse all Thursday options →
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
