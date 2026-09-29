import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import CircuitMap from '@/components/race/CircuitMap';
import RaceSwitcher from '@/components/race/RaceSwitcher';
import Breadcrumb from '@/components/Breadcrumb';
import { venueGuide } from '@/data/venue-guides-2026';
import { timetableFor } from '@/data/timetables-2026';
import { getRaceBySlug, getSessionsByRace, getAvailableRaces, getRaceContent } from '@/services/race.service';
import { getTimezoneAbbr } from '@/lib/utils';
import { raceKey } from '@/lib/race-url';
import { resolveRaceSlug } from '@/services/race.service';

export const revalidate = 604800; // 1 week

interface Props {
  params: Promise<{ raceSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { raceSlug: raceParam } = await params;
  const raceSlug = (await resolveRaceSlug(raceParam)) ?? raceParam;
  const race = await getRaceBySlug(raceSlug);
  if (!race) return {};

  const title = `Getting to ${race.circuitName} — ${race.name} | F1 Weekend`;
  const description = `Transport options, parking tips, and gate times for the ${race.name} at ${race.circuitName}, ${race.city}.`;
  const canonical = `https://f1weekend.co/races/${raceKey(raceSlug)}/getting-there`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'website' },
  };
}

function formatGateTime(time: string, h: number, tzLabel: string): string {
  const [hh, mm] = time.split(':').map(Number);
  const totalMins = hh * 60 + mm - h * 60;
  return `${String(Math.floor(totalMins / 60)).padStart(2, '0')}:${String(totalMins % 60).padStart(2, '0')} ${tzLabel}`;
}

