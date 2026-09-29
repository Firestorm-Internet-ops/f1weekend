import type { Metadata } from 'next';
import Link from 'next/link';
import { getRaceBySlug, getSessionsByRace, getWindowsByRace, getRaceContent, getAvailableRaces } from '@/services/race.service';
import { CATEGORY_COLORS } from '@/lib/constants/categories';
import { getExperiencesByWindow, getFeaturedExperiences, getMostPopularExperiences, getTopRatedExperiences } from '@/services/experience.service';
import RaceSchedule from '@/components/race/RaceSchedule';
import RaceCountdown from '@/components/race/RaceCountdown';
import CircuitMap from '@/components/race/CircuitMap';
import { getActiveRaceSlug } from '@/lib/activeRace';
import { formatRaceDates } from '@/lib/utils';
import BookButton from '@/components/experiences/BookButton';
import type { Experience } from '@/types/experience';
import HomepageExploreSection, { type ExploreDayData } from '@/components/homepage/HomepageExploreSection';
import NearbyFeed from '@/components/experiences/NearbyFeed';
import WeekendGlance from '@/components/race/WeekendGlance';
import RaceFaq from '@/components/race/RaceFaq';
import { codeFaqs } from '@/data/faqs-2026';
import RaceStrip from '@/components/race/RaceStrip';
import TrackOutline from '@/components/race/TrackOutline';
import { getTrackSvg } from '@/services/track.service';
import { getWeekendFeed } from '@/services/nearby-feed.service';
import { calendarEntry, hasLiveExperiences } from '@/data/calendar-2026';
import fs from 'node:fs';
import path from 'node:path';

