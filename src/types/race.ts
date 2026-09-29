export interface Race {
    id: number
    slug: string
    name: string
    season: number
    round: number
    circuitName: string
    city: string
    country: string
    countryCode: string
    circuitLat: number
    circuitLng: number
    timezone: string
    raceDate: string
    flag?: string
    shortCode?: string
    available?: boolean
    hasThursdayFreeDay?: boolean
    /** Whether /races/[slug]/tips has content (false → the page 404s, so don't link to it). */
    hasTips?: boolean
    /** Set when the race moved venue this season, e.g. "At Sepang, Malaysia in 2026 (moved from Sakhir, Bahrain)". */
    venueNote?: string
}

export interface Session {
    id: number
    raceId: number
    name: string
    shortName: string
    dayOfWeek: 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'
    startTime: string  // HH:mm format
    endTime: string
    sessionType: 'practice' | 'qualifying' | 'sprint' | 'race' | 'support' | 'event'
}

export interface ExperienceWindow {
    id: number
    raceId: number
    slug: string
    label: string
    dayOfWeek: 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'
    startTime: string | null
    endTime: string | null
    maxDurationHours: number | null
    description: string
    sortOrder: number
}