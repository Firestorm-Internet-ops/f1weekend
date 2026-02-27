import type { Metadata } from 'next';
import Link from 'next/link';
import { getRaceBySlug, getSessionsByRace, getWindowsByRace } from '@/services/race.service';
import { CATEGORY_COLORS } from '@/lib/constants/categories';
import { getExperiencesByWindow, getFeaturedExperiences } from '@/services/experience.service';
import RaceSchedule from '@/components/race/RaceSchedule';
import RaceCountdown from '@/components/race/RaceCountdown';
import CircuitMap from '@/components/race/CircuitMap';
import { getActiveRaceSlug } from '@/lib/activeRace';
import { RACE_CONTENT } from '@/data/race-content';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const activeRaceSlug = getActiveRaceSlug();
  return RACE_CONTENT[activeRaceSlug]?.meta ?? {};
}

const homepageBreadcrumbLd: object = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://f1weekend.co' },
  ],
};


// Compute UTC offset string for a given IANA timezone on a given date.
function getTzOffsetStr(ianaTimezone: string, dateStr: string): string {
  try {
    const d = new Date(`${dateStr}T12:00:00Z`);
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: ianaTimezone,
      timeZoneName: 'shortOffset',
    }).formatToParts(d);
    const tzPart = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+0';
    const match = tzPart.match(/GMT([+-]\d{1,2}(?::\d{2})?)/);
    if (!match) return '+00:00';
    const raw = match[1];
    const [hStr, mStr = '0'] = raw.replace(/^[+-]/, '').split(':');
    const sign = raw.startsWith('-') ? '-' : '+';
    return `${sign}${String(parseInt(hStr)).padStart(2, '0')}:${String(parseInt(mStr)).padStart(2, '0')}`;
  } catch {
    return '+00:00';
  }
}

