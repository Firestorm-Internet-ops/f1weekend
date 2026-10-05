import type { Metadata } from 'next';
import RaceFaq from '@/components/race/RaceFaq';
import { codeFaqs, type Faq } from '@/data/faqs-2026';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { hasLiveExperiences, isRaceOver } from '@/data/calendar-2026';
import { getSessionsByRace } from '@/services/race.service';
import { getWeekendFeed } from '@/services/nearby-feed.service';
import NearbyFeed, { FeedPicks } from '@/components/experiences/NearbyFeed';
import WeekendGlance from '@/components/race/WeekendGlance';
import TrackOutline from '@/components/race/TrackOutline';
import { getTrackSvg } from '@/services/track.service';
import { getTimezoneAbbr } from '@/lib/utils';
import { getRaceBySlug, getRaceContent } from '@/services/race.service';
import { getExperiencesByWindow } from '@/services/experience.service';
import CircuitMap from '@/components/race/CircuitMap';
import DataInsights from '@/components/DataInsights';
import Breadcrumb from '@/components/Breadcrumb';
import RaceSwitcher from '@/components/race/RaceSwitcher';
import { getAvailableRaces } from '@/services/race.service';
import { raceKey } from '@/lib/race-url';
import { resolveRaceSlug } from '@/services/race.service';
import Icon, { type IconName } from '@/components/ui/Icon';
import PageByline from '@/components/race/PageByline';
import { raceEventLd, webPageLd } from '@/lib/structured-data';
import type { Session } from '@/types/race';
import AnswerFirst from '@/components/race/AnswerFirst';
import { answersFor } from '@/data/answers-2026';
import { seoExperiment } from '@/data/seo-experiments';
import { displayTitle } from '@/lib/providers/nearby-feed';
import ClusterNav from '@/components/race/ClusterNav';
import { clusterHub, clusterLinks } from '@/data/clusters-2026';
import UniqueData from '@/components/race/UniqueData';
import { uniqueDataFor } from '@/data/unique-data-2026';
import { getCircuitHistory, getRaceDayWeather, getStandings, getWeekendForecast } from '@/services/race-stats.service';

