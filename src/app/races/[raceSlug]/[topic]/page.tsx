import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import PageByline from '@/components/race/PageByline';
import ClusterNav from '@/components/race/ClusterNav';
import { FeedPicks } from '@/components/experiences/NearbyFeed';
import { clusterLinks, clusterPage, type ClusterPage } from '@/data/clusters-2026';
import { hasLiveExperiences } from '@/data/calendar-2026';
import { getRaceBySlug, getSessionsByRace, resolveRaceSlug } from '@/services/race.service';
import { getWeekendFeed } from '@/services/nearby-feed.service';
import { raceKey } from '@/lib/race-url';
import { webPageLd } from '@/lib/structured-data';
import type { Race } from '@/types/race';

/**
 * Focused pages of a race's topic cluster (SEO experiment,
 * src/data/seo-experiments.ts), e.g. /races/mexico/day-of-the-dead.
 * Any other race or path is a 404, so other races' pages stay unchanged.
 */
export const revalidate = 21600; // 6 h, like the experiences feed

interface Props {
  params: Promise<{ raceSlug: string; topic: string }>;
}

async function load(raceParam: string, topic: string): Promise<{ race: Race; page: ClusterPage } | null> {
  const raceSlug = (await resolveRaceSlug(raceParam)) ?? raceParam;
  const race = await getRaceBySlug(raceSlug);
  if (!race || race.rolledFrom) return null;
  const sessions = await getSessionsByRace(race.id);
  const page = clusterPage(raceKey(race.slug), topic, { race, sessions });
  return page ? { race, page } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { raceSlug, topic } = await params;
  const found = await load(raceSlug, topic);
  if (!found) return {};
  const { race, page } = found;
  const canonical = `https://f1weekend.co/races/${raceKey(race.slug)}/${page.topic}`;
  return {
    title: { absolute: `${page.title} | F1 Weekend` },
    description: page.description,
    alternates: { canonical },
    openGraph: { title: page.title, description: page.description, url: canonical, type: 'article' },
  };
}

export default async function ClusterTopicPage({ params }: Props) {
  const { raceSlug: raceParam, topic } = await params;
  const found = await load(raceParam, topic);
  if (!found) notFound();
  const { race, page } = found;
  const key = raceKey(race.slug);
  const links = clusterLinks(key) ?? [];
  const path = `/races/${key}/${page.topic}`;

  // Bookable products that match the page (e.g. Day of the Dead tours), most reviewed
  // first; the page's looser matches only fill the row when there are too few.
  const feed = page.feed && hasLiveExperiences(race.slug) ? await getWeekendFeed(race) : null;
  // Well-rated only (4.0+ when rated), best-rated first.
  const matching = (re: RegExp | undefined) => !feed || !re ? [] : feed.cards
    .filter((c) => c.nearby.tier !== 'too-far' && re.test(c.title) && (c.rating == null || c.rating >= 4))
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.reviewCount - a.reviewCount);
  const picks = [...new Map([...matching(page.feed?.match), ...matching(page.feed?.fill)].map((c) => [c.key, c])).values()]
    .slice(0, 3)
    // The session-gap label ("Fits Thursday…") ignores event dates like the 1–2 November vigils.
    .map((c) => (page.feed?.hideFits ? { ...c, fitsLabel: null } : c));

  const label = links.find((l) => l.path === page.topic)?.label ?? page.h1;
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://f1weekend.co' },
      { '@type': 'ListItem', position: 2, name: race.name, item: `https://f1weekend.co/races/${key}` },
      { '@type': 'ListItem', position: 3, name: label, item: `https://f1weekend.co${path}` },
    ],
  };
  // The questions on the page, with their direct answers.
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.sections.map((s) => ({ '@type': 'Question', name: s.q, acceptedAnswer: { '@type': 'Answer', text: s.answer } })),
  };

  return (
    <div className="min-h-screen pt-24 pb-24 px-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageLd(path, page.title, page.verified)) }} />
      {page.ld?.map((ld, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      ))}

      <div className="max-w-3xl mx-auto">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: race.name, href: `/races/${key}` },
          { label },
        ]} />

        <p className="text-xs font-medium uppercase-label text-[var(--accent-red)] mb-2 mt-6">
          {race.name} · Round {race.round} · {race.season}
        </p>
        <h1 className="font-display font-black text-4xl sm:text-5xl text-[var(--text-primary)] uppercase-heading leading-none mb-4">
          {page.h1}
        </h1>
        <p className="text-[var(--text-secondary)] text-lg leading-relaxed mb-3">{page.intro}</p>
        <PageByline className="mb-8" updated={page.verified} updatedLabel="Facts checked" sources={page.sources} />

        <nav aria-label="Questions on this page" className="mb-10 flex flex-wrap gap-2">
          {page.sections.map(({ id, q }) => (
            <a key={id} href={`#${id}`} className="text-xs px-3 py-1.5 rounded-full border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-medium)] transition-colors">
              {q}
            </a>
          ))}
        </nav>

        <div className="space-y-10">
          {page.sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <h2 className="font-display font-bold text-2xl text-[var(--text-primary)] mb-3">{s.q}</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">{s.answer}</p>
              {s.more?.map((p) => (
                <p key={p.slice(0, 32)} className="text-[var(--text-secondary)] leading-relaxed mt-3">{p}</p>
              ))}
              {s.items && (
                <dl className="mt-5 space-y-3">
                  {s.items.map((it) => (
                    <div key={it.name} className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                      <dt className="font-display font-bold text-[var(--text-primary)]">{it.name}</dt>
                      <dd className="text-sm text-[var(--text-secondary)] leading-relaxed mt-1">{it.detail}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </section>
          ))}
        </div>

        {picks.length > 0 && page.feed && (
          <FeedPicks
            picks={picks}
            raceSlug={race.slug}
            cities={[race.city]}
            id="cluster-picks-heading"
            heading={page.feed.heading}
            description={page.feed.description}
            className="mt-12 pt-8 border-t border-[var(--border-subtle)]"
          />
        )}

        <div className="mt-10">
          <Link
            href={`/races/${key}/experiences`}
            className="inline-block px-5 py-2.5 bg-[var(--accent-red)] hover:bg-[var(--accent-red-hover)] text-white font-semibold text-sm rounded-full transition-colors"
          >
            Everything to do in {race.city} on race&nbsp;weekend&nbsp;→
          </Link>
        </div>

        <ClusterNav links={links} raceKey={key} city={race.city} current={page.topic} className="mt-12 pt-8 border-t border-[var(--border-subtle)]" />
      </div>
    </div>
  );
}
