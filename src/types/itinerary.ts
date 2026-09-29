export interface ManualItineraryInput {
    raceSlug: string
    arrivalDay: 'Wednesday' | 'Thursday' | 'Friday'
    departureDay: 'Sunday' | 'Monday' | 'Tuesday'
    sessionIds: number[]
}

export interface SessionSlot {
    type: 'session'
    startTime: string
    endTime: string
    name: string        // "Free Practice 1"
    shortName: string   // "FP1"
    series: string      // "Formula 1"
}

/** A live-feed experience suggested for a gap (races whose experiences come from providers). */
export interface FeedSuggestion {
    key: string
    title: string
    imageUrl: string | null
    nearbyLabel: string | null
    circuitKm: number | null
    durationHours: number | null
    rating: number | null
    reviewCount: number
    provider: string
    productId: string
    priceAmount: number | null
    priceCurrency: string
    /** How many other sites sell it (shown as "+1 more site"). */
    otherSites: number
}

export interface GapSlot {
    type: 'gap'
    startTime: string
    endTime: string
    windowLabel: string
    suggestionIds: number[]
    /** Live-feed suggestions; used instead of suggestionIds for live-feed races. */
    feedSuggestions?: FeedSuggestion[]
}

export type ItinerarySlot = SessionSlot | GapSlot

export interface ItineraryDay {
    date: string
    dayLabel: string
    slots: ItinerarySlot[]
}

export interface Itinerary {
    id: string
    title: string
    summary?: string
    raceId?: number
    /** Race slug, for booking links on live-feed suggestions. */
    raceSlug?: string
    days: ItineraryDay[]
}
