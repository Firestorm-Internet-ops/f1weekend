import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { marked } from 'marked';
import { getExperienceBySlug, getExperiencesByRace, getSuggestedExperiences } from '@/services/experience.service';
import { getRaceBySlug } from '@/services/race.service';
import BookButton from '@/components/experiences/BookButton';
import PhotoSlider from '@/components/experiences/PhotoSlider';
import Breadcrumb from '@/components/Breadcrumb';
import ExperienceTOC, { type TOCSection } from '@/components/experiences/ExperienceTOC';
import ExperienceSuggestions from '@/components/experiences/ExperienceSuggestions';
import OptionsPanel from '@/components/experiences/OptionsPanel';
import ReviewQuotes from '@/components/experiences/ReviewQuotes';
import StickyBookingBar from '@/components/experiences/StickyBookingBar';
import type { Experience } from '@/types/experience';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/constants/categories';
import { formatPrice } from '@/lib/utils';

export const revalidate = 86400; // 24 hours

interface Props {
  params: Promise<{ raceSlug: string; slug: string }>;
}

export async function generateStaticParams() {
  try {
    const slugs = ['melbourne-2026', 'shanghai-2026', 'japan-2026'];
    const results = await Promise.all(
      slugs.map(async (raceSlug) => {
        const race = await getRaceBySlug(raceSlug);
        if (!race) return [];
        const exps = await getExperiencesByRace(race.id);
        return exps.map((e) => ({ raceSlug, slug: e.slug }));
      })
    );
    return results.flat();
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
  const city = race?.city ?? 'Melbourne';
  const season = race?.season ?? '2026';
  const title = `${exp.title} — ${city} F1 ${season} Guide`;
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
      `${categoryLabel} ${city}`,
      race?.name ?? 'F1 2026',
      ...(exp.neighborhood ? [`${exp.neighborhood} ${city}`] : []),
      ...(exp.seoKeywords ?? []),
    ],
    alternates: { canonical },
    robots: { index: true, follow: true },
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

function buildJsonLd(exp: Experience, raceSlug: string, race: { city: string; country: string; countryCode: string } | null) {
  const url = `https://f1weekend.co/races/${raceSlug}/experiences/${exp.slug}`;
  const city = race?.city ?? 'Melbourne';
  const countryCode = race?.countryCode ?? 'AU';
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': ['TouristAttraction', 'Product'],
    name: exp.title,
    description: exp.abstract ?? exp.description ?? exp.shortDescription,
    url,
    sameAs: [exp.affiliateUrl],
    priceRange: exp.priceLabel,
    duration: toISO8601Duration(exp.durationHours),
    touristType: 'F1 race fan',
    containedInPlace: {
      '@type': 'City',
      name: city,
      addressCountry: countryCode,
    },
    offers: {
      '@type': 'Offer',
      price: exp.priceAmount.toFixed(2),
      priceCurrency: exp.priceCurrency,
      availability: 'https://schema.org/InStock',
      url: exp.affiliateUrl,
      seller: { '@type': 'Organization', name: 'GetYourGuide' },
    },
  };
  // Add geo coordinates only if lat is available (omit key entirely if not)
  if (exp.lat != null && exp.lng != null) {
    ld.geo = {
      '@type': 'GeoCoordinates',
      latitude: exp.lat,
      longitude: exp.lng,
    };
  }
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
    ld.review = exp.reviewsSnapshot.slice(0, 3).map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.author },
      reviewRating: { '@type': 'Rating', ratingValue: r.rating },
      reviewBody: r.text,
    }));
  }
  return ld;
}

// Category-level fallback F1 context copy used when exp.f1Context is null.
const CATEGORY_F1_CONTEXT: Record<string, string> = {
  food:      'A perfect fit for the F1 weekend — food experiences pair naturally with the session gaps, giving you a genuine taste of local culture between the action on track.',
  culture:   'Culture experiences like this one are ideal for free mornings before Friday practice or the quiet Sunday morning before the race — you get depth without eating into race day.',
  adventure: 'Adventure activities work best on Thursday before sessions begin or Sunday morning with an early return. Check the session windows above to find your best slot.',
  daytrip:   'Day trips from the race city work best on Thursday (full day) or Sunday morning with an early return before the race start. Book well in advance — these sell out fast during race week.',
  nightlife: 'Post-qualifying Saturday evenings and post-race Sunday evenings are the natural home for nightlife during an F1 weekend — the city energy is unmatched on those nights.',
};

