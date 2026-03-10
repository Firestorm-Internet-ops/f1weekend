import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { marked } from 'marked';
import { getExperienceBySlug, getExperiencesByRace } from '@/services/experience.service';
import { getRaceBySlug, getActiveRace } from '@/services/race.service';
import BookButton from '@/components/experiences/BookButton';
import PhotoSlider from '@/components/experiences/PhotoSlider';
import Breadcrumb from '@/components/Breadcrumb';
import type { Experience } from '@/types/experience';
import type { Race } from '@/types/race';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/constants/categories';

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  try {
    const race = await getActiveRace();
    if (!race) return [];
    const exps = await getExperiencesByRace(race.id);
    return exps.map((e) => ({ slug: e.slug }));
  } catch {
    // DB unreachable at build time (e.g. Vercel build env) — pages are served dynamically
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [exp, race] = await Promise.all([
    getExperienceBySlug(slug),
    getActiveRace(),
  ]);
  if (!exp) return {};

  const raceSlug = race?.slug ?? '';
  const city = race?.city ?? '';
  const season = race?.season ?? '2026';

  const title = `${exp.title} | ${race?.name ?? ''} ${city}`;
  const description = exp.abstract
    ? `${exp.abstract} ${exp.priceLabel} · ${exp.durationLabel}.`
    : exp.shortDescription
      ? `${exp.shortDescription} ${exp.priceLabel} · ${exp.durationLabel} · Perfect for the ${season} ${city} F1 race weekend.`
      : `${exp.title} — ${exp.priceLabel} · ${exp.durationLabel} · A curated experience for the ${season} ${race?.name ?? ''} weekend.`;
  const image = exp.photos?.[0] ?? null;
  const canonical = raceSlug ? `https://f1weekend.co/races/${raceSlug}/experiences/${exp.slug}` : `https://f1weekend.co/experiences/${exp.slug}`;
  const categoryLabel = CATEGORY_LABELS[exp.category] ?? exp.category;

  return {
    title,
    description,
    keywords: [
      exp.title,
      `${categoryLabel} ${city}`,
      `${race?.name ?? ''} ${season}`,
      `F1 ${city} race weekend`,
      ...(exp.neighborhood ? [`${exp.neighborhood} ${city}`] : []),
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
      images: image ? [{ url: image, width: 1200, height: 630 }] : [],
    },
    twitter: { card: 'summary_large_image', title, description, images: image ? [image] : [] },
  };
}

interface Props {
  params: Promise<{ slug: string }>;
}

function toISO8601Duration(hours: number | null | string): string {
  const h = Math.floor(Number(hours ?? 0));
  const m = Math.round((Number(hours ?? 0) - h) * 60);
  if (h === 0) return `PT${m}M`;
  if (m === 0) return `PT${h}H`;
  return `PT${h}H${m}M`;
}

function buildJsonLd(exp: Experience, race: Race | null) {
  const hasReviews = exp.reviewsSnapshot && exp.reviewsSnapshot.length > 0;
  const raceSlug = race?.slug ?? '';
  const city = race?.city ?? '';
  const countryCode = race?.countryCode ?? '';

  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: exp.title,
    description: exp.abstract ?? exp.description ?? exp.shortDescription,
    url: raceSlug ? `https://f1weekend.co/races/${raceSlug}/experiences/${exp.slug}` : `https://f1weekend.co/experiences/${exp.slug}`,
    sameAs: [exp.affiliateUrl],
    priceRange: exp.priceLabel,
    touristType: ['Formula 1 race fan', 'Sports traveller'],
    duration: toISO8601Duration(exp.durationHours),
    location: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: city,
        addressCountry: countryCode,
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

  if (hasReviews && exp.rating) {
    ld.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: exp.rating,
      reviewCount: exp.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return ld;
}

function buildBreadcrumbLd(exp: Experience) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://f1weekend.co' },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Experiences',
        item: `https://f1weekend.co/experiences?category=${exp.category}`,
      },
      { '@type': 'ListItem', position: 3, name: exp.title },
    ],
  };
}

