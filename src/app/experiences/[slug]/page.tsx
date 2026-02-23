import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getExperienceBySlug } from '@/services/experience.service';
import BookButton from '@/components/experiences/BookButton';
import type { Experience } from '@/types/experience';

const CATEGORY_COLORS: Record<string, string> = {
  food: '#FF6B35',
  culture: '#A855F7',
  adventure: '#22C55E',
  daytrip: '#3B82F6',
  nightlife: '#EC4899',
};

const CATEGORY_LABELS: Record<string, string> = {
  food: 'Food & Drink',
  culture: 'Culture',
  adventure: 'Adventure',
  daytrip: 'Day Trip',
  nightlife: 'Nightlife',
};

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const exp = await getExperienceBySlug(slug);
  if (!exp) return {};

  const title = `${exp.title} | Australian Grand Prix 2026 Melbourne`;
  const description = exp.shortDescription
    ? `${exp.shortDescription} ${exp.priceLabel} · ${exp.durationLabel} · Perfect for the 2026 Melbourne F1 race weekend.`
    : `${exp.title} — ${exp.priceLabel} · ${exp.durationLabel} · A curated experience for the 2026 Australian Grand Prix weekend.`;
  const image = exp.photos?.[0] ?? null;
  const canonical = `https://pitlane.app/experiences/${exp.slug}`;
  const categoryLabel = CATEGORY_LABELS[exp.category] ?? exp.category;

  return {
    title,
    description,
    keywords: [
      exp.title,
      `${categoryLabel} Melbourne`,
      'Australian Grand Prix 2026',
      'F1 Melbourne race weekend',
      'Albert Park activities',
      'Melbourne Grand Prix experiences',
    ],
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Pitlane',
      type: 'website',
      ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: exp.title }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

function toISO8601Duration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `PT${m}M`;
  if (m === 0) return `PT${h}H`;
  return `PT${h}H${m}M`;
}

function buildJsonLd(exp: Experience) {
  const hasReviews = exp.reviewsSnapshot && exp.reviewsSnapshot.length > 0;

  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: exp.title,
    description: exp.description || exp.shortDescription,
    url: `https://pitlane.app/experiences/${exp.slug}`,
    priceRange: exp.priceLabel,
    touristType: ['Formula 1 race fan', 'Sports traveller'],
    duration: toISO8601Duration(exp.durationHours),
    location: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Melbourne',
        addressRegion: 'Victoria',
        addressCountry: 'AU',
      },
    },
    offers: {
      '@type': 'Offer',
      price: exp.priceAmount,
      priceCurrency: exp.priceCurrency,
      availability: 'https://schema.org/InStock',
      url: exp.affiliateUrl,
    },
  };

  if (exp.photos && exp.photos.length > 0) {
    ld.image = exp.photos;
  }

  if (exp.rating && exp.reviewCount) {
    ld.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: exp.rating.toFixed(1),
      reviewCount: exp.reviewCount,
      bestRating: '5',
    };
  }

  if (hasReviews) {
    ld.review = exp.reviewsSnapshot!.map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.author },
      reviewRating: { '@type': 'Rating', ratingValue: r.rating },
      reviewBody: r.text,
      ...(r.date ? { datePublished: r.date } : {}),
    }));
  }

  return ld;
}

function buildBreadcrumbLd(exp: Experience) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://pitlane.app' },
      { '@type': 'ListItem', position: 2, name: 'Experiences', item: 'https://pitlane.app/experiences' },
      { '@type': 'ListItem', position: 3, name: exp.title, item: `https://pitlane.app/experiences/${exp.slug}` },
    ],
  };
}