export default async function HomePage() {
  const activeRaceSlug = getActiveRaceSlug();
  const raceContent = RACE_CONTENT[activeRaceSlug];
  const race = await getRaceBySlug(activeRaceSlug);

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

  // Compute FP1 target date for countdown
  const fp1 = sessions.find((s) => s.dayOfWeek === 'Friday' && s.sessionType === 'practice');
  const raceDayDate = new Date(race.raceDate + 'T00:00:00Z');
  raceDayDate.setUTCDate(raceDayDate.getUTCDate() - 2); // Friday
  const fridayDate = raceDayDate.toISOString().split('T')[0];
  // Dynamic fallback: Friday 11:30 local time in race timezone
  const fallbackFriDate = new Date(race.raceDate + 'T00:00:00Z');
  fallbackFriDate.setUTCDate(fallbackFriDate.getUTCDate() - 2);
  const fallbackFriStr = fallbackFriDate.toISOString().split('T')[0];
  const fallbackTzOffset = getTzOffsetStr(race.timezone, fallbackFriStr);
  let fp1IsoString = `${fallbackFriStr}T11:30:00${fallbackTzOffset}`;
  if (fp1?.startTime) {
    // MySQL TIME columns return "HH:MM:SS" — slice to "HH:MM" before constructing ISO string
    const startHHMM = fp1.startTime.slice(0, 5);
    const tzOffset = getTzOffsetStr(race.timezone, fridayDate);
    const candidate = `${fridayDate}T${startHHMM}:00${tzOffset}`;
    if (!isNaN(new Date(candidate).getTime())) {
      fp1IsoString = candidate;
    }
  }

  // Compute first day and date range for hero badge
  const hasThursday = sessions.some((s) => s.dayOfWeek === 'Thursday');
  const firstDayOffset = hasThursday ? -3 : -2;
  const firstDay = new Date(race.raceDate + 'T00:00:00Z');
  firstDay.setUTCDate(firstDay.getUTCDate() + firstDayOffset);
  const monthStr = firstDay.toLocaleDateString('en-AU', { month: 'short', timeZone: 'UTC' });
  const firstDayNum = firstDay.getUTCDate();
  const lastDayNum = new Date(race.raceDate + 'T00:00:00Z').getUTCDate();
  const heroDateRange = `${monthStr} ${firstDayNum}–${lastDayNum}`;

  // Dynamic schemas
  const websiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'F1 Weekend',
    url: 'https://f1weekend.co',
    description: `F1 race weekend companion — curated ${race.city} experiences for the ${race.season} ${race.name}`,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `https://f1weekend.co/races/${activeRaceSlug}/experiences?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const eventLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: `${race.season} ${race.name}`,
    alternateName: race.name,
    startDate: firstDay.toISOString().split('T')[0],
    endDate: race.raceDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: race.circuitName,
      address: {
        '@type': 'PostalAddress',
        addressLocality: race.city,
        addressCountry: race.countryCode,
      },
      geo: { '@type': 'GeoCoordinates', latitude: race.circuitLat, longitude: race.circuitLng },
    },
    organizer: { '@type': 'Organization', name: 'Formula One Management', url: 'https://www.formula1.com' },
    sport: 'Motorsport',
    url: 'https://f1weekend.co',
  };

  const HOME_FAQ = raceContent?.faqItems ?? [];
  const homepageFaqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: HOME_FAQ.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  const expBasePath = `/races/${activeRaceSlug}/experiences`;

  const SEASON_PREVIEW = [
    { round: 1, flag: '🇦🇺', short: 'AUS', dates: 'Mar 5–8',   slug: 'melbourne-2026' },
    { round: 2, flag: '🇨🇳', short: 'CHN', dates: 'Mar 13–15', slug: 'shanghai-2026' },
    { round: 3, flag: '🇯🇵', short: 'JPN', dates: 'Mar 27–29', slug: null },
    { round: 4, flag: '🇧🇭', short: 'BHR', dates: 'Apr 16–19', slug: null },
    { round: 5, flag: '🇸🇦', short: 'SAU', dates: 'Apr 23–26', slug: null },
  ].map((r) => ({ ...r, active: r.slug === activeRaceSlug }));

  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageFaqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageBreadcrumbLd) }} />
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
              <p className="text-xs font-medium uppercase-label text-[var(--accent-red)] mb-5 tracking-widest flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full bg-[var(--accent-red)] text-white text-[10px] font-bold tracking-wider">
                  NEXT RACE
                </span>
                <span className="whitespace-nowrap">🏎 {race.name} · {race.city} · {heroDateRange}</span>
              </p>

              <h1 className="font-display font-black text-5xl md:text-6xl text-white uppercase-heading leading-tight mb-4">
                {race.city} has
                <br />
                <span className="text-[var(--accent-red)]">more to offer.</span>
              </h1>

              <p className="text-[var(--text-secondary)] text-base md:text-lg max-w-sm">
                Discover the best of {race.city} — curated experiences for every session gap of the
                race weekend.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 mb-8 mt-6">
                <Link
                  href={expBasePath}
                  className="px-5 py-2.5 bg-[var(--accent-teal)] hover:bg-[var(--accent-teal-hover)] text-[var(--bg-primary)] font-semibold text-sm rounded-full transition-colors whitespace-nowrap"
                >
                  Explore {race.city}
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
                <RaceCountdown targetDate={fp1IsoString} />
              </div>

              {/* Category pills — mobile only */}
              <div className="flex flex-wrap gap-2 mt-6 md:hidden">
                {[
                  { label: 'Food',      cat: 'food' },
                  { label: 'Culture',   cat: 'culture' },
                  { label: 'Adventure', cat: 'adventure' },
                  { label: 'Day Trip',  cat: 'daytrip' },
                  { label: 'Nightlife', cat: 'nightlife' },
                ].map(({ label, cat }) => {
                  const color = CATEGORY_COLORS[cat] ?? '#6E6E82';
                  return (
                    <Link
                      key={cat}
                      href={`${expBasePath}?category=${cat}`}
                      className="px-3 py-1 rounded-full text-xs font-semibold uppercase-label transition-colors"
                      style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
                    >
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right: circuit map */}
            <div className="hidden md:flex items-center justify-center relative">
              <div
                className="absolute w-64 h-64 rounded-full pointer-events-none"
                style={{
                  background:
                    'radial-gradient(circle, rgba(225,6,0,0.12) 0%, transparent 70%)',
                }}
              />
              <CircuitMap
                src={raceContent?.circuitMapSrc}
                alt={`${race.circuitName} — Circuit Map`}
                className="w-full max-w-2xl opacity-90"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="max-w-6xl mx-auto px-4 py-10 border-b border-[var(--border-subtle)]">
        <h2 className="font-display font-black text-xl text-white uppercase-heading mb-4">
          Plan Your {race.city} F1 Weekend Around the Sessions
        </h2>
        <p className="text-[var(--text-secondary)] text-base leading-relaxed max-w-3xl">
          {raceContent?.howItWorksText}
        </p>
      </section>

      {/* ── Featured Experiences ── */}
      {featuredExps.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-black text-xl text-white uppercase-heading">
              Top Picks
            </h2>
            <Link
              href={expBasePath}
              className="text-sm font-medium text-[var(--accent-teal)] hover:text-white transition-colors"
            >
              View all →
            </Link>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible scrollbar-hide">
            {featuredExps.slice(0, 6).map((exp) => {
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

      {/* ── Season Preview Strip ── */}
      <section className="max-w-6xl mx-auto px-4 pb-10">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium uppercase-label text-[var(--text-secondary)] tracking-widest">
            2026 SEASON · 24 RACES
          </p>
          <Link href="/f1-2026" className="text-xs font-medium text-[var(--accent-teal)] hover:text-white transition-colors">
            Full calendar →
          </Link>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {SEASON_PREVIEW.map((r) => {
            const tileClass = `shrink-0 flex flex-col items-center gap-1 px-3 py-2.5 rounded-lg border transition-colors min-w-[56px] ${
              r.active
                ? 'border-[var(--accent-red)]/60 bg-[var(--accent-red)]/8'
                : 'border-[var(--border-subtle)]'
            }`;
            const inner = (
              <>
                <span className="text-lg leading-none">{r.flag}</span>
                <span className={`text-[10px] font-bold uppercase-label tracking-wider ${r.active ? 'text-white' : 'text-[var(--text-secondary)]'}`}>
                  {r.short}
                </span>
                {r.active
                  ? <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--accent-red)] text-white leading-tight">NOW</span>
                  : <span className="text-[10px] mono-data text-[var(--text-secondary)] opacity-60">{r.dates}</span>
                }
              </>
            );
            return r.slug ? (
              <Link key={r.round} href={`/races/${r.slug}`} className={tileClass}>
                {inner}
              </Link>
            ) : (
              <div key={r.round} className={tileClass}>
                {inner}
              </div>
            );
          })}
          <Link
            href="/f1-2026"
            className="shrink-0 flex flex-col items-center justify-center gap-1 px-3 py-2.5 rounded-lg border border-dashed border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-medium)] transition-colors min-w-[56px]"
          >
            <span className="text-base font-bold">+19</span>
            <span className="text-[10px] uppercase-label tracking-wider">more</span>
          </Link>
        </div>
      </section>

      {/* ── Race schedule + gap cards ── */}
      <section className="max-w-3xl mx-auto px-4 pb-24">
        <div className="racing-stripe mb-8" />
        <RaceSchedule
          sessions={sessions}
          windows={windows}
          windowData={windowData}
          basePath={expBasePath}
          schedulePath={`/races/${activeRaceSlug}/schedule`}
          race={{ city: race.city, raceDate: race.raceDate, timezone: race.timezone }}
          initialDay="Friday"
        />
      </section>

      {/* ── FAQ ── */}
      <section className="max-w-3xl mx-auto px-4 pb-16">
        <h2 className="font-display font-black text-xl text-white uppercase-heading mb-6">
          Frequently Asked Questions
        </h2>
        {HOME_FAQ.map(({ q, a }) => (
          <details key={q} className="border-b border-[var(--border-subtle)] py-4">
            <summary className="font-display font-bold text-white cursor-pointer list-none flex items-center justify-between gap-2">
              {q}
              <span className="text-[var(--text-secondary)] text-sm shrink-0">+</span>
            </summary>
            <p className="text-[var(--text-secondary)] text-sm mt-3 leading-relaxed">{a}</p>
          </details>
        ))}
      </section>
    </div>
  );
}
