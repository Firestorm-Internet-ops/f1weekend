import { NextRequest, NextResponse } from 'next/server';
import { createItinerary } from '@/services/itinerary.service';
import type { ItineraryInput } from '@/types/itinerary';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ItineraryInput;

    if (!body.raceSlug || !body.arrivalDay || !body.departureDay || !body.interests?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const itinerary = await createItinerary(body);
    return NextResponse.json({ id: itinerary.id });
  } catch (error) {
    console.error('[itinerary] POST error:', error);
    return NextResponse.json({ error: 'Failed to generate itinerary' }, { status: 500 });
  }
}
