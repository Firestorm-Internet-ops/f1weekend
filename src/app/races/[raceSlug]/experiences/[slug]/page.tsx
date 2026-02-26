import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { marked } from 'marked';
import { getExperienceBySlug, getExperiencesByRace } from '@/services/experience.service';
import { getRaceBySlug } from '@/services/race.service';
import BookButton from '@/components/experiences/BookButton';
import PhotoSlider from '@/components/experiences/PhotoSlider';
import Breadcrumb from '@/components/Breadcrumb';
import type { Experience } from '@/types/experience';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/constants/categories';
import { formatPrice } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ raceSlug: string; slug: string }>;
}

export async function generateStaticParams() {
  try {
    const race = await getRaceBySlug('melbourne-2026');
    if (!race) return [];
    const exps = await getExperiencesByRace(race.id);
    return exps.map((e) => ({ raceSlug: 'melbourne-2026', slug: e.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { raceSlug, slug } = await params;
  const exp = await getExperienceBySlug(slug);
  if (!exp) return {};

  const race = await getRaceBySlug(raceSlug);
  const canonical = `https://f1weekend.co/races/${raceSlug}/experiences/${exp.slug}`;
  const title = `${exp.title} | ${race?.name ?? 'F1 Weekend'}`;
  const description = exp.abstract
    ? `${exp.abstract} ${exp.priceLabel} · ${exp.durationLabel}.`
    : `${exp.title} — ${exp.priceLabel} · ${exp.durationLabel} · A curated experience for the ${race?.name ?? 'F1 race weekend'}.`;
  const image = exp.photos?.[0] ?? null;
  const categoryLabel = CATEGORY_LABELS[exp.category] ?? exp.category;

  return {
    title,
    description,
    keywords: [
      exp.title,
      `${categoryLabel} ${race?.city ?? 'F1'}`,
      race?.name ?? 'F1 2026',
      ...(exp.neighborhood ? [`${exp.neighborhood} ${race?.city ?? ''}`] : []),
      ...(exp.seoKeywords ?? []),
    ],
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'F1 Weekend',
      type: 'website',
      images: image
        ? [{ url: image, width: 1200, height: 630, alt: exp.title }]
        : [{ url: '/og.png', width: 1200, height: 630, alt: 'F1 Weekend' }],
    },
    twitter: { card: 'summary_large_image', title, description, images: image ? [image] : ['/og.png'] },
  };
}

function toISO8601Duration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `PT${m}M`;
  if (m === 0) return `PT${h}H`;
  return `PT${h}H${m}M`;
}

function buildJsonLd(exp: Experience, raceSlug: string) {
  const url = `https://f1weekend.co/races/${raceSlug}/experiences/${exp.slug}`;
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: exp.title,
    description: exp.abstract ?? exp.description ?? exp.shortDescription,
    url,
    sameAs: [exp.affiliateUrl],
    priceRange: exp.priceLabel,
    duration: toISO8601Duration(exp.durationHours),
    offers: {
      '@type': 'Offer',
      price: exp.priceAmount,
      priceCurrency: exp.priceCurrency,
      availability: 'https://schema.org/InStock',
      url: exp.affiliateUrl,
    },
  };
  if (exp.photos && exp.photos.length > 0) ld.image = exp.photos;
  if (exp.rating && exp.reviewCount) {
    ld.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: exp.rating.toFixed(1),
      reviewCount: exp.reviewCount,
      bestRating: '5',
    };
  }
  if (exp.reviewsSnapshot && exp.reviewsSnapshot.length > 0) {
    ld.review = exp.reviewsSnapshot.map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.author },
      reviewRating: { '@type': 'Rating', ratingValue: r.rating },
      reviewBody: r.text,
    }));
  }
  return ld;
}

function stripArticleFrontMatter(md: string): string {
  return md
    .split('\n')
    .filter(line =>
      !line.startsWith('# ') &&
      !line.startsWith('Meta description:') &&
      !line.startsWith('URL:') &&
      !line.startsWith('Category:')
    )
    .join('\n')
    .replace(/^\s+/, '');
}