export default async function ExperienceDetailPage({ params }: Props) {
  const { slug } = await params;
  const exp = await getExperienceBySlug(slug);
  if (!exp) notFound();

  const color = CATEGORY_COLORS[exp.category] ?? '#6E6E82';
  const categoryLabel = CATEGORY_LABELS[exp.category] ?? exp.category;
  const heroImage = exp.photos?.[0] ?? exp.imageUrl;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(exp)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbLd(exp)) }}
      />

      <div className="min-h-screen pt-20 pb-24">
        {/* ── Hero ── */}
        <div className="relative h-72 sm:h-96 overflow-hidden">
          {heroImage ? (
            <Image
              src={heroImage}
              alt={exp.title}
              fill
              sizes="100vw"
              quality={90}
              className="object-cover"
              priority
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${color}40 0%, #15151E 55%, ${color}18 100%)`,
              }}
            >
              <span className="text-9xl select-none" style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.5))' }}>
                {exp.imageEmoji}
              </span>
            </div>
          )}
          {/* Bottom fade */}
          <div
            className="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
            style={{ background: 'linear-gradient(to top, #15151E 0%, transparent 100%)' }}
          />
          {/* Top colour strip */}
          <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: color }} />
        </div>

        {/* ── Photo strip (photos[1..4]) ── */}
        {exp.photos && exp.photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none">
            {exp.photos.slice(1, 5).map((url, idx) => (
              <a
                key={idx}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative flex-shrink-0 w-40 h-28 rounded-lg overflow-hidden border border-[var(--border-subtle)] hover:border-[var(--border-medium)] transition-colors"
              >
                <Image
                  src={url}
                  alt={`${exp.title} photo ${idx + 2}`}
                  fill
                  sizes="160px"
                  quality={80}
                  className="object-cover"
                />
              </a>
            ))}
          </div>
        )}

        {/* ── Content ── */}
        <div className="max-w-3xl mx-auto px-4 -mt-8 relative z-10">

          {/* Back link */}
          <Link
            href="/experiences"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-white transition-colors mb-6"
          >
            ← Back to Experiences
          </Link>

          {/* Badges */}
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <span
              className="text-xs font-medium px-3 py-1 rounded-full uppercase-badge"
              style={{ color, backgroundColor: `${color}25` }}
            >
              {categoryLabel}
            </span>
            {(exp.isFeatured || exp.tag) && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--accent-red)] text-white uppercase-badge">
                {exp.tag ?? 'Featured'}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white leading-tight mb-3">
            {exp.title}
          </h1>

          {/* Meta row */}
          <div className="flex items-center gap-5 text-sm text-[var(--text-secondary)] mb-6 flex-wrap">
            <span className="mono-data">⏱ {exp.durationLabel}</span>
            <span className="mono-data">
              ★ {exp.rating.toFixed(1)}{' '}
              <span className="text-[var(--text-muted)]">({exp.reviewCount.toLocaleString()} reviews)</span>
            </span>
          </div>

          {/* Price + Book CTA */}
          <div className="flex items-center justify-between gap-4 p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] mb-8">
            <div>
              <span className="text-3xl font-display font-bold text-white">{exp.priceLabel}</span>
              <span className="text-sm text-[var(--text-muted)] ml-2">per person</span>
            </div>
            <BookButton experience={exp} source="feed" />
          </div>

          {/* F1 Context — unique editorial paragraph */}
          {exp.f1Context && (
            <div className="mb-8 p-5 rounded-2xl border border-[var(--accent-red)]/30 bg-[var(--accent-red)]/8">
              <p className="text-xs font-bold uppercase-label text-[var(--accent-red)] mb-2">
                🏎 F1 Weekend Pick
              </p>
              <p className="text-[var(--text-secondary)] leading-relaxed">{exp.f1Context}</p>
            </div>
          )}

          {/* About */}
          {exp.description && (
            <section className="mb-8">
              <h2 className="font-display font-bold text-white text-xl mb-3">About this experience</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                {exp.description}
              </p>
            </section>
          )}

          {/* Highlights */}
          {exp.highlights && exp.highlights.length > 0 && (
            <section className="mb-8">
              <h2 className="font-display font-bold text-white text-xl mb-3">Highlights</h2>
              <ul className="space-y-2">
                {exp.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-3 text-[var(--text-secondary)]">
                    <span className="text-[var(--accent-teal)] mt-0.5 flex-shrink-0">✓</span>
                    <span className="leading-relaxed">{h}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Includes / Excludes */}
          {((exp.includes && exp.includes.length > 0) || (exp.excludes && exp.excludes.length > 0)) && (
            <section className="mb-8 grid sm:grid-cols-2 gap-6">
              {exp.includes && exp.includes.length > 0 && (
                <div>
                  <h3 className="font-medium text-white mb-3">What&apos;s included</h3>
                  <ul className="space-y-1.5">
                    {exp.includes.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                        <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {exp.excludes && exp.excludes.length > 0 && (
                <div>
                  <h3 className="font-medium text-white mb-3">Not included</h3>
                  <ul className="space-y-1.5">
                    {exp.excludes.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                        <span className="text-red-400 mt-0.5 flex-shrink-0">✕</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* Good to know */}
          {exp.importantInfo && (
            <section className="mb-8 p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
              <h2 className="font-display font-bold text-white text-lg mb-3">Good to know</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed text-sm whitespace-pre-line">
                {exp.importantInfo}
              </p>
            </section>
          )}

          {/* Getting there */}
          {exp.meetingPoint && (
            <section className="mb-8 p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
              <h2 className="font-display font-bold text-white text-lg mb-3">Getting there</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed text-sm mb-3">
                {exp.meetingPoint}
              </p>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(exp.meetingPoint)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-[var(--accent-teal)] hover:underline"
              >
                View on Google Maps →
              </a>
            </section>
          )}

          {/* Reviews */}
          {exp.reviewsSnapshot && exp.reviewsSnapshot.length > 0 && (
            <section className="mb-8">
              <h2 className="font-display font-bold text-white text-xl mb-4">Reviews</h2>
              <div className="space-y-4">
                {exp.reviewsSnapshot.map((review, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white text-sm">{review.author}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400 text-sm">{'★'.repeat(review.rating)}</span>
                        {review.date && (
                          <span className="text-xs text-[var(--text-muted)] ml-2">
                            {new Date(review.date).toLocaleDateString('en-AU', {
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{review.text}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Bottom Book CTA */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
            <div className="text-sm text-[var(--text-muted)]">
              Booked via GetYourGuide · Cancellation policies apply
            </div>
            <BookButton experience={exp} source="feed" />
          </div>
        </div>
      </div>
    </>
  );
}
