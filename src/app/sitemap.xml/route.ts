import { getAllRaces } from '@/services/race.service';
import { hasLiveExperiences } from '@/data/calendar-2026';
import { raceKey } from '@/lib/race-url';
import { clusterTopics } from '@/data/clusters-2026';
import { seoExperiment } from '@/data/seo-experiments';

export const dynamic = 'force-dynamic';

function trimTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function xmlEscape(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

// No <lastmod>: pages have no reliable "last changed" date yet, and Google
// distrusts a sitemap whose dates are just "today". Better none than fake.
const STATIC_ROUTES: Array<{ path: string; changefreq: string; priority: string }> = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/f1-2026', changefreq: 'weekly', priority: '0.8' },
  { path: '/about', changefreq: 'monthly', priority: '0.4' },
  { path: '/contact', changefreq: 'monthly', priority: '0.3' },
  // /experiences, /experiences/map, /guide, /schedule and /getting-there only
  // redirect to the current race; /privacy and /itinerary are noindex. Not listed.
];

const RACE_ROUTE_SUFFIXES: Array<{ suffix: string; changefreq: string; priority: string }> = [
  { suffix: '', changefreq: 'daily', priority: '0.9' },
  { suffix: '/experiences', changefreq: 'daily', priority: '0.9' },
  { suffix: '/schedule', changefreq: 'weekly', priority: '0.7' },
  { suffix: '/getting-there', changefreq: 'monthly', priority: '0.6' },
  { suffix: '/experiences/map', changefreq: 'weekly', priority: '0.6' },
  { suffix: '/tips', changefreq: 'weekly', priority: '0.6' },
];
// Individual experience pages (/races/*/experiences/*) are noindex — they carry
// the provider's own copy — so they're not listed either.

export async function GET() {
  const baseUrl = trimTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL || 'https://f1weekend.co');
  const races = await getAllRaces();

  type UrlEntry = { loc: string; changefreq: string; priority: string };

  const urlsMap = new Map<string, UrlEntry>();
  const addUrl = (entry: UrlEntry) => {
    // Percent-encode non-ASCII slugs (e.g. "fundació").
    const loc = encodeURI(entry.loc);
    urlsMap.set(loc, { ...entry, loc });
  };

  for (const route of STATIC_ROUTES) {
    addUrl({
      loc: `${baseUrl}${route.path === '/' ? '' : route.path}`,
      changefreq: route.changefreq,
      priority: route.priority,
    });
  }

  for (const race of races) {
    const live = hasLiveExperiences(race.slug);
    for (const route of RACE_ROUTE_SUFFIXES) {
      // Only list pages that exist and don't redirect.
      if (route.suffix === '/tips' && race.hasTips === false) continue;
      if (route.suffix === '/experiences/map' && live) continue;
      addUrl({
        loc: `${baseUrl}/races/${raceKey(race.slug)}${route.suffix}`,
        changefreq: route.changefreq,
        priority: route.priority,
      });
    }
    // Topic-cluster pages (SEO experiment), e.g. /races/mexico/day-of-the-dead.
    if (seoExperiment(raceKey(race.slug))?.variant === 'topic-cluster' && !race.rolledFrom) {
      for (const topic of clusterTopics(raceKey(race.slug))) {
        addUrl({ loc: `${baseUrl}/races/${raceKey(race.slug)}/${topic}`, changefreq: 'weekly', priority: '0.7' });
      }
    }
  }

  const urls = Array.from(urlsMap.values());

  const urlNodes = urls
    .map(
      (u) => `  <url>
    <loc>${xmlEscape(u.loc)}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlNodes}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