function buildFaqLd(exp: Experience) {
  if (!exp.faqItems || exp.faqItems.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: exp.faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

export default async function ExperienceDetailPage({ params }: Props) {
  const { slug } = await params;
  const [exp, race] = await Promise.all([
    getExperienceBySlug(slug),
    getActiveRace(),
  ]);
  if (!exp) notFound();

  const color = CATEGORY_COLORS[exp.category] ?? '#6E6E82';
  const categoryLabel = CATEGORY_LABELS[exp.category] ?? exp.category;
  const faqLd = buildFaqLd(exp);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(exp, race)) }}
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

      <div className="min-h-screen pt-24 pb-24 px-4 bg-[var(--bg-primary)]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Breadcrumb
              items={[
                { label: 'Home', href: '/' },
                { label: 'Experiences', href: '/experiences' },
                { label: categoryLabel, href: `/experiences?category=${exp.category}` },
                { label: exp.title },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left Column: Photos & Content */}
            <div className="lg:col-span-8">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                    style={{ backgroundColor: `${color}20`, color }}
                  >
                    {categoryLabel}
                  </span>
                  {exp.rating && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                      <span className="text-yellow-400">★</span>
                      <span className="text-sm font-medium text-white">{exp.rating}</span>
                      <span className="text-xs text-[var(--text-secondary)]">({exp.reviewCount})</span>
                    </div>
                  )}
                </div>

                <h1 className="font-display font-black text-4xl sm:text-5xl text-white uppercase-heading leading-tight mb-6">
                  {exp.title}
                </h1>

                {exp.abstract && (
                  <p className="text-xl text-[var(--text-secondary)] leading-relaxed font-medium mb-8 italic border-l-4 border-[var(--accent-teal)] pl-6">
                    {exp.abstract}
                  </p>
                )}
              </div>

              {exp.photos && exp.photos.length > 0 && (
                <div className="mb-12">
                  <PhotoSlider 
                    photos={exp.photos} 
                    imageUrl={exp.imageUrl}
                    title={exp.title} 
                    color={color}
                    imageEmoji={exp.imageEmoji}
                  />
                </div>
              )}

              <div className="prose prose-invert max-w-none">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <section>
                    <h2 className="font-display font-bold text-2xl text-white uppercase-heading mb-4">
                      The Experience
                    </h2>
                    <div
                      className="text-[var(--text-secondary)] leading-relaxed space-y-4"
                      dangerouslySetInnerHTML={{ __html: marked(exp.description || '') }}
                    />
                  </section>

                  <div className="space-y-12">
                    {exp.highlights && exp.highlights.length > 0 && (
                      <section>
                        <h2 className="font-display font-bold text-2xl text-white uppercase-heading mb-4">
                          Highlights
                        </h2>
                        <ul className="space-y-3">
                          {exp.highlights.map((h, i) => (
                            <li key={i} className="flex items-start gap-3 text-[var(--text-secondary)]">
                              <span className="text-[var(--accent-teal)] mt-1">✓</span>
                              <span>{h}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {exp.includes && exp.includes.length > 0 && (
                      <section>
                        <h2 className="font-display font-bold text-2xl text-white uppercase-heading mb-4">
                          What&apos;s Included
                        </h2>
                        <ul className="space-y-3">
                          {exp.includes.map((inc, i) => (
                            <li key={i} className="flex items-start gap-3 text-[var(--text-secondary)]">
                              <span className="text-[var(--accent-teal)] mt-1">✓</span>
                              <span>{inc}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                  </div>
                </div>

                {exp.f1Context && (
                  <section className="mt-16 p-8 rounded-2xl bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-primary)] border border-[var(--accent-red)]/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <span className="text-6xl">🏁</span>
                    </div>
                    <h2 className="font-display font-black text-2xl text-white uppercase-heading mb-4 flex items-center gap-3">
                      <span className="text-[var(--accent-red)]">F1</span> Weekend Context
                    </h2>
                    <div
                      className="text-[var(--text-secondary)] leading-relaxed italic relative z-10"
                      dangerouslySetInnerHTML={{ __html: marked(exp.f1Context) }}
                    />
                  </section>
                )}

                {exp.importantInfo && (
                  <section className="mt-16">
                    <h2 className="font-display font-bold text-2xl text-white uppercase-heading mb-4">
                      Important Information
                    </h2>
                    <div
                      className="text-[var(--text-secondary)] text-sm leading-relaxed p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]"
                      dangerouslySetInnerHTML={{ __html: marked(exp.importantInfo) }}
                    />
                  </section>
                )}
              </div>
            </div>

            {/* Right Column: Sticky Booking Widget */}
            <aside className="lg:col-span-4">
              <div className="sticky top-24 space-y-6">
                <div className="p-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] shadow-xl">
                  <div className="mb-6">
                    <p className="text-sm text-[var(--text-secondary)] uppercase-label mb-1">From</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-display font-black text-white">
                        {exp.priceLabel}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3 text-[var(--text-secondary)]">
                      <span className="text-xl">⏱</span>
                      <span className="text-sm">{exp.durationLabel}</span>
                    </div>
                    {exp.mobileVoucher && (
                      <div className="flex items-center gap-3 text-[var(--text-secondary)]">
                        <span className="text-xl">📱</span>
                        <span className="text-sm">Mobile voucher accepted</span>
                      </div>
                    )}
                    {exp.instantConfirmation && (
                      <div className="flex items-center gap-3 text-[var(--text-secondary)]">
                        <span className="text-xl">⚡️</span>
                        <span className="text-sm">Instant confirmation</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-[var(--text-secondary)]">
                      <span className="text-xl">🌍</span>
                      <span className="text-sm">Available in English</span>
                    </div>
                  </div>

                  <BookButton experience={exp} source="guide" />

                  <p className="mt-4 text-[10px] text-center text-[var(--text-secondary)]">
                    Secure booking via GetYourGuide · Free cancellation up to 24h before
                  </p>
                </div>

                {exp.meetingPoint && (
                  <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]">
                    <h3 className="font-display font-bold text-lg text-white uppercase-heading mb-3 flex items-center gap-2">
                      <span>📍</span> Meeting Point
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {exp.meetingPoint}
                    </p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
