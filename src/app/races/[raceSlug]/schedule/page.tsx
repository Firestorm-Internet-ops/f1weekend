import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ScheduleView from '@/components/schedule/ScheduleView';
import Breadcrumb from '@/components/Breadcrumb';
import RaceSwitcher from '@/components/race/RaceSwitcher';
import { getRaceBySlug, getSessionsByRace, getRaceContent, getAvailableRaces, getWindowsByRace } from '@/services/race.service';
import { getScheduleByRace, scheduleFromSessions } from '@/services/schedule.service';
import { getTimezoneAbbr } from '@/lib/utils';

export const revalidate = 3600; // 1 hour

interface Props {
  params: Promise<{ raceSlug: string }>;
}

// Compute a date string offset from the race day (Sunday = 0, Friday = -2, etc.)
function offsetDate(raceDateStr: string, days: number): string {
  const d = new Date(raceDateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { raceSlug } = await params;
  const race = await getRaceBySlug(raceSlug);
  if (!race) return {};

  const title = `${race.name} Schedule | F1 Weekend`;
  const description = `Full ${race.season} ${race.name} weekend schedule — all sessions, support races and events at ${race.circuitName}.`;
  const canonical = `https://f1weekend.co/races/${raceSlug}/schedule`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

/** Intro built from the actual sessions (no "Sprint (if applicable)" boilerplate). */
function scheduleIntro(race: { season: number; name: string; circuitName: string; city: string }, sessions: { name: string; dayOfWeek: string; startTime: string; sessionType: string }[]): string {
  const at = (s?: { dayOfWeek: string; startTime: string }) => (s ? `${s.dayOfWeek} at ${s.startTime.slice(0, 5)}` : null);
  const f1 = sessions.filter((s) => ['practice', 'qualifying', 'sprint', 'race'].includes(s.sessionType));
  const quali = f1.find((s) => s.sessionType === 'qualifying' && !/sprint/i.test(s.name));
  const sprint = f1.find((s) => s.sessionType === 'sprint');
  const raceStart = f1.find((s) => s.sessionType === 'race');
  const parts = [
    `The ${race.season} ${race.name} runs at ${race.circuitName}, ${race.city}.`,
    f1[0] ? `Track action starts ${at(f1[0])}` + (quali ? `, qualifying is ${at(quali)}` : '') + (sprint ? `, the Sprint is ${at(sprint)}` : '') + (raceStart ? ` and the race starts ${at(raceStart)} (local time).` : '.') : '',
    `Find things to do in ${race.city} that fit around the sessions.`,
  ];
  return parts.filter(Boolean).join(' ');
}

export default async function SchedulePage({ params }: Props) {
  const { raceSlug } = await params;
  const [race, raceContent, availableRaces] = await Promise.all([
    getRaceBySlug(raceSlug),
    getRaceContent(raceSlug),
    getAvailableRaces(),
  ]);
  if (!race) notFound();

  const [storedSchedule, sessions, windows] = await Promise.all([
    getScheduleByRace(race.id, race.raceDate, race.slug),
    getSessionsByRace(race.id),
    getWindowsByRace(race.id),
  ]);
  const schedule = scheduleFromSessions(storedSchedule, sessions);

  const hasThursdayFreeDay = raceContent?.hasThursdayFreeDay ?? false;
  const firstDayOffset = hasThursdayFreeDay ? -3 : -2;
  const firstDate = offsetDate(race.raceDate, firstDayOffset);
  const sunDate = race.raceDate;

  // Map IANA timezone to UTC offset string for schema
  function tzToOffset(tz: string): string {
    // Basic mapping for known F1 timezones
    const offsets: Record<string, string> = {
      'Asia/Shanghai': '+08:00',
      'Australia/Melbourne': '+11:00',
      'Asia/Bahrain': '+03:00',
      'Asia/Kuala_Lumpur': '+08:00',
      'Asia/Riyadh': '+03:00',
      'Asia/Tokyo': '+09:00',
    };
    return offsets[tz] ?? '+00:00';
  }
  const tzOffset = tzToOffset(race.timezone);

  const scheduleLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: race.name,
    startDate: `${firstDate}T10:00:00${tzOffset}`,
    endDate: `${sunDate}T17:00:00${tzOffset}`,
    location: {
      '@type': 'Place',
      name: race.circuitName,
      address: { '@type': 'PostalAddress', addressLocality: race.city, addressCountry: race.countryCode },
    },
    subEvent: sessions
      .filter(s => ['practice', 'qualifying', 'sprint', 'race'].includes(s.sessionType))
      .map(s => {
        const OFFSETS: Record<string, number> = { Thursday: -3, Friday: -2, Saturday: -1, Sunday: 0 };
        const dayDate = offsetDate(race.raceDate, OFFSETS[s.dayOfWeek] ?? 0);
        return {
          '@type': 'SportsEvent',
          name: s.name,
          startDate: `${dayDate}T${s.startTime.slice(0, 5)}:00${tzOffset}`,
          endDate: `${dayDate}T${s.endTime.slice(0, 5)}:00${tzOffset}`,
        };
      }),
  };

  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(scheduleLd) }} />
      <section className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: race.city, href: `/races/${raceSlug}` },
          { label: 'Schedule' },
        ]} />
        <p className="text-xs uppercase-label text-[var(--accent-red)] mb-3 tracking-widest">
          {race.city} · Round {race.round} · {race.season}
        </p>
        <div className="mb-4">
          <RaceSwitcher currentRace={race} availableRaces={availableRaces} pageType="schedule" />
        </div>
        <h1 className="font-display font-black text-4xl md:text-5xl text-[var(--text-primary)] uppercase-heading mb-2">
          Weekend Schedule
        </h1>
        <p className="text-[var(--text-secondary)] text-sm mb-8">
          All times local ({race.timezone}) · Subject to change
        </p>
        {raceContent?.scheduleIntro ? (
          <p className="text-[var(--text-secondary)] text-base leading-relaxed max-w-2xl mb-8">
            {raceContent.scheduleIntro}
          </p>
        ) : (
          <p className="text-[var(--text-secondary)] text-base leading-relaxed max-w-2xl mb-8">
            {scheduleIntro(race, sessions)}
          </p>
        )}
        <ScheduleView
          schedule={schedule}
          initialDay="Friday"
          tzLabel={getTimezoneAbbr(race.timezone, new Date(race.raceDate))}
          raceDate={race.raceDate}
          timezone={race.timezone}
        />
        {raceContent?.sessionGapCopy && raceContent.sessionGapCopy.length > 0 && (
          <section className="mt-12 border-t border-[var(--border-subtle)] pt-8">
            <h2 className="font-display font-bold text-xl text-[var(--text-primary)] uppercase-heading mb-4">
              Session Gap Planner
            </h2>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-6">
              Each session gap has been mapped to experiences that actually fit the available time.
              Here is what to do in each window, with links to the relevant experiences.
            </p>
            <div className="space-y-6">
              {raceContent.sessionGapCopy.map((gap) => (
                <div key={gap.windowSlug} className="p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                  <p className="text-xs font-medium uppercase-label text-[var(--accent-teal)] mb-2">
                    {windows.find(w => w.slug === gap.windowSlug)?.label ?? 'GAP'}
                  </p>
                  <h3 className="font-display font-bold text-[var(--text-primary)] text-lg mb-2">{gap.heading}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                    {gap.copy}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link href={`/races/${raceSlug}/experiences?window=${gap.windowSlug}`} className="text-xs font-medium text-[var(--accent-teal)] hover:text-[var(--text-primary)] transition-colors">
                      Browse experiences for this gap →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href={`/races/${raceSlug}/experiences`}
              className="inline-block mt-6 text-sm font-medium text-[var(--accent-teal)] hover:text-[var(--text-primary)] transition-colors"
            >
              Browse all {race.city} experiences →
            </Link>
          </section>
        )}
      </section>
    </div>
  );
}
