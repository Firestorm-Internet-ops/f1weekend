export type Category = 'food' | 'culture' | 'adventure' | 'daytrip' | 'nightlife'

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
}

export interface ExperienceFilter {
    raceSlug: string
    category?: Category
    windowSlug?: string
    sort?: 'popular' | 'price-low' | 'price-high' | 'duration-short' | 'rating'
}