import AuthorBox from '@/components/AuthorBox';
import { FeedPicks } from '@/components/experiences/NearbyFeed';
import type { Author } from '@/data/authors';
import type { ExpertGuide as Guide, GuideBlock } from '@/data/expert-guides-2026';
import type { FeedCard } from '@/lib/providers/nearby-feed';

const h2 = 'font-display font-bold text-2xl text-[var(--text-primary)] mb-4 scroll-mt-24';

function Block({ b }: { b: GuideBlock }) {
  if ('p' in b) return <p className="text-[var(--text-secondary)] leading-relaxed mb-4">{b.p}</p>;
  if ('ul' in b) {
    return (
      <ul className="list-disc pl-5 space-y-2 text-[var(--text-secondary)] leading-relaxed mb-4 marker:text-[var(--accent-red)]">
        {b.ul.map((li) => <li key={li}>{li}</li>)}
      </ul>
    );
  }
  if ('note' in b) {
    return <p className="rounded-xl border-l-4 border-[var(--accent-red)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-secondary)] leading-relaxed mb-4">{b.note}</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)] mb-4">
      <table className="w-full text-sm">
        {b.table.caption && <caption className="text-left font-medium text-[var(--text-primary)] px-3 pt-3 pb-1">{b.table.caption}</caption>}
        <thead className="text-left text-[var(--text-secondary)]">
          <tr>{b.table.head.map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody>
          {b.table.rows.map((r) => (
            <tr key={r.join('|')} className="border-t border-[var(--border-subtle)]">
              {r.map((c, i) => <td key={i} className={`px-3 py-2 ${i === 0 ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)]'}`}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * The long-form guide (SEO experiment "expert-guide"): contents, sections
 * with their sources, bookable tours where a section is about them, and the
 * author box at the end.
 */
export default function ExpertGuide({ guide, author, raceSlug, city, tours, className = '' }: {
  guide: Guide;
  author: Author;
  raceSlug: string;
  city: string;
  /** Bookable tours per section id (from the live feed). */
  tours: Record<string, FeedCard[]>;
  className?: string;
}) {
  return (
    <article className={className} aria-labelledby="guide-heading">
      <h2 id="guide-heading" className="font-display font-black text-3xl text-[var(--text-primary)] mb-4">{guide.headline}</h2>
      <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-8">{guide.intro}</p>

      <nav aria-label="In this guide" className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5 mb-10">
        <p className="text-xs font-semibold uppercase-label tracking-widest text-[var(--text-secondary)] mb-3">In this guide</p>
        <ol className="grid sm:grid-cols-2 gap-x-8 gap-y-2 list-decimal pl-5 text-sm marker:text-[var(--text-muted)]">
          {guide.sections.map((s) => (
            <li key={s.id}><a href={`#${s.id}`} className="text-[var(--text-primary)] hover:text-[var(--accent-red)] hover:underline">{s.heading}</a></li>
          ))}
        </ol>
      </nav>

      {guide.sections.map((s) => (
        <section key={s.id} id={s.id} className="mb-12 scroll-mt-24" aria-labelledby={`${s.id}-h`}>
          <h2 id={`${s.id}-h`} className={h2}>{s.heading}</h2>
          {s.blocks.map((b, i) => <Block key={i} b={b} />)}
          {(tours[s.id]?.length ?? 0) > 0 && (
            <FeedPicks
              id={`${s.id}-tours`}
              picks={tours[s.id]}
              raceSlug={raceSlug}
              cities={[city]}
              heading="Book one of these"
              description="Well reviewed, and back in time for the evening sessions."
              className="mt-6 mb-4"
            />
          )}
          {s.sources.length > 0 && (
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Sources:{' '}
              {s.sources.map((src, i) => (
                <span key={src.label}>
                  {i > 0 && ' · '}
                  {src.url ? <a href={src.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-[var(--text-primary)]">{src.label}</a> : src.label}
                </span>
              ))}
            </p>
          )}
        </section>
      ))}

      <AuthorBox author={author} />
    </article>
  );
}
