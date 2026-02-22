import { NextRequest, NextResponse } from 'next/server';
import { queryExperiences } from '@/services/experience.service';
import type { Category, ExperienceFilter } from '@/types/experience';

const VALID_CATEGORIES: Category[] = ['food', 'culture', 'adventure', 'daytrip', 'nightlife'];
const VALID_SORTS: ExperienceFilter['sort'][] = [
  'popular',
  'price-low',
  'price-high',
  'duration-short',
  'rating',
];

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const race = searchParams.get('race');
  if (!race) {
    return NextResponse.json({ error: 'race parameter is required' }, { status: 400 });
  }

  const categoryParam = searchParams.get('category');
  if (categoryParam && !VALID_CATEGORIES.includes(categoryParam as Category)) {
    return NextResponse.json(
      { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` },
      { status: 400 }
    );
  }

  const sortParam = searchParams.get('sort');
  if (sortParam && !VALID_SORTS.includes(sortParam as ExperienceFilter['sort'])) {
    return NextResponse.json(
      { error: `Invalid sort. Must be one of: ${VALID_SORTS.join(', ')}` },
      { status: 400 }
    );
  }

  const filter: ExperienceFilter = {
    raceSlug: race,
    category: categoryParam ? (categoryParam as Category) : undefined,
    windowSlug: searchParams.get('window') ?? undefined,
    sort: sortParam ? (sortParam as ExperienceFilter['sort']) : undefined,
  };

  try {
    const data = await queryExperiences(filter);
    return NextResponse.json({
      data,
      count: data.length,
      filters: {
        race,
        category: filter.category ?? null,
        window: filter.windowSlug ?? null,
        sort: filter.sort ?? 'popular',
      },
    });
  } catch (err) {
    console.error('[GET /api/experiences]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
