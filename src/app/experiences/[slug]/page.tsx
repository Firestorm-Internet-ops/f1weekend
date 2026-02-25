import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { marked } from 'marked';
import { getExperienceBySlug, getExperiencesByRace } from '@/services/experience.service';
import { getRaceBySlug } from '@/services/race.service';
import BookButton from '@/components/experiences/BookButton';
import PhotoSlider from '@/components/experiences/PhotoSlider';
import Breadcrumb from '@/components/Breadcrumb';
import type { Experience } from '@/types/experience';

export const dynamic = 'force-dynamic';

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

export async function generateStaticParams() {
  try {
    const race = await getRaceBySlug('melbourne-2026');
    if (!race) return [];
    const exps = await getExperiencesByRace(race.id);
    return exps.map((e) => ({ slug: e.slug }));
  } catch {
    // DB unreachable at build time (e.g. Vercel build env) — pages are served dynamically
    return [];
  }
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const exp = await getExperienceBySlug(slug);
  if (!exp) return {};

  const title = `${exp.title} | Australian Grand Prix 2026 Melbourne`;
  const description = exp.abstract
    ? `${exp.abstract} ${exp.priceLabel} · ${exp.durationLabel}.`
    : exp.shortDescription
      ? `${exp.shortDescription} ${exp.priceLabel} · ${exp.durationLabel} · Perfect for the 2026 Melbourne F1 race weekend.`
      : `${exp.title} — ${exp.priceLabel} · ${exp.durationLabel} · A curated experience for the 2026 Australian Grand Prix weekend.`;
  const image = exp.photos?.[0] ?? null;
  const canonical = `https://f1weekend.co/experiences/${exp.slug}`;
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
      'near Albert Park',
      ...(exp.neighborhood ? [`${exp.neighborhood} Melbourne`] : []),
      ...(exp.f1WindowsLabel ? [`things to do ${exp.f1WindowsLabel} F1`] : []),
      ...(exp.seoKeywords ?? []),
      ...(exp.gygCategories ?? []),
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
        : [{ url: '/og.png', width: 1200, height: 630, alt: 'F1 Weekend — F1 Race Weekend Companion' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : ['/og.png'],
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
    description: exp.abstract ?? exp.description ?? exp.shortDescription,
    url: `https://f1weekend.co/experiences/${exp.slug}`,
    sameAs: [exp.affiliateUrl],
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
      geo: {
        '@type': 'GeoCoordinates',
        latitude: -37.8136,
        longitude: 144.9631,
      },
    },
    offers: {
      '@type': 'Offer',
      price: exp.priceAmount,
      priceCurrency: exp.priceCurrency,
      availability: 'https://schema.org/InStock',
      url: exp.affiliateUrl,
      validFrom: '2026-02-01',
      validThrough: '2026-03-08T23:59:59+11:00',
      category: 'F1 Race Weekend Activity',
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
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://f1weekend.co' },
      { '@type': 'ListItem', position: 2, name: 'Experiences', item: 'https://f1weekend.co/experiences' },
      { '@type': 'ListItem', position: 3, name: exp.title, item: `https://f1weekend.co/experiences/${exp.slug}` },
    ],
  };
}

function buildArticleLd(exp: Experience) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${exp.title} — Complete F1 Weekend Guide`,
    author: { '@type': 'Organization', name: 'F1 Weekend' },
    publisher: { '@type': 'Organization', name: 'F1 Weekend', url: 'https://f1weekend.co' },
    datePublished: '2026-02-24',
    dateModified: '2026-02-24',
    url: `https://f1weekend.co/experiences/${exp.slug}`,
    about: {
      '@type': 'TouristAttraction',
      name: exp.title,
      url: `https://f1weekend.co/experiences/${exp.slug}`,
    },
    ...(exp.photos?.[0] ? { image: exp.photos[0] } : {}),
  };
}

