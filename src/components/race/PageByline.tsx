/**
 * "By the F1 Weekend team · Updated … · Sources: …" — who is behind the page,
 * when its data was last refreshed (only when we actually know), and where the
 * facts come from. Trust signals for readers, search engines and AI answers.
 */
export interface BylineSource {
  label: string;
  url?: string;
}

function when(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'UTC' }).format(new Date(iso)) + ' UTC';
}

export default function PageByline({ updated, updatedLabel = 'Updated', sources, className = '' }: {
  /** ISO time the page's data was last refreshed. */
  updated?: string | null;
  updatedLabel?: string;
  sources: BylineSource[];
  className?: string;
}) {
  return (
    <p className={`text-xs text-[var(--text-secondary)] leading-relaxed ${className}`}>
      By the <a href="/about" className="underline underline-offset-2 hover:text-[var(--text-primary)]">F1 Weekend team</a>
      {updated && <> · {updatedLabel} <time dateTime={updated}>{when(updated)}</time></>}
      {sources.length > 0 && (
        <>
          {' · '}Sources:{' '}
          {sources.map((s, i) => (
            <span key={s.label}>
              {i > 0 && '; '}
              {s.url ? (
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-[var(--text-primary)]">{s.label}</a>
              ) : s.label}
            </span>
          ))}
        </>
      )}
    </p>
  );
}