/** A /public image path if the file is actually there (added by hand); https URLs are used as they are. */
function existingPublicFile(src: string | undefined): string | undefined {
  if (!src) return undefined;
  if (/^https:\/\//.test(src)) return src;
  try {
    return fs.existsSync(path.join(process.cwd(), 'public', src)) ? src : undefined;
  } catch {
    return undefined;
  }
}

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const activeRaceSlug = await getActiveRaceSlug();
  const [race, storedContent] = await Promise.all([
    getRaceBySlug(activeRaceSlug),
    getRaceContent(activeRaceSlug),
  ]);
  // Written for the old venue when the race has moved (Bahrain GP → Sepang).
  const raceContent = calendarEntry(activeRaceSlug)?.venue ? null : storedContent;

  if (!race) {
    return {
      title: 'F1 Weekend — Race Weekend Travel Companion',
      description: 'The smartest way to experience a Formula 1 race weekend.',
    };
  }

  const venue = race.venueNote ? ` at ${race.circuitName.replace(/ International Circuit$/, '')}, ${race.country}` : '';
  // "Singapore Grand Prix 2026: F1 Weekend Guide" — no second "Singapore" when the name already has the city.
  const cityPart = race.name.includes(race.city) ? '' : `${race.city} `;
  const title = raceContent?.pageTitle ?? `${race.name} ${race.season}${venue}: ${cityPart}F1 Weekend Guide | F1 Weekend`;
  // Absolute: the layout template would append "| F1 Weekend" a second time.
  const description = raceContent?.pageDescription ?? `Plan your perfect ${race.name} weekend in ${race.city}. Curated experiences matched to session gaps, full schedule, and transport guide.`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: 'https://f1weekend.co' },
    keywords: [
      `${race.city} F1 guide`,
      `${race.name} experiences`,
      'F1 session gap activities',
      ...(raceContent?.pageKeywords ?? []),
    ],
    openGraph: {
      title,
      description,
      url: 'https://f1weekend.co',
      siteName: 'F1 Weekend',
      type: 'website',
      images: [
        {
          url: 'https://f1weekend.co/og/home.png',
          width: 1200,
          height: 630,
          alt: `${race.city} F1 Weekend Companion`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://f1weekend.co/og/home.png'],
    },
  };
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

function FeaturedCard({ exp, badge, activeRaceSlug }: { exp: Experience, badge?: string, activeRaceSlug: string }) {
  const color = CATEGORY_COLORS[exp.category] ?? '#6E6E82';
  return (
    <Link
      href={`/races/${activeRaceSlug}/experiences/${exp.slug}`}
      className="group shrink-0 w-56 lg:w-auto p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-[var(--accent-teal)]/50 transition-all flex flex-col"
    >
      {badge && (
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider w-fit mb-3 ${
          badge === 'Most Popular' ? 'bg-[var(--accent-red)] text-white' :
          badge === 'Top Rated' ? 'bg-[var(--accent-teal)]/20 text-[var(--accent-teal)]' :
          'bg-[var(--accent-red)]/20 text-[var(--accent-red)]'
        }`}>
          {badge}
        </span>
      )}
      <span className="text-3xl mb-3">{exp.imageEmoji}</span>
      <h3 className="font-display font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-teal)] transition-colors mb-2 line-clamp-2 min-h-[2.5rem]">
        {exp.title}
      </h3>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-amber-500 text-xs">★</span>
        <span className="text-xs font-medium text-[var(--text-primary)]">{exp.rating.toFixed(1)}</span>
        <span className="text-[var(--text-secondary)] text-xs">({exp.reviewCount.toLocaleString()})</span>
      </div>
      <div className="mt-auto pt-3 space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
          {exp.category}
        </p>
        <p className="text-xs text-[var(--text-secondary)] mono-data">
          {exp.durationLabel} · {exp.priceLabel}
        </p>
      </div>
    </Link>
  );
}

export default async function HomePage() {
  const activeRaceSlug = await getActiveRaceSlug();
  const [storedContent, race, availableRaces] = await Promise.all([
    getRaceContent(activeRaceSlug),
    getRaceBySlug(activeRaceSlug),
    getAvailableRaces(),
  ]);
  // When a race has moved (Bahrain GP → Sepang), its stored copy, circuit
  // image, sessions and gap windows describe the old venue: don't show them.
  const venueMoved = !!calendarEntry(activeRaceSlug)?.venue;
  const raceContent = venueMoved ? null : storedContent;
  const live = hasLiveExperiences(activeRaceSlug);
  // Track image: stored for the race, or the new venue's (Sepang) once added to /public/tracks.
  const trackImage = raceContent?.circuitMapSrc ?? existingPublicFile(calendarEntry(activeRaceSlug)?.venue?.trackImage);
  // No image file: draw the layout from OpenStreetMap (cached 30 days).
  const trackSvg = !trackImage && race ? await getTrackSvg(race) : null;

  if (!race) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[var(--text-secondary)]">
        Race data unavailable.
      </div>
    );
  }

  const [sessions, windows, featuredExps, popularExps, topRatedExps, feed] = await Promise.all([
    getSessionsByRace(race.id), // timetable in code for moved races
    venueMoved ? Promise.resolve([]) : getWindowsByRace(race.id),
    live ? Promise.resolve([]) : getFeaturedExperiences(race.id),
    live ? Promise.resolve([]) : getMostPopularExperiences(race.id, 5), // Fetch more to allow for dedup
    live ? Promise.resolve([]) : getTopRatedExperiences(race.id, 5),    // Fetch more to allow for dedup
    live ? getWeekendFeed(race) : Promise.resolve(null),
  ]);

  // Deduplication logic
  const seenIds = new Set<number>();
  const dedupedPopular: Experience[] = [];
  for (const exp of popularExps) {
    if (dedupedPopular.length >= 2) break;
    if (!seenIds.has(exp.id)) {
      seenIds.add(exp.id);
      dedupedPopular.push(exp);
    }
  }

  const dedupedFeatured: Experience[] = [];
  for (const exp of featuredExps) {
    if (dedupedFeatured.length >= 1) break;
    if (!seenIds.has(exp.id)) {
      seenIds.add(exp.id);
      dedupedFeatured.push(exp);
    }
  }

  const dedupedTopRated: Experience[] = [];
  for (const exp of topRatedExps) {
    if (dedupedTopRated.length >= 2) break;
    if (!seenIds.has(exp.id)) {
      seenIds.add(exp.id);
      dedupedTopRated.push(exp);
    }
  }

  const windowData = await Promise.all(
    windows.map(async (w) => {
      const exps = await getExperiencesByWindow(w.slug, race.id);
      return {
        slug: w.slug,
        count: exps.length,
        label: w.label,
        dayOfWeek: w.dayOfWeek,
        startTime: w.startTime,
        endTime: w.endTime,
        maxDurationHours: w.maxDurationHours,
        experiences: exps.slice(0, 4).map((e) => ({
          id: e.id,
          slug: e.slug,
          title: e.title,
          imageEmoji: e.imageEmoji,
          durationLabel: e.durationLabel,
        })),
      };
    })
  );

  // Compute FP1 target date for countdown
  const fp1 = sessions.find((s) => s.sessionType === 'practice');
  const raceDayDate = new Date(race.raceDate + 'T00:00:00Z');
  const DAY_OFFSETS: Record<string, number> = { Thursday: -3, Friday: -2, Saturday: -1, Sunday: 0 };
  const firstSessionDay = sessions[0]?.dayOfWeek ?? 'Friday';
  const offset = DAY_OFFSETS[firstSessionDay] ?? -2;
  
  const targetDateObj = new Date(raceDayDate);
  targetDateObj.setUTCDate(raceDayDate.getUTCDate() + offset);
  const targetDateStr = targetDateObj.toISOString().split('T')[0];
  const tzOffset = getTzOffsetStr(race.timezone, targetDateStr);
  
  let fp1IsoString = `${targetDateStr}T11:30:00${tzOffset}`;
  if (fp1?.startTime) {
    const startHHMM = fp1.startTime.slice(0, 5);
    fp1IsoString = `${targetDateStr}T${startHHMM}:00${tzOffset}`;
  }

  const heroDateRange = formatRaceDates(race.raceDate, sessions.some(s => s.dayOfWeek === 'Thursday'));
  const expBasePath = `/races/${activeRaceSlug}/experiences`;
  // "02 – 04 OCT": first to last day of the weekend (calendar dates when known).
  const stripDates = (() => {
    const cal = calendarEntry(activeRaceSlug);
    const end = new Date(`${race.raceDate}T00:00:00Z`);
    const start = cal ? new Date(`${cal.startDate}T00:00:00Z`) : new Date(end.getTime() - 2 * 86_400_000);
    const dd = (d: Date) => String(d.getUTCDate()).padStart(2, '0');
    const mon = (d: Date) => d.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' }).toUpperCase();
    return start.getUTCMonth() === end.getUTCMonth()
      ? `${dd(start)} – ${dd(end)} ${mon(end)}`
      : `${dd(start)} ${mon(start)} – ${dd(end)} ${mon(end)}`;
  })();

  // Timezone label for explore section (e.g. "GMT+11")
  const tzLabel = 'GMT' + tzOffset.replace(/:00$/, '');

  // Build per-day data for the explore section
  const DAY_ORDER = ['Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
  const DAY_SHORT: Record<string, string> = { Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun' };
  const DAY_RACE_OFFSET: Record<string, number> = { Thursday: -3, Friday: -2, Saturday: -1, Sunday: 0 };
  const raceDateObj2 = new Date(race.raceDate + 'T00:00:00Z');

  const exploreDays: ExploreDayData[] = DAY_ORDER
    .filter(d => sessions.some(s => s.dayOfWeek === d) || windowData.some(w => w.dayOfWeek === d))
    .map(day => {
      const d = new Date(raceDateObj2);
      d.setUTCDate(raceDateObj2.getUTCDate() + DAY_RACE_OFFSET[day]);
      const month = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
      const dayNum = d.getUTCDate();
      return {
        dayOfWeek: day,
        label: DAY_SHORT[day],
        dateLabel: `${month} ${dayNum}`,
        sessions: sessions.filter(s => s.dayOfWeek === day).map(s => ({
          name: s.name,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
        windows: windowData.filter(w => w.dayOfWeek === day),
      };
    });

  const SEASON_PREVIEW = availableRaces.slice(0, 5).map((r) => ({
    round: r.round,
    flag: r.flag,
    short: r.shortCode,
    dates: formatRaceDates(r.raceDate, r.hasThursdayFreeDay),
    slug: r.slug,
    active: r.slug === activeRaceSlug
  }));

  // Stored FAQs, or the ones written in code for a moved venue (Sepang).
  const HOME_FAQ = raceContent?.faqItems ?? codeFaqs(race.slug) ?? [];

  // Structured Data
  const websiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'F1 Weekend',
    url: 'https://f1weekend.co',
    description: `F1 race weekend companion — curated ${race.city} experiences for the ${race.season} ${race.name}`,
  };

  const eventLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: `${race.season} ${race.name}`,
    alternateName: race.name,
    startDate: race.raceDate, // simplified
    endDate: race.raceDate,
    location: {
      '@type': 'Place',
      name: race.circuitName,
      address: {
        '@type': 'PostalAddress',
        addressLocality: race.city,
        addressCountry: race.countryCode,
      },
    },
  };

  const allSchemas = [websiteLd, eventLd, homepageBreadcrumbLd];

  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(allSchemas) }} />
      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-20 pb-4 px-4">
        <div className="absolute inset-0 carbon-texture" />
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 70% 50%, rgba(225,6,0,0.06) 0%, transparent 70%)',
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-24 hero-gradient" />

        <div className="relative max-w-6xl mx-auto">
          <RaceStrip
            round={race.round}
            dateLabel={stripDates}
            flag={race.flag}
            raceName={race.name}
            note={race.venueNote}
            renderedAt={new Date().toISOString()}
            href={`/races/${activeRaceSlug}/schedule`}
            timezone={race.timezone}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center min-h-[420px]">
            <div className="flex flex-col justify-center py-8">
              <div className="flex flex-col gap-1.5 mb-5">
                <span className="px-2 py-0.5 rounded-full bg-[var(--accent-red)] text-white text-[10px] font-bold tracking-wider w-fit">
                  NEXT RACE
                </span>
              </div>

              <h1 className="font-display font-black text-5xl md:text-6xl text-[var(--text-primary)] uppercase-heading leading-tight mb-4">
                {raceContent?.homepageCopy?.heroHeading ? (
                  raceContent.homepageCopy.heroHeading
                ) : (
                  <>{race.city} has<br /><span className="text-[var(--accent-red)]">more to offer.</span></>
                )}
              </h1>

              <p className="text-[var(--text-secondary)] text-base md:text-lg max-w-sm">
                {raceContent?.homepageCopy?.heroSubtitle ?? (live
                  ? `Everything you can book around ${race.circuitName}, sorted by how long it takes to get there on race weekend.`
                  : `Discover the best of ${race.city} — curated experiences for every session gap of the race weekend.`)}
              </p>

              <div className="flex flex-wrap gap-3 mb-8 mt-6">
                {/* The planner is the one thing built around the session times: lead with it. */}
                <Link
                  href={`/itinerary?race=${activeRaceSlug}`}
                  className="px-5 py-2.5 bg-[var(--accent-red)] hover:bg-[var(--accent-red-hover)] text-white font-semibold text-sm rounded-full transition-colors whitespace-nowrap"
                >
                  Plan my race weekend →
                </Link>
                <Link
                  href={expBasePath}
                  className="px-5 py-2.5 border border-[var(--border-medium)] hover:border-[var(--text-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] font-semibold text-sm rounded-full transition-colors whitespace-nowrap"
                >
                  Explore {race.city}
                </Link>
              </div>

              <div>
                <p className="text-xs font-medium uppercase-label text-[var(--text-secondary)] mb-3 tracking-widest">
                  LIGHTS OUT IN
                </p>
                <RaceCountdown targetDate={fp1IsoString} />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {trackImage ? (
                <CircuitMap
                  src={trackImage}
                  alt={`${race.circuitName} — Circuit Map`}
                  width={1252}
                  height={704}
                  className="hidden md:block w-full"
                />
              ) : trackSvg ? (
                <TrackOutline svg={trackSvg} className="hidden md:block w-full max-w-xl mx-auto" />
              ) : null}
              <WeekendGlance
                sessions={sessions.filter((s) => ['practice', 'qualifying', 'sprint', 'race'].includes(s.sessionType))}
                raceDate={race.raceDate}
                circuitName={race.circuitName}
                tzLabel={tzLabel}
                timezone={race.timezone}
                scheduleHref={`/races/${activeRaceSlug}/schedule`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── SEO Intro Section ── */}
      <section className="max-w-6xl mx-auto px-4 py-10 border-b border-[var(--border-subtle)]">
        <div className="text-[var(--text-secondary)] text-base leading-relaxed max-w-4xl prose">
          {raceContent?.homepageIntro ? (
            <div className="space-y-4">
              <h2 className="font-display font-black text-2xl text-[var(--text-primary)] uppercase-heading">
                {raceContent.homepageIntro.split('\n')[0]}
              </h2>
              <p>{raceContent.homepageIntro.split('\n').slice(1).join('\n')}</p>
            </div>
          ) : (
            <>
              <h2 className="font-display font-black text-xl text-[var(--text-primary)] uppercase-heading mb-4">
                Plan Your {race.city} F1 Weekend Around the Sessions
              </h2>
              <p>
                {raceContent?.howItWorksText ??
                  `The ${race.name} runs ${heroDateRange} at ${race.circuitName}. Below is everything you can book nearby, sorted by how long it takes to get there on a race weekend — near the circuit first, then ${race.city} and a few day trips.`}
              </p>
            </>
          )}
        </div>
      </section>

      {/* ── Featured / Popular Section ── */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-display font-black text-xl text-[var(--text-primary)] uppercase-heading">
              {raceContent?.homepageCopy?.featuredHeading ?? `Best Things to Do in ${race.city} During the F1 Race`}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1.5">
              {raceContent?.homepageCopy?.featuredDescription ?? (live
                ? `GetYourGuide, Viator and Tiqets experiences around ${race.circuitName}, nearest first. Tap a dot on the map to see what’s there.`
                : `Curated for the ${race.city} Grand Prix weekend — activities matched to every session gap.`)}
            </p>
          </div>
          <Link href={expBasePath} className="text-sm font-medium text-[var(--accent-teal)] hover:text-[var(--text-primary)] transition-colors shrink-0 mt-1">
            View all →
          </Link>
        </div>

        {feed ? (
          <NearbyFeed
            compact
            pageSize={6}
            cards={feed.cards}
            picks={feed.picks}
            raceSlug={activeRaceSlug}
            circuit={{ lat: race.circuitLat, lng: race.circuitLng, name: race.circuitName }}
            moreHref={expBasePath}
            mapsApiKey={process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
            cities={[race.city]}
            lazyMap
          />
        ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide lg:grid lg:grid-cols-5 lg:overflow-visible">
          {dedupedPopular.map((exp) => (
            <FeaturedCard key={`pop-${exp.id}`} exp={exp} badge="Most Popular" activeRaceSlug={activeRaceSlug} />
          ))}
          {dedupedFeatured.map((exp) => (
            <FeaturedCard key={`feat-${exp.id}`} exp={exp} activeRaceSlug={activeRaceSlug} />
          ))}
          {dedupedTopRated.map((exp) => (
            <FeaturedCard key={`top-${exp.id}`} exp={exp} badge="Top Rated" activeRaceSlug={activeRaceSlug} />
          ))}
        </div>
        )}
      </section>

      {/* ── Season Preview Strip ── */}
      <section className="max-w-6xl mx-auto px-4 pb-10">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium uppercase-label text-[var(--text-secondary)] tracking-widest">
            {new Date().getFullYear()} SEASON · {availableRaces.length} RACES
          </p>
          <Link href="/f1-2026" className="text-xs font-medium text-[var(--accent-teal)] hover:text-[var(--text-primary)] transition-colors">
            Full calendar →
          </Link>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {SEASON_PREVIEW.map((r) => {
            const tileClass = `shrink-0 flex flex-col items-center gap-1 px-3 py-2.5 rounded-lg border transition-colors min-w-[56px] ${
              r.active ? 'border-[var(--accent-red)]/60 bg-[var(--accent-red)]/8' : 'border-[var(--border-subtle)]'
            }`;
            return (
              <Link key={r.slug} href={`/races/${r.slug}`} className={tileClass}>
                <span className="text-lg leading-none">{r.flag}</span>
                <span className={`text-[10px] font-bold uppercase-label tracking-wider ${r.active ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                  {r.short}
                </span>
                {r.active ? (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--accent-red)] text-white leading-tight">NOW</span>
                ) : (
                  <span className="text-[10px] mono-data text-[var(--text-secondary)] opacity-60">{r.dates}</span>
                )}
              </Link>
            );
          })}
          <Link
            href="/f1-2026"
            className="shrink-0 flex flex-col items-center justify-center gap-1 px-3 py-2.5 rounded-lg border border-dashed border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-medium)] transition-colors min-w-[56px]"
          >
            <span className="text-base font-bold">+{availableRaces.length - 5}</span>
            <span className="text-[10px] uppercase-label tracking-wider">more</span>
          </Link>
        </div>
      </section>

      {/* ── Explore City (Session-based) ── */}
      {exploreDays.length > 0 && (
        <HomepageExploreSection
          city={race.city}
          days={exploreDays}
          expBasePath={expBasePath}
          tzLabel={tzLabel}
          scheduleHref={`/races/${activeRaceSlug}/schedule`}
        />
      )}

      {/* ── FAQ ── */}
      <RaceFaq items={HOME_FAQ} className="max-w-3xl mx-auto px-4 pb-24" />
    </div>
  );
}
