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
  // A bare day (YYYY-MM-DD), e.g. when facts were last checked: no time of day.
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`));
  }
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'UTC' }).format(new Date(iso)) + ' UTC';
}

export default function PageByline({ updated, updatedLabel = 'Updated', sources, className = '', author }: {
  /** ISO time the page's data was last refreshed, or a bare day (YYYY-MM-DD). */
  updated?: string | null;
  updatedLabel?: string;
  sources: BylineSource[];
  className?: string;
  /** A named author instead of "the F1 Weekend team". */
  author?: { name: string; href: string };
}) {
  return (
    <p className={`text-xs text-[var(--text-secondary)] leading-relaxed ${className}`}>
      {author ? (
        <>By <a href={author.href} rel="author" className="underline underline-offset-2 hover:text-[var(--text-primary)]">{author.name}</a></>
      ) : (
        <>By the <a href="/about" className="underline underline-offset-2 hover:text-[var(--text-primary)]">F1 Weekend team</a></>
      )}
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