export default async function GettingTherePage({ params }: Props) {
  const { raceSlug: raceParam } = await params;
  const raceSlug = (await resolveRaceSlug(raceParam)) ?? raceParam;
  const [race, raceContent, availableRaces] = await Promise.all([
    getRaceBySlug(raceSlug),
    getRaceContent(raceSlug),
    getAvailableRaces(),
  ]);
  if (!race) notFound();

  // Venues without a stored guide for this year's circuit (Bahrain GP → Sepang) use the one in code.
  const guide = race.venueMoved ? venueGuide(raceSlug) : undefined;
  const transport = raceContent?.transportGuide?.options ?? guide?.options ?? [];
  const mapsUrl = raceContent?.transportGuide?.mapsUrl ?? `https://www.google.com/maps/dir/?api=1&destination=${race.circuitLat},${race.circuitLng}&travelmode=transit`;
  const tzLabel = getTimezoneAbbr(race.timezone, new Date(race.raceDate));

  const howToSchema = raceContent?.transportGuide?.howToSteps?.length ? {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to get to ${race.circuitName} for ${race.name}`,
    description: `Transport options for getting to ${race.circuitName}, ${race.city} for the ${race.season} Formula 1 ${race.name}.`,
    step: raceContent.transportGuide.howToSteps.map(step => ({
      '@type': 'HowToStep',
      name: step.name,
      text: step.text
    })),
  } : null;

  // First track action each day: the full timetable (support races included)
  // when we have one, otherwise the stored sessions.
  const allSessions = await getSessionsByRace(race.id);
  const timetable = race.rolledFrom ? undefined : timetableFor(raceSlug);
  // Timetable names already carry the series ("Formula Trophy Malaysia · Race 2"): never prefix it twice.
  const label = (series: string, name: string) =>
    series === 'Formula 1' || name.startsWith(series) ? name : `${series} · ${name}`;
  const firstOfDay = (day: string) =>
    timetable
      ? timetable.filter((e) => e.day === day).map((e) => ({ name: label(e.series, e.name), startTime: e.start }))
          .filter((e) => !/press|presentation|parade|anthem/i.test(e.name))[0]
      : allSessions.filter((s) => s.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime))[0];
  // The day's headline F1 session, from the same session list every page uses.
  const f1Rank = { race: 0, sprint: 1, qualifying: 2, practice: 3 } as Record<string, number>;
  const mainF1 = (day: string) =>
    allSessions
      .filter((s) => s.dayOfWeek === day && s.sessionType in f1Rank)
      .sort((a, b) => f1Rank[a.sessionType] - f1Rank[b.sessionType] || a.startTime.localeCompare(b.startTime))[0];
  const gateTimes = ['Thursday', 'Friday', 'Saturday', 'Sunday']
    .map(day => {
      const first = firstOfDay(day);
      if (!first) return null;
      const f1 = mainF1(day);
      return {
        day,
        firstOnTrack: `${first.name} ${first.startTime}`,
        f1: f1 && f1.name !== first.name ? `${f1.sessionType === 'race' ? 'Grand Prix' : f1.name} ${f1.startTime}` : null,
        gates: formatGateTime(first.startTime, 2, tzLabel),
      };
    })
    .filter((g): g is { day: string; firstOnTrack: string; f1: string | null; gates: string } => g !== null);

  return (
    <>
      {howToSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />}
      <div className="min-h-screen pt-24 pb-24 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10">
            <Breadcrumb items={[
              { label: 'Home', href: '/' },
              { label: race.city, href: `/races/${raceKey(raceSlug)}` },
              { label: 'Getting There' },
            ]} />
            <p className="text-xs font-medium uppercase-label text-[var(--accent-teal)] tracking-widest mb-3">
              VENUE GUIDE
            </p>
            <div className="mb-4">
              <RaceSwitcher currentRace={race} availableRaces={availableRaces} pageType="getting-there" />
            </div>
            <h1 className="font-display font-black text-4xl sm:text-5xl text-[var(--text-primary)] uppercase-heading leading-none mb-4">
              GETTING<br />THERE
            </h1>
            <p className="text-[var(--text-secondary)] text-lg leading-relaxed">
              {race.circuitName}, {race.city}
            </p>
            {raceContent?.howItWorksText ? (
              <p className="text-[var(--text-secondary)] text-base leading-relaxed max-w-2xl mt-4">
                {raceContent.howItWorksText}
              </p>
            ) : (
              <p className="text-[var(--text-secondary)] text-base leading-relaxed max-w-2xl mt-4">
                {guide?.intro ?? `${race.circuitName} is in ${race.city}. On race day, public transport or the official shuttle from your hotel is usually the least stressful option — allow extra time for race traffic.`}
              </p>
            )}
          </div>
        </div>

        {raceContent?.circuitMapSrc && (
          <div className="mb-12 max-w-5xl mx-auto">
            <CircuitMap
              src={raceContent.circuitMapSrc}
              alt={`${race.circuitName} — Track Map`}
              width={1252}
              height={704}
              className="rounded-xl overflow-hidden border border-[var(--border-subtle)]"
            />
          </div>
        )}

        <div className="max-w-3xl mx-auto">
          {transport.length > 0 && (
            <section className="mb-12">
              <h2 className="font-display font-bold text-xl text-[var(--text-primary)] uppercase-heading mb-6">
                HOW TO GET THERE
              </h2>
              <div className="space-y-4">
                {transport.map((t) => (
                  <div
                    key={t.title}
                    className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5"
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-2xl mt-0.5 shrink-0">{t.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-display font-bold text-[var(--text-primary)]">{t.title}</h3>
                          {t.bestFor && t.bestFor !== 'General' && (
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider"
                              style={{
                                color: t.bestFor.toLowerCase().includes('recommend') ? 'var(--accent-teal)' : 'var(--accent-red)',
                                backgroundColor: t.bestFor.toLowerCase().includes('recommend') ? 'rgba(45, 212, 191, 0.1)' : 'rgba(255, 59, 48, 0.1)',
                                border: `1px solid ${t.bestFor.toLowerCase().includes('recommend') ? 'rgba(45, 212, 191, 0.2)' : 'rgba(255, 59, 48, 0.2)'}`,
                              }}
                            >
                              {t.bestFor}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{t.details}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {!raceContent?.transportGuide && guide?.note && (
                <p className="mt-4 text-sm text-[var(--text-secondary)]">{guide.note}</p>
              )}
            </section>
          )}

          {mapsUrl && (
            <section className="mb-12">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full py-4 rounded-xl border border-[var(--accent-teal)] bg-[var(--accent-teal-muted)] text-[var(--accent-teal)] font-display font-bold text-lg hover:bg-[var(--accent-teal)]/20 transition-colors"
              >
                <span>📍</span>
                Get Directions in Google Maps
                <span className="text-sm font-normal opacity-70">↗</span>
              </a>
            </section>
          )}

          <section>
            <h2 className="font-display font-bold text-xl text-[var(--text-primary)] uppercase-heading mb-6">
              ESTIMATED GATE TIMES
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Estimated: about 2 hours before the first track action each day. Check your ticket for the official gate times.
            </p>
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] overflow-hidden">
              {gateTimes.map((g, i) => (
                <div
                  key={g.day}
                  className={`flex items-center justify-between px-5 py-4 ${
                    i < gateTimes.length - 1 ? 'border-b border-[var(--border-subtle)]' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--text-primary)]">{g.day}</p>
                    <p className="text-sm text-[var(--text-secondary)]">First on track: {g.firstOnTrack}</p>
                    {g.f1 && <p className="text-sm text-[var(--text-secondary)]">F1: {g.f1}</p>}
                  </div>
                  <span className="mono-data text-sm text-[var(--accent-red)] font-medium text-right shrink-0 ml-4">
                    <span className="block text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Gates open ~</span>
                    {g.gates}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-12 pt-8 border-t border-[var(--border-subtle)]">
            <h2 className="font-display font-bold text-xl text-[var(--text-primary)] uppercase-heading mb-3">
              Things to Do Between Sessions
            </h2>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4">
              {race.city === 'Melbourne'
                ? 'Albert Park is 3 km from the CBD — every session gap is an opportunity to explore Melbourne\'s food, culture, and nightlife.'
                : `Curated activities in ${race.city} matched to every F1 session gap in the race weekend schedule.`}
            </p>
            <Link
              href={`/races/${raceKey(raceSlug)}/experiences`}
              className="inline-block text-sm font-medium text-[var(--accent-teal)] hover:text-[var(--text-primary)] transition-colors"
            >
              Browse {race.city} experiences →
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}