interface Props {
  params: Promise<{ raceSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { raceSlug: raceParam } = await params;
  const raceSlug = (await resolveRaceSlug(raceParam)) ?? raceParam;
  const [race, raceContent] = await Promise.all([
    getRaceBySlug(raceSlug),
    getRaceContent(raceSlug),
  ]);
  if (!race) return {};
  // SEO experiment: the answer-first race gets a title built from the questions it answers.
  if (seoExperiment(raceKey(raceSlug))?.variant === 'answer-first') {
    return {
      title: { absolute: `${race.name} ${race.season}: Start Times, Getting to ${race.circuitName.replace(/^Circuit of the Americas$/, 'COTA')} & Things to Do | F1 Weekend` },
      description: `When the ${race.season} ${race.name} starts, where ${race.circuitName} is, how to get there, where to watch and where to stay in ${race.city}: short answers, then everything you can book around the sessions.`,
      alternates: { canonical: `https://f1weekend.co/races/${raceKey(raceSlug)}` },
    };
  }
  // SEO experiment: unique-data races lead with their data in the title.
  const unique = seoExperiment(raceKey(raceSlug))?.variant === 'unique-data' && !race.rolledFrom ? uniqueDataFor(raceKey(raceSlug)) : null;
  if (unique) {
    return {
      title: { absolute: `${unique.title(race.season)} | F1 Weekend` },
      description: unique.description(race.season),
      alternates: { canonical: `https://f1weekend.co/races/${raceKey(raceSlug)}` },
    };
  }
  // SEO experiment: the topic-cluster race's title names the schedule and its lead page.
  const hub = seoExperiment(raceKey(raceSlug))?.variant === 'topic-cluster' && !race.rolledFrom ? clusterHub(raceKey(raceSlug), race) : null;
  if (hub) {
    return {
      title: { absolute: `${hub.title} | F1 Weekend` },
      description: hub.description,
      alternates: { canonical: `https://f1weekend.co/races/${raceKey(raceSlug)}` },
    };
  }
  return {
    title: { absolute: raceContent?.pageTitle ?? `${race.name} ${race.season}${race.venueNote ? ` at ${race.circuitName.replace(/ International Circuit$/, '')}, ${race.country}` : ''} Travel Guide | F1 Weekend` },
    description: raceContent?.pageDescription ?? `Your complete travel companion for the ${race.name} at ${race.circuitName}, ${race.city}. Schedule, experiences, and transport guide.`,
    alternates: { canonical: `https://f1weekend.co/races/${raceKey(raceSlug)}` },
    ...(raceContent?.pageKeywords?.length && { keywords: raceContent.pageKeywords }),
  };
}

/** Where most fans stay, when it isn't simply the race's city (Sepang: the Bahrain GP moved to Malaysia). */
const STAY_BASES: Record<string, string> = {
  bahrain: 'Kuala Lumpur or Putrajaya',
  qatar: 'Doha',
  'abu-dhabi': 'Abu Dhabi city or on Yas Island',
};

const NAV_ITEMS: { href: string; label: string; icon: IconName; desc: string }[] = [
  { href: 'schedule', label: 'Weekend Schedule', icon: 'calendar', desc: 'All sessions, times & timetable' },
  { href: 'experiences', label: 'Experiences', icon: 'map', desc: 'Curated activities for every session gap' },
  { href: 'getting-there', label: 'Getting There', icon: 'train', desc: 'Transport, parking & gate times' },
  { href: 'tips', label: 'Tips & FAQ', icon: 'lightbulb', desc: 'Weather, budget, tips & FAQ' },
  // Absolute: the planner lives at /itinerary, for this race.
  { href: '/itinerary', label: 'Plan my weekend', icon: 'compass', desc: 'Your sessions + things to do around them' },
];

export default async function RaceLandingPage({ params }: Props) {
  const { raceSlug: raceParam } = await params;
  const raceSlug = (await resolveRaceSlug(raceParam)) ?? raceParam;
  const [race, raceContent, availableRaces] = await Promise.all([
    getRaceBySlug(raceSlug),
    getRaceContent(raceSlug),
    getAvailableRaces(),
  ]);
  if (!race) notFound();

  // Fetch Thursday experiences if they exist
  const thursdayExperiences = hasLiveExperiences(raceSlug) ? [] : await getExperiencesByWindow('thursday', race.id);

  // Compute first–last day dates from raceDate (Sunday = race day)
  const raceDay = new Date(race.raceDate + 'T00:00:00Z');
  const firstDayOffset = raceContent?.firstDayOffset ?? -2;
  const firstDate = new Date(raceDay);
  firstDate.setUTCDate(raceDay.getUTCDate() + firstDayOffset);
  const firstDateStr = firstDate.toLocaleDateString('en-AU', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const sunStr = raceDay.toLocaleDateString('en-AU', { month: 'short', day: 'numeric', timeZone: 'UTC' });

  // One FAQ list, shown on the page and described by the same schema: stored
  // FAQs (or the stored FAQ schema's questions), else the ones in code (Sepang).
  const storedLd = raceContent?.faqLd as { mainEntity?: { name?: string; acceptedAnswer?: { text?: string } }[] } | null | undefined;
  const faqs: Faq[] =
    raceContent?.faqItems?.length ? raceContent.faqItems
    : storedLd?.mainEntity?.length ? storedLd.mainEntity.filter((m) => m.name && m.acceptedAnswer?.text).map((m) => ({ q: m.name!, a: m.acceptedAnswer!.text! }))
    : (race.rolledFrom ? null : codeFaqs(race.slug)) ?? [];

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://f1weekend.co' },
      { '@type': 'ListItem', position: 2, name: race.name, item: `https://f1weekend.co/races/${raceKey(raceSlug)}` },
    ],
  };

  const hasThursdayFreeDay = raceContent?.hasThursdayFreeDay ?? false;

