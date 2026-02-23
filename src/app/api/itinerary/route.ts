import { NextRequest, NextResponse } from 'next/server';
import { buildManualItinerary } from '@/services/itinerary.service';
import type { ManualItineraryInput } from '@/types/itinerary';

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as ManualItineraryInput;

        if (
            !body.raceSlug ||
            !body.arrivalDay ||
            !body.departureDay ||
            !Array.isArray(body.sessionIds) ||
            body.sessionIds.length === 0
        ) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const itinerary = await buildManualItinerary(body);
        return NextResponse.json({ id: itinerary.id });
    } catch (error) {
        console.error('[itinerary] POST error:', error);
        return NextResponse.json({ error: 'Failed to build itinerary' }, { status: 500 });
    }
}
