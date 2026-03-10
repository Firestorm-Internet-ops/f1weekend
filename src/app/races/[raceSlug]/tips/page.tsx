import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import RaceSwitcher from '@/components/race/RaceSwitcher';
import { getRaceBySlug, getRaceContent, getAvailableRaces } from '@/services/race.service';

// Inline TipsContent type (was previously in src/data/race-content.ts)
interface TipsContent {
  meta: {
    title: string;
    description: string;
    keywords: string[];
  };
  heroSubtitle: string;
  categories: Array<{
    title: string;
    color: string;
    description: string;
    linkHref: string;
    linkLabel: string;
  }>;
  travelTips: Array<{
    heading: string;
    body: string;
  }>;
  gettingThere: {
    heading: string;
    intro: string;
    options: Array<{ icon: string; title: string; desc: string }>;
    fullGuideHref: string;
  };
  faq: Array<{ q: string; a: string }>;
}

export const revalidate = 604800; // 1 week

interface Props {
  params: Promise<{ raceSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { raceSlug } = await params;
  const [race, raceContentRow] = await Promise.all([
    getRaceBySlug(raceSlug),
    getRaceContent(raceSlug),
  ]);
  
  if (!race) return {};

  const tipsContent = raceContentRow?.tipsContent as TipsContent | null | undefined;
  const canonical = `https://f1weekend.co/races/${raceSlug}/tips`;

  if (!tipsContent || !tipsContent.meta) {
    return {
      title: `${race.city} F1 Travel Tips & FAQ | F1 Weekend`,
      description: `Everything you need to know for your ${race.city} F1 race weekend. Local tips, FAQ, and transport guides.`,
      alternates: { canonical },
    };
  }

  return {
    title: tipsContent.meta.title,
    description: tipsContent.meta.description,
    alternates: { canonical },
    keywords: tipsContent.meta.keywords,
    openGraph: {
      title: tipsContent.meta.title,
      description: tipsContent.meta.description,
      url: canonical,
      type: 'website',
    },
  };
}

export default async function TipsPage({ params }: Props) {
  const { raceSlug } = await params;
  const [raceContentRow, race, availableRaces] = await Promise.all([
    getRaceContent(raceSlug),
    getRaceBySlug(raceSlug),
    getAvailableRaces(),
  ]);
  const tipsContent = raceContentRow?.tipsContent as TipsContent | null | undefined;
  if (!tipsContent) notFound();
  if (!race) notFound();

  const faqLd = (tipsContent.faq && tipsContent.faq.length > 0) ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: tipsContent.faq.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  } : null;

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://f1weekend.co' },
      { '@type': 'ListItem', position: 2, name: race.name, item: `https://f1weekend.co/races/${raceSlug}` },
      { '@type': 'ListItem', position: 3, name: 'Tips & FAQ', item: `https://f1weekend.co/races/${raceSlug}/tips` },
    ],
  };

  return (
    <div className="min-h-screen pt-24 pb-24 px-4">
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="max-w-3xl mx-auto">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: race.name, href: `/races/${raceSlug}` },
          { label: 'Tips & FAQ' },
        ]} />

        <RaceSwitcher currentRace={race} availableRaces={availableRaces} pageType="tips" />

        <p className="text-xs font-medium uppercase-label text-[var(--accent-red)] mb-2 tracking-widest">
          Round {race.round} · {race.season} Season
        </p>
        <h1 className="font-display font-black text-4xl sm:text-5xl text-white uppercase-heading leading-none mb-3">
          {race.city} F1<br />
          <span className="text-[var(--accent-teal)]">Tips &amp; FAQ</span>
        </h1>
        <p className="text-[var(--text-secondary)] text-lg mb-10">
          {tipsContent.heroSubtitle ?? `Everything you need to know for your ${race.city} F1 race weekend.`}
        </p>

        {/* Experiences by Category */}
        {tipsContent.categories && tipsContent.categories.length > 0 && (
          <section className="mb-12">
            <h2 className="font-display font-bold text-2xl text-white uppercase-heading mb-4">
              Experiences by Category
            </h2>
            <div className="space-y-8">
              {tipsContent.categories.map(({ title, color, description, linkHref, linkLabel }) => (
                <div key={title}>
                  <h3 className="font-display font-bold text-lg mb-3" style={{ color }}>
                    {title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
                    {description}
                  </p>
                  <Link href={linkHref} className="text-sm font-medium text-[var(--accent-teal)] hover:text-white transition-colors">
                    {linkLabel}
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Travel Tips */}
        {tipsContent.travelTips && tipsContent.travelTips.length > 0 && (
          <section className="mb-12 border-t border-[var(--border-subtle)] pt-10">
            <h2 className="font-display font-bold text-2xl text-white uppercase-heading mb-6">
              {race.city} Travel Tips
            </h2>
            <div className="space-y-4">
              {tipsContent.travelTips.map(({ heading, body }) => (
                <div key={heading} className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                  <p className="font-medium text-white mb-2">{heading}</p>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Getting There */}
        {tipsContent.gettingThere && (
          <section className="mb-12 border-t border-[var(--border-subtle)] pt-10">
            <h2 className="font-display font-bold text-2xl text-white uppercase-heading mb-4">
              {tipsContent.gettingThere.heading}
            </h2>
            <p className="text-[var(--text-secondary)] text-base leading-relaxed mb-4">
              {tipsContent.gettingThere.intro}
            </p>
            <div className="space-y-3 mb-6">
              {tipsContent.gettingThere.options?.map(({ icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4 p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                  <span className="text-xl mt-0.5 shrink-0">{icon}</span>
                  <div>
                    <p className="font-medium text-white mb-1">{title}</p>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            {tipsContent.gettingThere.fullGuideHref && (
              <Link
                href={tipsContent.gettingThere.fullGuideHref}
                className="text-sm font-medium text-[var(--accent-teal)] hover:text-white transition-colors"
              >
                Full transport guide →
              </Link>
            )}
          </section>
        )}

        {/* FAQ */}
        {tipsContent.faq && tipsContent.faq.length > 0 && (
          <section className="border-t border-[var(--border-subtle)] pt-10">
            <h2 className="font-display font-bold text-2xl text-white uppercase-heading mb-6">
              Frequently Asked Questions
            </h2>
            {tipsContent.faq.map(({ q, a }) => (
              <details key={q} className="border-b border-[var(--border-subtle)] py-4">
                <summary className="font-display font-bold text-white cursor-pointer list-none flex items-center justify-between gap-2">
                  {q}
                  <span className="text-[var(--text-secondary)] text-sm shrink-0">+</span>
                </summary>
                <p className="text-[var(--text-secondary)] text-sm mt-3 leading-relaxed">{a}</p>
              </details>
            ))}
          </section>
        )}

        {/* CTA */}
        <div className="mt-12 pt-8 border-t border-[var(--border-subtle)] flex flex-wrap gap-4">
          <Link
            href={`/races/${raceSlug}/experiences`}
            className="px-5 py-2.5 bg-[var(--accent-teal)] hover:bg-[var(--accent-teal-hover)] text-[var(--bg-primary)] font-semibold text-sm rounded-full transition-colors"
          >
            Browse All Experiences
          </Link>
          <Link
            href={`/races/${raceSlug}/schedule`}
            className="px-5 py-2.5 border border-white/20 hover:border-white/40 text-white hover:bg-white/5 font-semibold text-sm rounded-full transition-colors"
          >
            View Full Schedule
          </Link>
        </div>
      </div>
    </div>
  );
}
