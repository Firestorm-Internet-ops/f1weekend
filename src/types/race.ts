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
    /** First day of the weekend (YYYY-MM-DD). */
    startDate?: string
    /** True when this weekend is at another venue than the stored content describes (Bahrain GP 2026 at Sepang). */
    venueMoved?: boolean
    /** Track map for a moved venue (public path or https URL). */
    trackImage?: string
    /**
     * Set when the page has moved on to a later season than the stored data
     * (e.g. 2026 → 2027): stored sessions and year-specific copy don't apply.
     */
    rolledFrom?: number
    /** The stored venue, kept when the calendar overrides it (restored on rollover). */
    storedVenue?: Pick<Race, 'name' | 'circuitName' | 'city' | 'country' | 'countryCode' | 'circuitLat' | 'circuitLng' | 'timezone' | 'flag' | 'hasTips'>
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