/**
 * Returns exp.f1Context if populated, otherwise generates a contextual fallback
 * from f1WindowsLabel, durationLabel, neighborhood, and category.
 */
function resolveF1Context(exp: Experience): string | null {
  if (exp.f1Context) return exp.f1Context;

  const parts: string[] = [];

  if (exp.f1WindowsLabel) {
    parts.push(`Best during: ${exp.f1WindowsLabel}.`);
  }

  if (exp.neighborhood) {
    parts.push(`Located in ${exp.neighborhood}${exp.travelMins ? ` — about ${exp.travelMins} min from the city centre` : ''}.`);
  }

  const categoryFallback = CATEGORY_F1_CONTEXT[exp.category];
  if (categoryFallback) {
    parts.push(categoryFallback);
  }

  if (parts.length === 0) return null;
  return parts.join(' ');
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

  // Fetch suggested experiences in parallel with guide rendering
  const suggested = race ? await getSuggestedExperiences(race.id, slug, 4) : [];

  // Build TOC from visible sections
  const tocSections: TOCSection[] = [
    ...((exp.description || exp.abstract) ? [{ id: 'about', label: 'About' }] : []),
    ...(exp.highlights?.length ? [{ id: 'highlights', label: 'Highlights' }] : []),
    ...((exp.includes?.length || exp.excludes?.length) ? [{ id: 'includes', label: "What's Included" }] : []),
    ...(exp.importantInfo ? [{ id: 'good-to-know', label: 'Good to Know' }] : []),
    ...(exp.meetingPoint ? [{ id: 'getting-there', label: 'Getting There' }] : []),
    ...(exp.reviewsSnapshot?.length ? [{ id: 'reviews', label: 'Reviews' }] : []),
    ...(guideHtml ? [{ id: 'expert-guide', label: 'Expert Guide' }] : []),
  ];

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://f1weekend.co' },
      { '@type': 'ListItem', position: 2, name: race?.city ?? 'Race', item: `https://f1weekend.co/races/${raceSlug}` },
      { '@type': 'ListItem', position: 3, name: 'Experiences', item: `https://f1weekend.co/races/${raceSlug}/experiences` },
      { '@type': 'ListItem', position: 4, name: exp.title, item: `https://f1weekend.co/races/${raceSlug}/experiences/${exp.slug}` },
    ],
  };

  const faqLd = exp.faqItems && exp.faqItems.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: exp.faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  } : null;

  const f1ContextText = resolveF1Context(exp);

  // Consolidate all page schemas into single JSON-LD script tag
  const allSchemas = [buildJsonLd(exp, raceSlug, race), breadcrumbLd, ...(faqLd ? [faqLd] : [])];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(allSchemas) }}
      />

      <div className="min-h-screen pt-20 pb-24">
        <PhotoSlider photos={exp.photos} imageUrl={exp.imageUrl} title={exp.title} color={color} imageEmoji={exp.imageEmoji} />

        <div className="max-w-7xl mx-auto px-4 -mt-8 relative z-10">
          <div className="flex gap-8">

            {/* ── LEFT: Sticky TOC ───────────────────────────────────────── */}
            <aside className="hidden lg:block w-48 shrink-0">
              <div className="sticky top-24 pt-8">
                {tocSections.length > 0 && <ExperienceTOC sections={tocSections} />}
              </div>
            </aside>

            {/* ── CENTER: Main content ────────────────────────────────────── */}
            <div className="flex-1 min-w-0 max-w-2xl">
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
                {exp.hasPickUp && (
                  <span className="text-xs font-medium px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 uppercase-badge">
                    🚌 Hotel Pickup Available
                  </span>
                )}
                {exp.mobileVoucher && (
                  <span className="text-xs font-medium px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 uppercase-badge">
                    📱 Mobile Voucher
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

              {f1ContextText && (
                <div className="mb-6 p-5 rounded-2xl border border-[var(--accent-red)]/40 bg-[var(--accent-red)]/8">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <p className="text-xs font-bold uppercase-label text-[var(--accent-red)]">🏎 Why We Picked This</p>
                    {exp.tag && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent-red)]/20 text-[var(--accent-red)] uppercase-label tracking-widest">
                        {exp.tag}
                      </span>
                    )}
                  </div>
                  <p className="text-white leading-relaxed text-sm">{f1ContextText}</p>
                </div>
              )}

              <div id="top-book-cta" className="p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-display font-bold text-white">{exp.priceLabel}</span>
                    <span className="text-sm text-[var(--text-secondary)]">per person</span>
                  </div>
                  {exp.originalPrice && exp.discountPct && (
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">
                        Save {exp.discountPct}%
                      </span>
                      <span className="text-xs text-[var(--text-secondary)] line-through">
                        {formatPrice(Math.round(exp.originalPrice * 100), exp.priceCurrency)}
                      </span>
                    </div>
                  )}
                </div>
                {(exp.bestseller || exp.reviewCount >= 1000 || (exp.rating >= 4.8 && exp.reviewCount >= 200)) && (
                  <p className="text-xs text-[var(--text-secondary)] mb-3">
                    {exp.bestseller
                      ? '⚡ Race-week favourite — books out early'
                      : exp.reviewCount >= 1000
                      ? `🔥 Over ${exp.reviewCount.toLocaleString()} fans have done this`
                      : '⭐ Top-rated F1 experience in Melbourne'}
                  </p>
                )}
                {(!exp.bestseller && exp.reviewCount < 1000 && !(exp.rating >= 4.8 && exp.reviewCount >= 200)) && (
                  <p className="text-xs text-[var(--text-secondary)] mb-3">📅 Popular during Grand Prix week</p>
                )}
                <BookButton
                  experience={exp}
                  source="feed"
                  className="w-full py-3.5 rounded-xl font-semibold text-base bg-[var(--accent-red)] hover:bg-[var(--accent-red-hover)] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {exp.optionsSnapshot && exp.optionsSnapshot.length > 1 && (
                <OptionsPanel experience={exp} options={exp.optionsSnapshot} />
              )}

              <StickyBookingBar experience={exp} topCtaId="top-book-cta" />

              {(exp.description || exp.abstract) && (
                <section id="about" className="mb-8">
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
                <section id="highlights" className="mb-8">
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
                <section id="includes" className="mb-8 grid sm:grid-cols-2 gap-6">
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
                <section id="good-to-know" className="mb-8 p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                  <h2 className="font-display font-bold text-white text-lg mb-3">Good to know</h2>
                  <p className="text-[var(--text-secondary)] leading-relaxed text-sm whitespace-pre-line">
                    {exp.importantInfo}
                  </p>
                </section>
              )}

              {exp.meetingPoint && (
                <section id="getting-there" className="mb-8 p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
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
                <section id="reviews" className="mb-8">
                  <h2 className="font-display font-bold text-white text-xl mb-3">Reviews</h2>
                  <ReviewQuotes reviews={exp.reviewsSnapshot} />
                  <div className="flex items-center gap-3 mb-4">
                    <p className="text-sm text-[var(--text-secondary)]">
                      {exp.reviewCount.toLocaleString()} reviews on GetYourGuide
                    </p>
                    <BookButton
                      experience={exp}
                      source="guide"
                      label="Read all reviews on GetYourGuide →"
                      className="text-sm text-[var(--accent-teal)] hover:underline bg-transparent p-0 font-normal"
                    />
                  </div>
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
                <section id="expert-guide" aria-label="Expert Guide" className="mb-8">
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
                <BookButton experience={exp} source="guide" />
              </div>
            </div>

            {/* ── RIGHT: Suggested experiences ───────────────────────────── */}
            <aside className="hidden lg:block w-60 shrink-0">
              <div className="sticky top-24 pt-8">
                <ExperienceSuggestions experiences={suggested} raceSlug={raceSlug} />
              </div>
            </aside>

          </div>
        </div>
      </div>
    </>
  );
}
