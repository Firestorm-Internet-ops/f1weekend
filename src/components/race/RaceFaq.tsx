import type { Faq } from '@/data/faqs-2026';

/**
 * Visible FAQ + its FAQPage structured data, built from the same list so the
 * schema never describes questions the page doesn't show.
 */
export default function RaceFaq({ items, heading = 'Frequently Asked Questions', className = '' }: {
  items: Faq[];
  heading?: string;
  className?: string;
}) {
  if (items.length === 0) return null;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
  return (
    <section className={className}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <h2 className="font-display font-black text-2xl text-[var(--text-primary)] uppercase-heading mb-8">{heading}</h2>
      <div className="space-y-4">
        {items.map(({ q, a }) => (
          <details key={q} className="group rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] overflow-hidden">
            <summary className="px-6 py-4 cursor-pointer font-bold text-[var(--text-primary)] list-none flex items-center justify-between gap-4 hover:bg-[var(--bg-surface)] transition-colors">
              <span>{q}</span>
              <span className="text-[var(--text-secondary)] group-open:rotate-180 transition-transform" aria-hidden>▾</span>
            </summary>
            <div className="px-6 pb-5 pt-2 text-[var(--text-secondary)] text-sm leading-relaxed border-t border-[var(--border-subtle)]">
              {a}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
