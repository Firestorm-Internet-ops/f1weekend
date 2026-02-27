import { getRaceBySlug } from '@/services/race.service';
import { getExperiencesByRace } from '@/services/experience.service';

export const dynamic = 'force-dynamic';

function fmt(date: Date): string {
  return date.toISOString().split('T')[0];
}

export async function GET() {
  const [melbRace, shangRace] = await Promise.all([
    getRaceBySlug('melbourne-2026'),
    getRaceBySlug('shanghai-2026'),
  ]);

  const [melbExps, shangExps] = await Promise.all([
    melbRace ? getExperiencesByRace(melbRace.id) : [],
    shangRace ? getExperiencesByRace(shangRace.id) : [],
  ]);

  const now = new Date();
  const staticDate = new Date('2026-01-01');

  type UrlEntry = {
    loc: string;
    lastmod: string;
    changefreq: string;
    priority: string;
  };

  const urls: UrlEntry[] = [
    {
      loc: 'https://f1weekend.co',
      lastmod: fmt(now),
      changefreq: 'daily',
      priority: '1.0',
    },
    // Melbourne race canonical URLs
    {
      loc: 'https://f1weekend.co/races/melbourne-2026',
      lastmod: fmt(now),
      changefreq: 'daily',
      priority: '0.9',
    },
    {
      loc: 'https://f1weekend.co/races/melbourne-2026/experiences',
      lastmod: fmt(now),
      changefreq: 'daily',
      priority: '0.9',
    },
    {
      loc: 'https://f1weekend.co/races/melbourne-2026/guide',
      lastmod: fmt(now),
      changefreq: 'weekly',
      priority: '0.85',
    },
    {
      loc: 'https://f1weekend.co/races/melbourne-2026/schedule',
      lastmod: fmt(staticDate),
      changefreq: 'weekly',
      priority: '0.7',
    },
    {
      loc: 'https://f1weekend.co/races/melbourne-2026/getting-there',
      lastmod: fmt(staticDate),
      changefreq: 'monthly',
      priority: '0.6',
    },
    {
      loc: 'https://f1weekend.co/races/melbourne-2026/experiences/map',
      lastmod: fmt(now),
      changefreq: 'weekly',
      priority: '0.6',
    },
    // Shanghai race canonical URLs
    {
      loc: 'https://f1weekend.co/races/shanghai-2026',
      lastmod: fmt(now),
      changefreq: 'daily',
      priority: '0.9',
    },
    {
      loc: 'https://f1weekend.co/races/shanghai-2026/experiences',
      lastmod: fmt(now),
      changefreq: 'daily',
      priority: '0.9',
    },
    {
      loc: 'https://f1weekend.co/races/shanghai-2026/schedule',
      lastmod: fmt(staticDate),
      changefreq: 'weekly',
      priority: '0.7',
    },
    {
      loc: 'https://f1weekend.co/races/shanghai-2026/getting-there',
      lastmod: fmt(staticDate),
      changefreq: 'monthly',
      priority: '0.6',
    },
    {
      loc: 'https://f1weekend.co/races/shanghai-2026/experiences/map',
      lastmod: fmt(now),
      changefreq: 'weekly',
      priority: '0.6',
    },
    // Flat redirect pages (lower priority — canonicals are above)
    {
      loc: 'https://f1weekend.co/experiences',
      lastmod: fmt(now),
      changefreq: 'daily',
      priority: '0.7',
    },
    {
      loc: 'https://f1weekend.co/guide',
      lastmod: fmt(now),
      changefreq: 'weekly',
      priority: '0.7',
    },
    {
      loc: 'https://f1weekend.co/schedule',
      lastmod: fmt(staticDate),
      changefreq: 'weekly',
      priority: '0.5',
    },
    {
      loc: 'https://f1weekend.co/getting-there',
      lastmod: fmt(staticDate),
      changefreq: 'monthly',
      priority: '0.5',
    },
    {
      loc: 'https://f1weekend.co/experiences/map',
      lastmod: fmt(now),
      changefreq: 'weekly',
      priority: '0.6',
    },
    {
      loc: 'https://f1weekend.co/f1-2026',
      lastmod: fmt(staticDate),
      changefreq: 'weekly',
      priority: '0.8',
    },
    {
      loc: 'https://f1weekend.co/itinerary',
      lastmod: fmt(staticDate),
      changefreq: 'monthly',
      priority: '0.5',
    },
    {
      loc: 'https://f1weekend.co/about',
      lastmod: fmt(staticDate),
      changefreq: 'monthly',
      priority: '0.4',
    },
    {
      loc: 'https://f1weekend.co/contact',
      lastmod: fmt(staticDate),
      changefreq: 'monthly',
      priority: '0.3',
    },
    // /privacy intentionally omitted — noindex legal page
    ...melbExps.map((e) => ({
      loc: `https://f1weekend.co/races/melbourne-2026/experiences/${e.slug}`,
      lastmod: fmt(now),
      changefreq: 'weekly',
      priority: '0.8',
    })),
    ...shangExps.map((e) => ({
      loc: `https://f1weekend.co/races/shanghai-2026/experiences/${e.slug}`,
      lastmod: fmt(now),
      changefreq: 'weekly',
      priority: '0.8',
    })),
  ];

  const urlNodes = urls
    .map(
      (u) => `  <url>
    <loc>${u.loc}</loc>
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
