import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ScheduleView from '@/components/schedule/ScheduleView';
import Breadcrumb from '@/components/Breadcrumb';
import RaceSwitcher from '@/components/race/RaceSwitcher';
import { getRaceBySlug, getSessionsByRace } from '@/services/race.service';
import { getScheduleByRace } from '@/services/schedule.service';

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
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function SchedulePage({ params }: Props) {
  const { raceSlug } = await params;
  const race = await getRaceBySlug(raceSlug);
  if (!race) notFound();

  const [schedule, sessions] = await Promise.all([
    getScheduleByRace(race.id, race.raceDate),
    getSessionsByRace(race.id),
  ]);

  const isMelbourne = raceSlug === 'melbourne-2026';
  const isShanghai = raceSlug === 'shanghai-2026';
  // Shanghai starts Friday, Melbourne starts Thursday
  const firstDayOffset = isShanghai ? -2 : -3;
  const firstDate = offsetDate(race.raceDate, firstDayOffset);
  const sunDate = race.raceDate;

  // Map IANA timezone to UTC offset string for schema
  function tzToOffset(tz: string): string {
    if (tz === 'Asia/Shanghai') return '+08:00';
    if (tz === 'Australia/Melbourne') return '+11:00';
    return '+00:00';
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
          <RaceSwitcher raceSlug={raceSlug} pageType="schedule" />
        </div>
        <h1 className="font-display font-black text-4xl md:text-5xl text-white uppercase-heading mb-2">
          Weekend Schedule
        </h1>
        <p className="text-[var(--text-secondary)] text-sm mb-8">
          All times local ({race.timezone}) · Subject to change
        </p>
        {isMelbourne && (
          <p className="text-[var(--text-secondary)] text-base leading-relaxed max-w-2xl mb-8">
            The 2026 Australian Grand Prix runs across four days at Albert Park Circuit, Melbourne
            (March 5–8). Thursday and Friday host practice sessions — giving fans a 3.5-hour window
            before FP1 on Friday morning, and 4+ hours each evening after sessions end. Saturday
            brings qualifying and the F1 Sprint, with Sunday reserved for the race. Melbourne&apos;s
            compact Central Business District means world-class food, culture, and nightlife are minutes from the circuit —
            making every session gap an opportunity to explore the city.
          </p>
        )}
        {isShanghai && (
          <p className="text-[var(--text-secondary)] text-base leading-relaxed max-w-2xl mb-8">
            The 2026 Chinese Grand Prix runs three days at Shanghai International Circuit (March 13–15).
            Friday and Saturday host practice sessions — giving fans a 3.5-hour window before FP1
            on Friday morning, and 4+ hours each evening after sessions end. Sunday is race day,
            with a full morning free before the 15:00 CST start. Shanghai&apos;s Bund, French Concession,
            and historic water towns are within reach of every session gap.
          </p>
        )}
        <ScheduleView
          schedule={schedule}
          initialDay="Friday"
          tzLabel={isShanghai ? 'CST' : 'AEDT'}
          raceDate={race.raceDate}
          timezone={race.timezone}
        />
        {isMelbourne && (
          <section className="mt-12 border-t border-[var(--border-subtle)] pt-8">
            <h2 className="font-display font-bold text-xl text-white uppercase-heading mb-4">
              Session Gap Planner
            </h2>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-6">
              Each session gap has been mapped to experiences that actually fit the available time.
              Here is what to do in each window, with links to the relevant experiences.
            </p>
            <div className="space-y-6">
              <div className="p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                <p className="text-xs font-medium uppercase-label text-[var(--accent-teal)] mb-2">BEFORE FP1 · 3.5 HRS</p>
                <h3 className="font-display font-bold text-white text-lg mb-2">Thursday &amp; Friday Morning</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                  The 3.5-hour window before gates open on Friday is the most versatile gap of the
                  weekend. A guided Melbourne Laneways Food Tour (10 tastings, 3 hours, A$99–A$130)
                  fits perfectly — you&apos;re back at the tram stop with 30 minutes to spare. On
                  Thursday, this gap extends all day, making it the right time for the Great Ocean
                  Road or Yarra Valley. Self-guided options: Degraves Street espresso walk (free),
                  Fitzroy street art tour (free), Royal Botanic Gardens (free, 1.5 hrs).
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/races/melbourne-2026/experiences?category=food" className="text-xs font-medium text-[var(--accent-teal)] hover:text-white transition-colors">
                    Food experiences →
                  </Link>
                  <Link href="/races/melbourne-2026/experiences?category=daytrip" className="text-xs font-medium text-[var(--accent-teal)] hover:text-white transition-colors">
                    Day trips →
                  </Link>
                </div>
              </div>

              <div className="p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                <p className="text-xs font-medium uppercase-label text-[var(--accent-red)] mb-2">BETWEEN SESSIONS · 1.5 HRS</p>
                <h3 className="font-display font-bold text-white text-lg mb-2">Afternoon Session Gaps</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                  Shorter 1–2 hour gaps between sessions suit walking and eating rather than guided
                  tours. The Royal Botanic Gardens (free entry, 10-minute walk from the circuit)
                  is the best use of a tight gap. St Kilda Pier walk (free, 20 minutes by tram) is
                  good on Friday afternoons. For food: South Yarra&apos;s Commercial Road has
                  excellent cafés within a 15-minute tram from the circuit.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/races/melbourne-2026/experiences?category=culture" className="text-xs font-medium text-[var(--accent-teal)] hover:text-white transition-colors">
                    Culture &amp; walks →
                  </Link>
                </div>
              </div>

              <div className="p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                <p className="text-xs font-medium uppercase-label mb-2" style={{ color: '#9B59B6' }}>EVENING · 4+ HRS</p>
                <h3 className="font-display font-bold text-white text-lg mb-2">Post-Session Evenings (Thu–Sat)</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                  Friday and Saturday evenings after sessions end at ~17:00–19:00 AEDT give you
                  4–6 hours. Melbourne&apos;s dining scene is at its best after 7 PM. Top areas:
                  South Yarra and Toorak Road for modern Australian (15 min tram), Lygon Street
                  Carlton for Italian (30 min tram), Flinders Lane Central Business District laneways for
                  Japanese to Lebanese. Book ahead — Melbourne restaurants fill up during race week.
                  For nightlife: the Yarra River precinct has rooftop bars open until 3 AM.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/races/melbourne-2026/experiences?category=nightlife" className="text-xs font-medium text-[var(--accent-teal)] hover:text-white transition-colors">
                    Nightlife &amp; dining →
                  </Link>
                </div>
              </div>

              <div className="p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                <p className="text-xs font-medium uppercase-label mb-2" style={{ color: '#F39C12' }}>SUNDAY MORNING · 3+ HRS</p>
                <h3 className="font-display font-bold text-white text-lg mb-2">Race Day Morning (before 11:00 AEDT)</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                  Gates open around 11:00 AEDT on race day — leaving 3+ hours for a relaxed
                  morning. South Melbourne Market (open from 08:00, 10 min tram) is ideal: fresh
                  produce, Melbourne&apos;s best coffee, and dim sum all under one roof. St Kilda
                  Beach is a 15-minute walk from the market — do both. Alternatively, a short
                  half-day Torquay coast drive (returns by 13:00) squeezes in the Great Ocean Road
                  start if you missed Thursday.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/races/melbourne-2026/experiences" className="text-xs font-medium text-[var(--accent-teal)] hover:text-white transition-colors">
                    All Sunday morning options →
                  </Link>
                </div>
              </div>
            </div>
            <Link
              href="/races/melbourne-2026/experiences"
              className="inline-block mt-6 text-sm font-medium text-[var(--accent-teal)] hover:text-white transition-colors"
            >
              Browse all Melbourne experiences →
            </Link>
          </section>
        )}
        {isShanghai && (
          <section className="mt-12 border-t border-[var(--border-subtle)] pt-8">
            <h2 className="font-display font-bold text-xl text-white uppercase-heading mb-4">
              Make the Most of Your Session Gaps
            </h2>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-6">
              Each session gap has been matched to curated Shanghai experiences that fit the
              available time. Browse by category below, or explore all 40+ experiences.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                <p className="text-xs font-medium uppercase-label text-[var(--accent-teal)] mb-2">BEFORE FP1 · 3.5 HRS</p>
                <p className="font-display font-bold text-white mb-2">Friday & Saturday Morning</p>
                <p className="text-xs text-[var(--text-secondary)] mb-4">
                  French Concession food tour, Bund waterfront walk, or dim sum breakfast before gates open.
                </p>
                <Link href="/races/shanghai-2026/experiences?category=food" className="text-xs font-medium text-[var(--accent-teal)] hover:text-white transition-colors">
                  Browse food experiences →
                </Link>
              </div>
              <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                <p className="text-xs font-medium uppercase-label text-[var(--accent-red)] mb-2">BETWEEN SESSIONS · 1.5 HRS</p>
                <p className="font-display font-bold text-white mb-2">Afternoon Gaps</p>
                <p className="text-xs text-[var(--text-secondary)] mb-4">
                  Tea ceremony, dumpling stop, or a quick tea house visit near the circuit.
                </p>
                <Link href="/races/shanghai-2026/experiences?category=culture" className="text-xs font-medium text-[var(--accent-teal)] hover:text-white transition-colors">
                  Browse culture experiences →
                </Link>
              </div>
              <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                <p className="text-xs font-medium uppercase-label mb-2" style={{ color: '#9B59B6' }}>EVENING · 4+ HRS</p>
                <p className="font-display font-bold text-white mb-2">Post-Session Evenings</p>
                <p className="text-xs text-[var(--text-secondary)] mb-4">
                  Huangpu River cruise, pub crawl in the French Concession, or rooftop dinner with Pudong views.
                </p>
                <Link href="/races/shanghai-2026/experiences?category=nightlife" className="text-xs font-medium text-[var(--accent-teal)] hover:text-white transition-colors">
                  Browse nightlife & dining →
                </Link>
              </div>
            </div>
            <Link
              href="/races/shanghai-2026/experiences"
              className="inline-block mt-6 text-sm font-medium text-[var(--accent-teal)] hover:text-white transition-colors"
            >
              Browse all Shanghai experiences →
            </Link>
          </section>
        )}
      </section>
    </div>
  );
}
