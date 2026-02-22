import Link from 'next/link';
import { formatTime } from '@/lib/utils';

interface Props {
  slug: string;
  label: string;
  description: string;
  maxDurationHours: number | null;
  count: number;
  startTime: string | null;
  endTime: string | null;
}

export default function GapCard({
  slug,
  label,
  description,
  maxDurationHours,
  count,
  startTime,
  endTime,
}: Props) {
  return (
    <Link href={`/experiences?window=${slug}`}>
      <div className="group p-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:border-[var(--accent-teal)]/50 hover:bg-[var(--bg-surface)] transition-all cursor-pointer">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-white group-hover:text-[var(--accent-teal)] transition-colors uppercase-heading">
              {label}
            </h3>
            {startTime && endTime && (
              <p className="text-xs text-[var(--text-tertiary)] mono-data mt-0.5">
                {formatTime(startTime)} – {formatTime(endTime)} AEDT
              </p>
            )}
            <p className="text-sm text-[var(--text-secondary)] mt-1.5 leading-snug">{description}</p>
          </div>
          <div className="shrink-0 text-right">
            <span className="text-2xl font-display font-black text-[var(--accent-teal)]">{count}</span>
            <p className="text-xs text-[var(--text-muted)]">
              {count === 1 ? 'experience' : 'experiences'}
            </p>
          </div>
        </div>
        {maxDurationHours && (
          <div className="mt-3 flex items-center gap-1.5">
            <span className="text-xs text-[var(--text-muted)]">⏱</span>
            <span className="text-xs text-[var(--text-muted)]">up to {maxDurationHours}h</span>
          </div>
        )}
      </div>
    </Link>
  );
}