  // Live-feed races (Bahrain GP at Sepang): no stored write-up, so the page is
  // built from the weekend timetable and the nearest bookable experiences.
  const live = hasLiveExperiences(raceSlug);
  const [liveSessions, liveFeed] = live
    ? await Promise.all([getSessionsByRace(race.id), getWeekendFeed(race)])
    : [[], null];
  const moved = !!race.venueMoved;
  const tzLabel = getTimezoneAbbr(race.timezone, new Date(`${race.raceDate}T12:00:00Z`));
  const nearCount = liveFeed?.cards.filter((c) => c.nearby.tier === 'near').length ?? 0;
  // SEO experiment (src/data/seo-experiments.ts): answer-first races lead with direct answers.
  const answers = seoExperiment(raceKey(raceSlug))?.variant === 'answer-first'
    ? answersFor(raceKey(raceSlug), {
        race,
        sessions: (liveSessions as Session[]).filter((s) => ['practice', 'qualifying', 'sprint', 'race'].includes(s.sessionType)),
        tzLabel,
        picks: (liveFeed?.picks ?? []).map((p) => displayTitle(p.title, [race.city])),
      })
    : null;
  // SEO experiment: topic-cluster races link to their focused pages from the top.
  const cluster = seoExperiment(raceKey(raceSlug))?.variant === 'topic-cluster' && !race.rolledFrom ? clusterLinks(raceKey(raceSlug)) : null;
  // SEO experiment: unique-data races get standings, circuit history, race-day weather and the forecast.
  const unique = seoExperiment(raceKey(raceSlug))?.variant === 'unique-data' && !race.rolledFrom ? uniqueDataFor(raceKey(raceSlug)) : null;
  const tz = race.timezone ?? 'UTC';
  const [standings, history] = unique
    ? await Promise.all([getStandings(race.season), getCircuitHistory(unique.circuitId, 10)])
    : [null, null];
  const [raceWeather, forecast] = unique
    ? await Promise.all([
        getRaceDayWeather(race.circuitLat, race.circuitLng, tz, (history?.wins ?? []).map((w) => ({ season: w.season, date: w.date }))),
        getWeekendForecast(race.circuitLat, race.circuitLng, tz, race.startDate ?? race.raceDate, race.raceDate),
      ])
    : [null, null];
  // Moved venue: the calendar's track image (F1's map) if set, else draw it from OpenStreetMap.
  const venueTrackImage = moved ? race.trackImage : undefined;
  const trackImageUrl = venueTrackImage && /^https:\/\//.test(venueTrackImage) ? venueTrackImage : undefined;
  const trackSvg = moved && !raceContent?.circuitMapSrc && !trackImageUrl ? await getTrackSvg(race) : null;

