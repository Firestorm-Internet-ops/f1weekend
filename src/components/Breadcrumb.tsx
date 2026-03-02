import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  const last = items[items.length - 1];
  const secondLast = items.length >= 2 ? items[items.length - 2] : null;

  return (
    <nav aria-label="breadcrumb" className="mb-6 text-sm text-[var(--text-secondary)]">
      {/* Mobile: show ← Parent / Current only */}
      <div className="flex items-center gap-1.5 sm:hidden">
        {secondLast && (
          <>
            <span className="text-xs">←</span>
            {secondLast.href ? (
              <Link href={secondLast.href} className="hover:text-white transition-colors shrink-0">
                {secondLast.label}
              </Link>
            ) : (
              <span>{secondLast.label}</span>
            )}
            <span aria-hidden="true">/</span>
          </>
        )}
        <span className="text-[var(--text-secondary)] truncate min-w-0" aria-current="page">
          {last.label}
        </span>
      </div>

      {/* Desktop: show full breadcrumb */}
      <div className="hidden sm:flex items-center gap-1.5 flex-wrap">
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden="true">/</span>}
            {item.href ? (
              <Link href={item.href} className="hover:text-white transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-[var(--text-secondary)]" aria-current="page">{item.label}</span>
            )}
          </span>
        ))}
      </div>
    </nav>
  );
}
