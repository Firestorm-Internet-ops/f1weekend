import { NextRequest, NextResponse } from 'next/server';
import { getItinerary } from '@/services/itinerary.service';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itinerary = await getItinerary(id);

    if (!itinerary) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(itinerary);
  } catch (error) {
    console.error('[itinerary] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch itinerary' }, { status: 500 });
  }
}
