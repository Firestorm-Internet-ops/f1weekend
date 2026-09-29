import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { clearRaceCache, syncAvailableRaces } from '@/services/race.service';
import { raceKey } from '@/lib/race-url';

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-revalidate-token');
  if (token !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await req.json().catch(() => ({}));

  // 0. Sync available flag based on experiences in DB
  await syncAvailableRaces();

  // 1. Clear Redis cache (for custom cached functions if any still exist)
  await clearRaceCache(slug);

  // 2. Revalidate Next.js ISR cache
  // Hub pages that change when any race is added/updated
  revalidatePath('/f1-2026');
  revalidatePath('/');
  revalidatePath('/sitemap.xml');

  if (slug) {
    // Revalidate all sub-pages for the specific race
    const paths = [
      `/races/${raceKey(slug)}`,
      `/races/${raceKey(slug)}/schedule`,
      `/races/${raceKey(slug)}/experiences`,
      `/races/${raceKey(slug)}/getting-there`,
      `/races/${raceKey(slug)}/guide`,
      `/races/${raceKey(slug)}/tips`,
    ];
    paths.forEach(p => revalidatePath(p));
  }

  return NextResponse.json({ revalidated: true, slug: slug ?? 'all' });
}
