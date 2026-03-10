import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import CircuitMap from '@/components/race/CircuitMap';
import RaceSwitcher from '@/components/race/RaceSwitcher';
import Breadcrumb from '@/components/Breadcrumb';
import { getRaceBySlug, getSessionsByRace, getAvailableRaces, getRaceContent } from '@/services/race.service';
import { getTimezoneAbbr } from '@/lib/utils';

export const revalidate = 604800; // 1 week

interface Props {
  params: Promise<{ raceSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { raceSlug } = await params;
  const race = await getRaceBySlug(raceSlug);
  if (!race) return {};

  const title = `Getting to ${race.circuitName} — ${race.name} | F1 Weekend`;
  const description = `Transport options, parking tips, and gate times for the ${race.name} at ${race.circuitName}, ${race.city}.`;
  const canonical = `https://f1weekend.co/races/${raceSlug}/getting-there`;

  return {
    title,
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
  const { raceSlug } = await params;
  const [race, raceContent, availableRaces] = await Promise.all([
    getRaceBySlug(raceSlug),
    getRaceContent(raceSlug),
    getAvailableRaces(),
  ]);
  if (!race) notFound();

  const transport = raceContent?.transportGuide?.options ?? [];
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

  const allSessions = await getSessionsByRace(race.id);
  const gateTimes = ['Thursday', 'Friday', 'Saturday', 'Sunday']
    .map(day => {
      const daySessions = allSessions.filter(s => s.dayOfWeek === day);
      const first = daySessions.sort((a, b) => a.startTime.localeCompare(b.startTime))[0];
      return first ? { day, session: first.name, gates: formatGateTime(first.startTime, 2, tzLabel) } : null;
    })
    .filter((g): g is { day: string; session: string; gates: string } => g !== null);

  return (
    <>
      {howToSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />}
      <div className="min-h-screen pt-24 pb-24 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10">
            <Breadcrumb items={[
              { label: 'Home', href: '/' },
              { label: race.city, href: `/races/${raceSlug}` },
              { label: 'Getting There' },
            ]} />
            <p className="text-xs font-medium uppercase-label text-[var(--accent-teal)] tracking-widest mb-3">
              VENUE GUIDE
            </p>
            <div className="mb-4">
              <RaceSwitcher currentRace={race} availableRaces={availableRaces} pageType="getting-there" />
            </div>
            <h1 className="font-display font-black text-4xl sm:text-5xl text-white uppercase-heading leading-none mb-4">
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
                {race.circuitName} is located in {race.city}.
                The fastest and most stress-free option on race day is typically public transport or the official shuttle bus from your hotel.
                Allow 45–60 minutes for travel from major hotel districts.
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
              <h2 className="font-display font-bold text-xl text-white uppercase-heading mb-6">
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
                          <h3 className="font-display font-bold text-white">{t.title}</h3>
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
            <h2 className="font-display font-bold text-xl text-white uppercase-heading mb-6">
              GATE OPENING TIMES
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Gates open 2 hours before the first session each day.
            </p>
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] overflow-hidden">
              {gateTimes.map((g, i) => (
                <div
                  key={g.day}
                  className={`flex items-center justify-between px-5 py-4 ${
                    i < gateTimes.length - 1 ? 'border-b border-[var(--border-subtle)]' : ''
                  }`}
                >
                  <div>
                    <p className="font-medium text-white">{g.day}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{g.session}</p>
                  </div>
                  <span className="mono-data text-sm text-[var(--accent-teal)] font-medium">
                    {g.gates}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-12 pt-8 border-t border-[var(--border-subtle)]">
            <h2 className="font-display font-bold text-xl text-white uppercase-heading mb-3">
              Things to Do Between Sessions
            </h2>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4">
              {race.city === 'Melbourne'
                ? 'Albert Park is 3 km from the CBD — every session gap is an opportunity to explore Melbourne\'s food, culture, and nightlife.'
                : `Curated activities in ${race.city} matched to every F1 session gap in the race weekend schedule.`}
            </p>
            <Link
              href={`/races/${raceSlug}/experiences`}
              className="inline-block text-sm font-medium text-[var(--accent-teal)] hover:text-white transition-colors"
            >
              Browse {race.city} experiences →
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}
