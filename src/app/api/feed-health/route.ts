import { NextRequest, NextResponse } from 'next/server';
import { ALL_SEARCH_ADAPTERS } from '@/lib/providers';
import { getRaceBySlug, resolveRaceSlug } from '@/services/race.service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/feed-health?race=singapore
 * Is each booking site (GetYourGuide, Viator, Tiqets) configured on this
 * deployment, and does it answer? Reports only yes/no, a count and the error
 * text, never keys. Staging only, like /api/nearby-audit.
 */
export async function GET(req: NextRequest) {
  if (process.env.VERCEL_ENV === 'production') return new NextResponse('Not found', { status: 404 });
  const headers = { 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' };

  const param = req.nextUrl.searchParams.get('race') ?? 'singapore';
  const race = await getRaceBySlug((await resolveRaceSlug(param)) ?? param);
  if (!race) return NextResponse.json({ error: `unknown race ${param}` }, { status: 404, headers });

  const query = { city: race.city, lat: race.circuitLat, lng: race.circuitLng, radiusKm: 30, currency: 'USD', limit: 5 };
  const sites = await Promise.all(
    Object.values(ALL_SEARCH_ADAPTERS).map(async (a) => {
      if (!a.isConfigured()) return { site: a.id, configured: false, results: 0, error: 'API key not set on this deployment' };
      const started = Date.now();
      try {
        const offers = await a.search(query);
        return { site: a.id, configured: true, results: offers.length, ms: Date.now() - started, error: null };
      } catch (err) {
        return { site: a.id, configured: true, results: 0, ms: Date.now() - started, error: (err as Error).message.slice(0, 300) };
      }
    })
  );
  return NextResponse.json({ race: race.slug, env: process.env.VERCEL_ENV ?? 'local', sites }, { headers });
}
