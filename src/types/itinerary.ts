export type SlotType = 'session' | 'experience' | 'free'

export interface ItinerarySlot {
    type: SlotType
    experienceId?: number
    startTime: string
    endTime: string
    note: string
}

export interface ItineraryDay {
    date: string
    dayLabel: string
    slots: ItinerarySlot[]
}

export interface Itinerary {
    id: string
    title: string
    summary: string
    days: ItineraryDay[]
}

export interface ItineraryInput {
    raceSlug: string
    arrivalDay: 'Wednesday' | 'Thursday' | 'Friday'
    departureDay: 'Sunday' | 'Monday' | 'Tuesday'
    interests: string[]
    freeText?: string
    groupSize?: number
}