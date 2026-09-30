import type { Answer } from '@/data/answers-2026';

/**
 * Answer-first block: each real search question is a heading with a short,
 * direct answer right under it (what snippets and AI answers quote), plus the
 * FAQPage schema for exactly these answers.
 */
export default function AnswerFirst({ answers, className = '' }: { answers: Answer[]; className?: string }) {
  if (answers.length === 0) return null;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: answers.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };
  return (
    <section className={className} aria-label="Quick answers">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <nav aria-label="Questions on this page" className="mb-6 flex flex-wrap gap-2">
        {answers.map(({ id, q }) => (
          <a key={id} href={`#${id}`} className="text-xs px-3 py-1.5 rounded-full border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-medium)] transition-colors">
            {q}
          </a>
        ))}
      </nav>
      <div className="space-y-6">
        {answers.map(({ id, q, a }) => (
          <article key={id} id={id} className="scroll-mt-24">
            <h2 className="font-display font-bold text-xl text-[var(--text-primary)] mb-2">{q}</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed max-w-3xl">{a}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
