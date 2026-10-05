import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AuthorBox from '@/components/AuthorBox';
import Breadcrumb from '@/components/Breadcrumb';
import { AUTHORS, authorBySlug, authorLd, authorPath } from '@/data/authors';
import { EXPERT_GUIDES } from '@/data/expert-guides-2026';
import { seoExperiment } from '@/data/seo-experiments';

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return Object.keys(AUTHORS).map((slug) => ({ slug }));
}

/** Guides by this author that are on the site (their race runs the expert-guide test). */
function guidesBy(slug: string) {
  return Object.entries(EXPERT_GUIDES)
    .filter(([key, g]) => g.author === slug && seoExperiment(key)?.variant === 'expert-guide')
    .map(([key, g]) => ({ key, headline: g.headline, lastChecked: g.lastChecked }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const author = authorBySlug((await params).slug);
  if (!author) return {};
  const title = `${author.name}, F1 travel writer | F1 Weekend`;
  const description = `${author.name} researches and writes F1 Weekend's race travel guides. ${author.bio.split('. ')[0]}.`;
  const url = `https://f1weekend.co${authorPath(author)}`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'profile', images: [{ url: author.photo, width: 240, height: 240, alt: author.name }] },
  };
}

export default async function AuthorPage({ params }: Props) {
  const author = authorBySlug((await params).slug);
  if (!author) notFound();
  const guides = guidesBy(author.slug);
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: authorLd(author),
  };
  return (
    <div className="min-h-screen pt-24 pb-24 px-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="max-w-[70rem] mx-auto [&_p]:max-w-3xl">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Authors' }, { label: author.name }]} />
        <h1 className="font-display font-black text-4xl sm:text-5xl text-[var(--text-primary)] uppercase-heading mt-6 mb-8">{author.name}</h1>
        <AuthorBox author={author} linkName={false} className="mb-10" />
        <section aria-labelledby="guides-h">
          <h2 id="guides-h" className="font-display font-bold text-xl text-[var(--text-primary)] mb-4">Guides by {author.name.split(' ')[0]}</h2>
          {guides.length === 0 ? (
            <p className="text-[var(--text-secondary)]">Guides coming soon.</p>
          ) : (
            <ul className="space-y-3">
              {guides.map((g) => (
                <li key={g.key}>
                  <Link href={`/races/${g.key}`} className="block rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4 hover:border-[var(--accent-red)] transition-colors">
                    <span className="font-semibold text-[var(--text-primary)]">{g.headline}</span>
                    <span className="block text-sm text-[var(--text-secondary)] mt-1">Facts last checked {new Date(`${g.lastChecked}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
