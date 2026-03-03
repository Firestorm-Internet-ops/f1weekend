import { getAllRaces } from '@/services/race.service';
import { getExperiencesByRace } from '@/services/experience.service';

export const dynamic = 'force-dynamic';

function fmt(date: Date): string {
  return date.toISOString().split('T')[0];
}

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

const STATIC_ROUTES: Array<{
  path: string;
  changefreq: string;
  priority: string;
  useStaticDate?: boolean;
}> = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/f1-2026', changefreq: 'weekly', priority: '0.8', useStaticDate: true },
  { path: '/about', changefreq: 'monthly', priority: '0.4', useStaticDate: true },
  { path: '/contact', changefreq: 'monthly', priority: '0.3', useStaticDate: true },
  { path: '/experiences', changefreq: 'daily', priority: '0.7' },
  { path: '/experiences/map', changefreq: 'weekly', priority: '0.6' },
  { path: '/guide', changefreq: 'weekly', priority: '0.7' },
  { path: '/schedule', changefreq: 'weekly', priority: '0.5', useStaticDate: true },
  { path: '/getting-there', changefreq: 'monthly', priority: '0.5', useStaticDate: true },
  // /privacy and /itinerary are intentionally omitted (noindex pages)
];

const RACE_ROUTE_SUFFIXES: Array<{
  suffix: string;
  changefreq: string;
  priority: string;
  useStaticDate?: boolean;
}> = [
  { suffix: '', changefreq: 'daily', priority: '0.9' },
  { suffix: '/experiences', changefreq: 'daily', priority: '0.9' },
  { suffix: '/guide', changefreq: 'weekly', priority: '0.85' },
  { suffix: '/schedule', changefreq: 'weekly', priority: '0.7', useStaticDate: true },
  { suffix: '/getting-there', changefreq: 'monthly', priority: '0.6', useStaticDate: true },
  { suffix: '/experiences/map', changefreq: 'weekly', priority: '0.6' },
  { suffix: '/tips', changefreq: 'weekly', priority: '0.6' },
];

export async function GET() {
  const now = new Date();
  const staticDate = new Date('2026-01-01');
  const baseUrl = trimTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL || 'https://f1weekend.co');
  const races = await getAllRaces();

  type UrlEntry = {
    loc: string;
    lastmod: string;
    changefreq: string;
    priority: string;
  };

  const urlsMap = new Map<string, UrlEntry>();
  const addUrl = (entry: UrlEntry) => {
    urlsMap.set(entry.loc, entry);
  };

  for (const route of STATIC_ROUTES) {
    addUrl({
      loc: `${baseUrl}${route.path === '/' ? '' : route.path}`,
      lastmod: fmt(route.useStaticDate ? staticDate : now),
      changefreq: route.changefreq,
      priority: route.priority,
    });
  }

  const experiencesByRace = await Promise.all(
    races.map(async (race) => ({
      race,
      experiences: await getExperiencesByRace(race.id),
    })),
  );

  for (const { race, experiences } of experiencesByRace) {
    for (const route of RACE_ROUTE_SUFFIXES) {
      addUrl({
        loc: `${baseUrl}/races/${race.slug}${route.suffix}`,
        lastmod: fmt(route.useStaticDate ? staticDate : now),
        changefreq: route.changefreq,
        priority: route.priority,
      });
    }

    for (const experience of experiences) {
      addUrl({
        loc: `${baseUrl}/races/${race.slug}/experiences/${experience.slug}`,
        lastmod: fmt(now),
        changefreq: 'weekly',
        priority: '0.8',
      });
    }
  }

  const urls = Array.from(urlsMap.values());

  const urlNodes = urls
    .map(
      (u) => `  <url>
    <loc>${xmlEscape(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
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
