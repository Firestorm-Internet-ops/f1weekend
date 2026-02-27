export type Category = 'food' | 'culture' | 'adventure' | 'daytrip' | 'nightlife'

export interface FAQItem {
  question: string
  answer: string
}

export interface ReviewSnapshot {
    author: string
    rating: number
    text: string
    date: string
    country?: string
}

export interface OptionSnapshot {
    optionId: number
    title: string
    description: string
    price: number
    skipTheLine: boolean
    instantConfirmation: boolean
    languages: string[]
    meetingPoint: string
}

export interface Experience {
    id: number
    raceId: number
    title: string
    slug: string
    description: string
    shortDescription: string
    abstract?: string | null
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
    // Tour-detail enrichment fields
    bestseller: boolean | null
    originalPrice: number | null
    discountPct: number | null
    hasPickUp: boolean | null
    mobileVoucher: boolean | null
    instantConfirmation: boolean | null
    skipTheLine: boolean | null
    optionsSnapshot: OptionSnapshot[] | null
    gygCategories: string[] | null
    seoKeywords: string[] | null
    f1WindowsLabel: string | null
    lat: number | null
    lng: number | null
    languages: string[] | null
    distanceKm: number | null
    neighborhood: string | null
    travelMins: number | null
    guideArticle: string | null
    faqItems: FAQItem[] | null
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