function buildFaqLd(exp: Experience) {
  const pairs: { q: string; a: string }[] = [];

  if (exp.highlights && exp.highlights.length > 0) {
    pairs.push({
      q: `What are the highlights of ${exp.title}?`,
      a: exp.highlights.join(' · '),
    });
  }
  if (exp.includes && exp.includes.length > 0) {
    pairs.push({
      q: "What's included?",
      a: exp.includes.join(', '),
    });
  }
  if (exp.excludes && exp.excludes.length > 0) {
    pairs.push({
      q: "What's not included?",
      a: exp.excludes.join(', '),
    });
  }
  if (exp.f1Context) {
    pairs.push({
      q: 'Why is this a good pick for the F1 Melbourne race weekend?',
      a: exp.f1Context,
    });
  }
  if (exp.importantInfo) {
    pairs.push({
      q: `What should I know before booking ${exp.title}?`,
      a: exp.importantInfo,
    });
  }
  if (exp.f1WindowsLabel) {
    pairs.push({
      q: 'When can I do this during the 2026 Australian Grand Prix weekend?',
      a: exp.f1WindowsLabel,
    });
  }

  if (pairs.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: pairs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

export default async function ExperienceDetailPage({ params }: Props) {
  const { slug } = await params;
  const exp = await getExperienceBySlug(slug);
  if (!exp) notFound();

  const color = CATEGORY_COLORS[exp.category] ?? '#6E6E82';
  const categoryLabel = CATEGORY_LABELS[exp.category] ?? exp.category;
  const faqLd = buildFaqLd(exp);

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

  const guideHtml = exp.guideArticle ? await marked(stripArticleFrontMatter(exp.guideArticle)) : null;

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
      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}
      {exp.guideArticle && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildArticleLd(exp)) }}
        />
      )}

      <div className="min-h-screen pt-20 pb-24">
        {/* ── Photo Slider ── */}
        <PhotoSlider
          photos={exp.photos}
          title={exp.title}
          color={color}
          imageEmoji={exp.imageEmoji}
        />

        {/* ── Content ── */}
        <div className="max-w-3xl mx-auto px-4 -mt-8 relative z-10">

          {/* Breadcrumb */}
          <Breadcrumb items={[
            { label: 'Home', href: '/' },
            { label: 'Experiences', href: '/experiences' },
            { label: exp.title },
          ]} />

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

          {/* Title */}
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white leading-tight mb-3">
            {exp.title}
          </h1>

          {/* Meta row */}
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

          {/* Price + Book CTA */}
          <div className="flex items-center justify-between gap-4 p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] mb-8">
            <div>
              <span className="text-3xl font-display font-bold text-white">{exp.priceLabel}</span>
              {exp.originalPrice && exp.discountPct && (
                <>
                  <span className="text-sm text-[var(--text-secondary)] line-through ml-2">
                    A${exp.originalPrice.toFixed(0)}
                  </span>
                  <span className="text-xs font-bold ml-2 text-green-400">Save {exp.discountPct}%</span>
                </>
              )}
              <span className="text-sm text-[var(--text-secondary)] ml-2">per person</span>
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
          {(exp.description || exp.abstract) && (
            <section className="mb-8">
              <h2 className="font-display font-bold text-white text-xl mb-3">About this experience</h2>
              {exp.abstract && (
                <p className="text-[var(--text-secondary)] leading-relaxed font-medium mb-3">
                  {exp.abstract}
                </p>
              )}
              {exp.description && (
                <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-line text-sm">
                  {exp.description}
                </p>
              )}
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

          {/* Tour Options */}
          {exp.optionsSnapshot && exp.optionsSnapshot.length > 1 && (
            <section className="mb-8">
              <h2 className="font-display font-bold text-white text-xl mb-4">Tour Options</h2>
              <div className="space-y-3">
                {exp.optionsSnapshot.map((opt, i) => (
                  <a
                    key={i}
                    href={exp.affiliateUrl}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="block p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:border-[var(--border-medium)] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm leading-snug mb-1">{opt.title}</p>
                        {opt.description && (
                          <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                            {opt.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {opt.skipTheLine && (
                            <span className="text-xs px-2 py-0.5 rounded bg-teal-500/15 text-teal-400">⚡ Skip line</span>
                          )}
                          {opt.instantConfirmation && (
                            <span className="text-xs px-2 py-0.5 rounded bg-blue-500/15 text-blue-400">✓ Instant</span>
                          )}
                          {opt.languages.slice(0, 3).map((lang) => (
                            <span key={lang} className="text-xs px-2 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-secondary)] uppercase">
                              {lang}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-bold text-white text-sm">
                          {exp.priceCurrency === 'AUD' ? 'A$' : '$'}{opt.price.toFixed(0)}
                        </span>
                        <p className="text-sm text-[var(--text-secondary)]">per person</p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
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

          {/* Logistics */}
          {(exp.hasPickUp !== null || exp.mobileVoucher !== null) && (
            <section className="mb-8 p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
              <h2 className="font-display font-bold text-white text-lg mb-3">Logistics</h2>
              <div className="grid grid-cols-2 gap-3">
                {exp.hasPickUp !== null && (
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <span>{exp.hasPickUp ? '✓' : '✕'}</span>
                    <span>Hotel pickup</span>
                  </div>
                )}
                {exp.mobileVoucher !== null && (
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <span>{exp.mobileVoucher ? '✓' : '✕'}</span>
                    <span>Mobile voucher</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Reviews */}
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
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]"
                  >
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

          {/* Expert Guide — long-form editorial from f1-city-explorer-seo */}
          {guideHtml && (
            <section aria-label="Expert Guide" className="mb-8">
              <h2 className="font-display font-bold text-white text-xl mb-4">Expert Guide</h2>
              <div className="guide-facts-bar">
                <span className="guide-fact">{exp.durationLabel}</span>
                <span className="guide-fact">{exp.priceLabel}</span>
                <span className="guide-fact">★ {exp.rating} ({exp.reviewCount.toLocaleString()} reviews)</span>
                {exp.travelMins && (
                  <span className="guide-fact">{exp.travelMins} min from circuit</span>
                )}
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

          {/* Bottom Book CTA */}
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
