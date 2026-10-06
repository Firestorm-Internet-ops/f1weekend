/**
 * sitemap.xml entries (served by src/app/sitemap.xml/route.ts). Pure, tested.
 *
 * <lastmod> only where we know the real date a page changed: Google ignores
 * a sitemap whose dates are always "today", but uses honest ones to decide
 * what to recrawl first.
 *  - Home and /f1-2026 change the day after each race (they lead with the next one).
 *  - SEO-experiment pages change on the day the variant went live.
 * Upcoming races are listed first, so the pages that matter now come first.
 */
import { isRaceOver, localDate } from '@/data/calendar-2026';
import { clusterTopics } from '@/data/clusters-2026';
import { seoExperiment } from '@/data/seo-experiments';
import { raceKey } from '@/lib/race-url';
import type { Race } from '@/types/race';
import { AUTHORS, authorPath } from '@/data/authors';
import { EXPERT_GUIDES, liveGuide } from '@/data/expert-guides-2026';

export interface SitemapEntry {
  loc: string;
  changefreq: string;
  priority: string;
  lastmod?: string;
}

type SitemapRace = Pick<Race, 'slug' | 'raceDate' | 'timezone' | 'hasTips' | 'rolledFrom'>;

// /experiences, /experiences/map, /guide, /schedule and /getting-there only
// redirect to the current race; /privacy and /itinerary are noindex. Not listed.
const STATIC_ROUTES = [
  { path: '', changefreq: 'daily', priority: '1.0', followsCalendar: true },
  { path: '/f1-2026', changefreq: 'weekly', priority: '0.8', followsCalendar: true },
  { path: '/about', changefreq: 'monthly', priority: '0.4', followsCalendar: false },
  { path: '/contact', changefreq: 'monthly', priority: '0.3', followsCalendar: false },
];

const RACE_ROUTES = [
  { suffix: '', changefreq: 'daily', priority: '0.9' },
  { suffix: '/experiences', changefreq: 'daily', priority: '0.9' },
  { suffix: '/schedule', changefreq: 'weekly', priority: '0.7' },
  { suffix: '/getting-there', changefreq: 'monthly', priority: '0.6' },
  { suffix: '/experiences/map', changefreq: 'weekly', priority: '0.6' },
  { suffix: '/tips', changefreq: 'weekly', priority: '0.6' },
];
// Individual experience pages (/races/*/experiences/*) are noindex (they carry
// the provider's own copy), so they're not listed either.

const dayAfter = (date: string) => new Date(Date.parse(`${date}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);

/** The day the home page last switched race: the day after the latest race that's over (track time). */
export function calendarLastmod(races: SitemapRace[], now: Date): string | undefined {
  const over = races.filter((r) => isRaceOver(r, localDate(now, r.timezone))).map((r) => r.raceDate).sort();
  return over.length ? dayAfter(over[over.length - 1]) : undefined;
}

export function sitemapEntries(
  baseUrl: string,
  races: SitemapRace[],
  isLive: (slug: string) => boolean,
  now: Date
): SitemapEntry[] {
  const entries = new Map<string, SitemapEntry>();
  const add = (e: SitemapEntry) => {
    const loc = encodeURI(e.loc); // percent-encode non-ASCII slugs
    entries.set(loc, { ...e, loc });
  };

  const switched = calendarLastmod(races, now);
  for (const r of STATIC_ROUTES) {
    add({ loc: `${baseUrl}${r.path}`, changefreq: r.changefreq, priority: r.priority, lastmod: r.followsCalendar ? switched : undefined });
  }

  // Author pages of authors with a guide on the site; lastmod = their latest checked guide.
  for (const a of Object.values(AUTHORS)) {
    const checked = Object.entries(EXPERT_GUIDES)
      .filter(([key, g]) => g.author === a.slug && liveGuide(key) !== null)
      .map(([, g]) => g.lastChecked).sort();
    if (checked.length) add({ loc: `${baseUrl}${authorPath(a)}`, changefreq: 'monthly', priority: '0.4', lastmod: checked[checked.length - 1] });
  }

  // Upcoming first (calendar order kept within each group).
  const upcoming = races.filter((r) => !isRaceOver(r, localDate(now, r.timezone)));
  const past = races.filter((r) => isRaceOver(r, localDate(now, r.timezone)));
  for (const race of [...upcoming, ...past]) {
    const key = raceKey(race.slug);
    const live = isLive(race.slug);
    const experiment = seoExperiment(key);
    const liveFrom = experiment?.liveFrom && experiment.liveFrom <= localDate(now) ? experiment.liveFrom : undefined;
    for (const r of RACE_ROUTES) {
      // Only pages that exist and don't redirect.
      if (r.suffix === '/tips' && race.hasTips === false) continue;
      if (r.suffix === '/experiences/map' && live) continue;
      add({ loc: `${baseUrl}/races/${key}${r.suffix}`, changefreq: r.changefreq, priority: r.priority, lastmod: r.suffix === '' ? liveFrom : undefined });
    }
    // Topic-cluster pages (SEO experiment), e.g. /races/mexico/day-of-the-dead.
    if (experiment?.variant === 'topic-cluster' && !race.rolledFrom) {
      for (const topic of clusterTopics(key)) {
        add({ loc: `${baseUrl}/races/${key}/${topic}`, changefreq: 'weekly', priority: '0.7', lastmod: liveFrom });
      }
    }
  }
  return [...entries.values()];
}