  return (
    <div className="min-h-screen pt-24 pb-24 px-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(raceEventLd(race)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageLd(`/races/${raceKey(raceSlug)}`, `${race.name} ${race.season} travel guide`, liveFeed?.fetchedAt)) }} />
      <div className={live ? 'max-w-5xl mx-auto' : 'max-w-3xl mx-auto'}>
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

        <h1 className="font-display font-black text-4xl sm:text-5xl text-[var(--text-primary)] uppercase-heading leading-none mb-3">
          {race.name}
        </h1>
        <p className="text-[var(--text-secondary)] text-lg mb-1">
          {race.circuitName}
        </p>
        <p className={`text-sm text-[var(--text-secondary)] mono-data ${race.venueNote ? 'mb-2' : 'mb-10'}`}>
          {race.city}, {race.country} · {firstDateStr}–{sunStr}, {race.season}
        </p>
        {isRaceOver(race, new Date()) && (
          <p className="text-sm text-[var(--text-secondary)] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-3 mb-6 max-w-2xl">
            The {race.season} {race.name} has finished. The {race.season + 1} dates appear here as soon as F1 publishes next season&apos;s calendar; the travel guide below stays useful for next year.
          </p>
        )}
        {race.venueNote && (
          <p className="inline-block text-sm font-medium text-[var(--accent-red)] bg-[var(--accent-red-muted)] rounded-full px-3 py-1 mb-10">
            {race.venueNote}
          </p>
        )}
        <PageByline
          className="-mt-6 mb-8 max-w-2xl"
          updated={liveFeed?.fetchedAt}
          updatedLabel="Experiences and prices refreshed"
          sources={unique ? unique.sources : [
            { label: 'Formula 1 timetable (Jolpica F1 API)', url: 'https://api.jolpi.ca/ergast/f1/' },
            ...(race.venueMoved && raceKey(race.slug) === 'bahrain' ? [{ label: 'Sepang International Circuit', url: 'https://www.sepangcircuit.com' }] : []),
            ...(live ? [{ label: 'GetYourGuide, Viator and Tiqets listings' }] : []),
          ]}
        />

        {/* The first bookable things, near the top (most visitors leave within seconds). */}
        {liveFeed && liveFeed.picks.length > 0 && !isRaceOver(race, new Date()) && (
          <FeedPicks picks={liveFeed.picks} raceSlug={raceSlug} cities={[race.city]} className="mb-12" />
        )}
        {answers && <AnswerFirst answers={answers} className="mb-12" />}
        {/* Getting There already has its own card below. */}
        {unique && (
          <UniqueData
            race={race}
            config={unique}
            cards={liveFeed?.cards ?? []}
            sessions={(liveSessions as Session[]).filter((s) => ['practice', 'qualifying', 'sprint', 'race'].includes(s.sessionType))}
            standings={standings}
            history={history}
            weather={raceWeather}
            forecast={forecast}
            className="mb-12"
          />
        )}
        {cluster && <ClusterNav links={cluster.filter((l) => l.path !== 'getting-there')} raceKey={raceKey(raceSlug)} city={race.city} className="mb-12" />}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {NAV_ITEMS.filter(item => item.href !== 'tips' || !!raceContent?.tipsContent).map(({ href, label, icon, desc }) => (
            <Link
              key={href}
              href={href.startsWith("/") ? `${href}?race=${raceKey(raceSlug)}` : `/races/${raceKey(raceSlug)}/${href}`}
              className="group p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:border-[var(--accent-strong)]/50 hover:bg-[var(--bg-surface)] transition-all"
            >
              <Icon name={icon} size={26} className="block mb-3 text-[var(--accent-red)]" />
              <p className="font-display font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-strong)] transition-colors mb-1">
                {label}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">{desc}</p>
            </Link>
          ))}
        </div>

        {live ? (
          <>
            <p className="text-[var(--text-secondary)] leading-relaxed mt-8">
              {moved && <>For {race.season} the {race.name} is held at {race.circuitName}, next to Kuala Lumpur International Airport, about 45 km south of central {race.city}. </>}
              Round {race.round} runs {firstDateStr}–{sunStr}. Most fans stay in {STAY_BASES[raceKey(raceSlug)] ?? race.city}
              {cluster?.some((l) => l.path === 'where-to-stay') ? <>: see <Link href={`/races/${raceKey(raceSlug)}/where-to-stay`} className="text-[var(--accent-red)] hover:underline">where to stay</Link>.</> : '.'}
              {liveFeed && liveFeed.cards.length > 0 && <> We list {liveFeed.cards.length} bookable experiences around the circuit{nearCount > 0 ? `, ${nearCount} of them within 30 minutes` : ''}, sorted by race-weekend travel time.</>}
            </p>

            {liveSessions.length > 0 && (
              <section className={`mt-10 ${trackSvg || trackImageUrl ? 'grid md:grid-cols-2 gap-6 items-center' : ''}`}>
                {trackImageUrl && <CircuitMap src={trackImageUrl} alt={`${race.circuitName} — Circuit Map`} width={1252} height={704} />}
                {trackSvg && <TrackOutline svg={trackSvg} />}
                <WeekendGlance
                  desktopOnly={false}
                  sessions={liveSessions.filter((s) => ['practice', 'qualifying', 'sprint', 'race'].includes(s.sessionType))}
                  raceDate={race.raceDate}
                  circuitName={race.circuitName}
                  tzLabel={tzLabel}
                  scheduleHref={`/races/${raceKey(raceSlug)}/schedule`}
                />
              </section>
            )}

            {liveFeed && liveFeed.cards.length > 0 && (
              <section className="mt-12">
                <h2 className="font-display font-bold text-xl text-[var(--text-primary)] uppercase-heading mb-4">Nearest things to do</h2>
                <NearbyFeed
                  compact
                  pageSize={4}
                  // The first 60 cover the list and the map's nearest pins; the full list is on the experiences page.
                  cards={liveFeed.cards.slice(0, 60)}
                  totalCount={liveFeed.cards.length}
                  tierTotals={liveFeed.cards.reduce((t, c) => ({ ...t, [c.nearby.tier]: t[c.nearby.tier] + 1 }), { near: 0, city: 0, daytrip: 0, unknown: 0, 'too-far': 0 })}
                  raceSlug={raceSlug}
                  circuit={{ lat: race.circuitLat, lng: race.circuitLng, name: race.circuitName }}
                  moreHref={`/races/${raceKey(raceSlug)}/experiences`}
                  // Picks are already shown at the top of the page.
                  excludeKeys={isRaceOver(race, new Date()) ? [] : liveFeed.picks.map((p) => p.key)}
                  mapsApiKey={process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
            cities={[race.city]}
            lazyMap
                />
              </section>
            )}
          </>
        ) : (
        <p className="text-[var(--text-secondary)] text-sm leading-relaxed mt-6 mb-2">
            Looking for things to do between sessions?{' '}
            <Link href={`/races/${raceKey(raceSlug)}/experiences`} className="text-[var(--accent-strong)] hover:underline">
              Browse {race.city} F1 {race.season} experiences
            </Link>{' '}
            — curated activities matched to every session gap in the weekend.
          </p>
        )}

        {(raceContent?.whyCityText || raceContent?.circuitMapSrc) && (
          <section className="mt-12 pt-8 border-t border-[var(--border-subtle)]">
            {raceContent?.whyCityText && (
              <>
                <h2 className="font-display font-bold text-xl text-[var(--text-primary)] uppercase-heading mb-4">
                  Why {race.city} Is the Perfect F1 City
                </h2>
                <p className="text-[var(--text-secondary)] text-base leading-relaxed max-w-2xl mb-6">
                  {raceContent.whyCityText}
                </p>
              </>
            )}
            {raceContent?.circuitMapSrc && (
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
                  <p className="font-display font-bold text-[var(--text-primary)] text-sm">{value}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Race Weekend Format — if has Thursday free day */}
        {hasThursdayFreeDay && (
          <section className="mt-12 pt-8 border-t border-[var(--border-subtle)]">
            <h2 className="font-display font-bold text-2xl text-[var(--text-primary)] uppercase-heading mb-4">
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
                  badgeColor: 'var(--accent-strong)',
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
                    <p className="font-display font-bold text-[var(--text-primary)]">{day}</p>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ color: badgeColor, backgroundColor: `${badgeColor}20`, border: `1px solid ${badgeColor}40` }}
                    >
                      {badge}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-2">{desc}</p>
                  <p className="text-xs font-medium text-[var(--accent-strong)] mono-data">{gap}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Thursday Free Day — if has Thursday free day */}
        {hasThursdayFreeDay && (
          <section id="thursday" className="mt-12 pt-8 border-t border-[var(--border-subtle)]">
            <h2 className="font-display font-bold text-2xl text-[var(--text-primary)] uppercase-heading mb-4">
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
                    <p className="text-xs font-medium uppercase-label text-[var(--accent-strong)] mb-2">
                      {exp.durationLabel}
                    </p>
                    <p className="font-display font-bold text-[var(--text-primary)] mb-2">{exp.title}</p>
                    <p className="text-xs text-[var(--text-secondary)] mb-4 line-clamp-3">
                      {exp.abstract ?? exp.shortDescription}
                    </p>
                    <Link href={`/races/${raceKey(raceSlug)}/experiences/${exp.slug}`} className="text-xs font-medium text-[var(--accent-strong)] hover:text-[var(--text-primary)] transition-colors">
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
              href={`/races/${raceKey(raceSlug)}/experiences?window=thursday`}
              className="inline-block text-sm font-medium text-[var(--accent-strong)] hover:text-[var(--text-primary)] transition-colors"
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

        {/* Answer-first pages already carry their questions (and FAQ schema) at the top. */}
        {!answers && <RaceFaq items={faqs} heading={`${race.name} ${race.season}: FAQ`} className="mt-12 pt-8 border-t border-[var(--border-subtle)]" />}
      </div>
    </div>
  );
}