export default async function ExperienceDetailPage({ params }: Props) {
  const { raceSlug, slug } = await params;
  const exp = await getExperienceBySlug(slug);
  if (!exp) notFound();

  const race = await getRaceBySlug(raceSlug);
  const color = CATEGORY_COLORS[exp.category] ?? '#6E6E82';
  const categoryLabel = CATEGORY_LABELS[exp.category] ?? exp.category;
  const guideHtml = exp.guideArticle ? await marked(stripArticleFrontMatter(exp.guideArticle)) : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(exp, raceSlug)) }}
      />

      <div className="min-h-screen pt-20 pb-24">
        <PhotoSlider photos={exp.photos} imageUrl={exp.imageUrl} title={exp.title} color={color} imageEmoji={exp.imageEmoji} />

        <div className="max-w-3xl mx-auto px-4 -mt-8 relative z-10">
          <Breadcrumb items={[
            { label: 'Home', href: '/' },
            { label: race?.city ?? 'Race', href: `/races/${raceSlug}` },
            { label: 'Experiences', href: `/races/${raceSlug}/experiences` },
            { label: exp.title },
          ]} />

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
            {exp.bestseller && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 uppercase-badge">
                🏆 Bestseller
              </span>
            )}
            {exp.skipTheLine && (
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-teal-500/20 text-teal-400 uppercase-badge">
                ⚡ Skip the Line
              </span>
            )}
            {exp.instantConfirmation && (
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 uppercase-badge">
                ✓ Instant Confirmation
              </span>
            )}
          </div>

          <h1 className="font-display font-black text-3xl sm:text-4xl text-white leading-tight mb-3">
            {exp.title}
          </h1>

          <div className="flex items-center gap-5 text-sm text-[var(--text-secondary)] mb-6 flex-wrap">
            <span className="mono-data">⏱ {exp.durationLabel}</span>
            <span className="mono-data">
              ★ {exp.rating.toFixed(1)}{' '}
              <span className="text-[var(--text-secondary)]">({exp.reviewCount.toLocaleString()} reviews)</span>
            </span>
            {exp.languages && exp.languages.length > 0 && (
              <span className="mono-data text-[var(--text-secondary)]">
                🌐 {exp.languages.map((l) => l.toUpperCase()).join(' · ')}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] mb-8">
            <div>
              <span className="text-3xl font-display font-bold text-white">{exp.priceLabel}</span>
              {exp.originalPrice && exp.discountPct && (
                <>
                  <span className="text-sm text-[var(--text-secondary)] line-through ml-2">
                    {formatPrice(Math.round(exp.originalPrice * 100), exp.priceCurrency)}
                  </span>
                  <span className="text-xs font-bold ml-2 text-green-400">Save {exp.discountPct}%</span>
                </>
              )}
              <span className="text-sm text-[var(--text-secondary)] ml-2">per person</span>
            </div>
            <BookButton experience={exp} source="feed" />
          </div>

          {exp.f1Context && (
            <div className="mb-8 p-5 rounded-2xl border border-[var(--accent-red)]/30 bg-[var(--accent-red)]/8">
              <p className="text-xs font-bold uppercase-label text-[var(--accent-red)] mb-2">
                🏎 F1 Weekend Pick
              </p>
              <p className="text-[var(--text-secondary)] leading-relaxed">{exp.f1Context}</p>
            </div>
          )}

          {(exp.description || exp.abstract) && (
            <section className="mb-8">
              <h2 className="font-display font-bold text-white text-xl mb-3">About this experience</h2>
              {exp.abstract && (
                <p className="text-[var(--text-secondary)] leading-relaxed font-medium mb-3">{exp.abstract}</p>
              )}
              {exp.description && (
                <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-line text-sm">
                  {exp.description}
                </p>
              )}
            </section>
          )}

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

          {exp.importantInfo && (
            <section className="mb-8 p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
              <h2 className="font-display font-bold text-white text-lg mb-3">Good to know</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed text-sm whitespace-pre-line">
                {exp.importantInfo}
              </p>
            </section>
          )}

          {exp.meetingPoint && (
            <section className="mb-8 p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
              <h2 className="font-display font-bold text-white text-lg mb-3">Getting there</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed text-sm mb-3">{exp.meetingPoint}</p>
              <a
                href={
                  exp.lat && exp.lng
                    ? `https://maps.google.com/?q=${exp.lat},${exp.lng}`
                    : `https://maps.google.com/?q=${encodeURIComponent(exp.meetingPoint)}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-[var(--accent-teal)] hover:underline"
              >
                View on Google Maps →
              </a>
            </section>
          )}

          {exp.reviewsSnapshot && exp.reviewsSnapshot.length > 0 && (
            <section className="mb-8">
              <h2 className="font-display font-bold text-white text-xl mb-1">Reviews</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                {exp.reviewCount.toLocaleString()} reviews on{' '}
                <a
                  href={exp.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="text-[var(--accent-teal)] hover:underline"
                >
                  GetYourGuide →
                </a>
              </p>
              <div className="space-y-4">
                {exp.reviewsSnapshot.map((review, i) => (
                  <div key={i} className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-white text-sm">{review.author}</span>
                        {review.country && (
                          <span className="text-sm text-[var(--text-secondary)] ml-1">· {review.country}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400 text-sm">{'★'.repeat(review.rating)}</span>
                        {review.date && (
                          <span className="text-sm text-[var(--text-secondary)] ml-2">
                            {new Date(review.date).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}
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

          {guideHtml && (
            <section aria-label="Expert Guide" className="mb-8">
              <h2 className="font-display font-bold text-white text-xl mb-4">Expert Guide</h2>
              <div className="guide-facts-bar">
                <span className="guide-fact">{exp.durationLabel}</span>
                <span className="guide-fact">{exp.priceLabel}</span>
                <span className="guide-fact">★ {exp.rating} ({exp.reviewCount.toLocaleString()} reviews)</span>
                {exp.f1WindowsLabel && (
                  <span className="guide-fact guide-fact--f1">Best: {exp.f1WindowsLabel}</span>
                )}
              </div>
              <article
                className="guide-article text-[var(--text-secondary)] leading-relaxed"
                dangerouslySetInnerHTML={{ __html: guideHtml }}
              />
            </section>
          )}

          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
            <div className="text-sm text-[var(--text-secondary)]">
              Booked via GetYourGuide · Cancellation policies apply
            </div>
            <BookButton experience={exp} source="feed" />
          </div>
        </div>
      </div>
    </>
  );
}
