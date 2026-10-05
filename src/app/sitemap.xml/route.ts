import { getAllRaces } from '@/services/race.service';
import { hasLiveExperiences } from '@/data/calendar-2026';
import { sitemapEntries } from '@/lib/sitemap';

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

// Which pages are listed, their order and <lastmod>: src/lib/sitemap.ts.
export async function GET() {
  const baseUrl = trimTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL || 'https://f1weekend.co');
  const urls = sitemapEntries(baseUrl, await getAllRaces(), hasLiveExperiences, new Date());

  const urlNodes = urls
    .map(
      (u) => `  <url>
    <loc>${xmlEscape(u.loc)}</loc>${u.lastmod ? `
    <lastmod>${u.lastmod}</lastmod>` : ''}
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
