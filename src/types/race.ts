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