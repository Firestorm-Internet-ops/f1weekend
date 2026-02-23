export type Category = 'food' | 'culture' | 'adventure' | 'daytrip' | 'nightlife'

export interface ReviewSnapshot {
    author: string
    rating: number
    text: string
    date: string
}

export interface Experience {
    id: number
    raceId: number
    title: string
    slug: string
    description: string
    shortDescription: string
    category: Category
    durationHours: number
    durationLabel: string
    priceAmount: number
    priceCurrency: string
    priceLabel: string
    rating: number
    reviewCount: number
    imageUrl: string | null
    imageEmoji: string
    affiliatePartner: string
    affiliateUrl: string
    isFeatured: boolean
    tag: string | null
    sortOrder: number
    // Enrichment fields (populated by enrich-from-gyg.ts)
    highlights: string[] | null
    includes: string[] | null
    excludes: string[] | null
    importantInfo: string | null
    photos: string[] | null
    reviewsSnapshot: ReviewSnapshot[] | null
    f1Context: string | null
    meetingPoint: string | null
}

export interface ExperienceFilter {
    raceSlug: string
    category?: Category
    windowSlug?: string
    sort?: 'popular' | 'price-low' | 'price-high' | 'duration-short' | 'rating'
}

export interface ExperiencePreview {
    title: string;
    imageEmoji: string;
    durationLabel: string;
}