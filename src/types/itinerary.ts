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

export interface GapSlot {
    type: 'gap'
    startTime: string
    endTime: string
    windowLabel: string
    suggestionIds: number[]
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
    days: ItineraryDay[]
}
