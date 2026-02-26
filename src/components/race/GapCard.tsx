import Link from 'next/link';
import { formatTime } from '@/lib/utils';
import type { ExperiencePreview } from '@/types/experience';

interface Props {
  slug: string;
  label: string;
  maxDurationHours: number | null;
  count: number;
  startTime: string | null;
  endTime: string | null;
  experiences: ExperiencePreview[];
  basePath?: string;
}

export default function GapCard({
  slug,
  label,
  maxDurationHours,
  count,
  startTime,
  endTime,
  experiences,
  basePath = '/experiences',
}: Props) {
  return (
    <Link href={`${basePath}?window=${slug}`}>
      <div className="group p-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:border-[var(--accent-teal)]/50 hover:bg-[var(--bg-surface)] transition-all cursor-pointer">
        {/* Header */}
        <h3 className="font-display font-bold text-white group-hover:text-[var(--accent-teal)] transition-colors uppercase-heading leading-tight">
          {label}
        </h3>

        {/* Subheader: time + duration inline */}
        {(startTime && endTime) || maxDurationHours ? (
          <p className="text-sm text-[var(--text-secondary)] mono-data mt-0.5">
            {startTime && endTime && (
              <>{formatTime(startTime)} – {formatTime(endTime)} AEDT</>
            )}
            {startTime && endTime && maxDurationHours && <span className="text-[var(--text-tertiary)]"> · </span>}
            {maxDurationHours && <>up to {maxDurationHours}h free</>}
          </p>
        ) : null}

        {/* Divider */}
        {experiences.length > 0 && (
          <div className="border-t border-[var(--border-subtle)] mt-3 mb-2" />
        )}

        {/* Experience rows */}
        {experiences.map((exp, i) => (
          <div key={i} className="flex items-center gap-2 py-1.5">
            <span className="w-6 text-base shrink-0">{exp.imageEmoji}</span>
            <span className="flex-1 truncate text-sm text-white">{exp.title}</span>
            <span className="text-sm text-[var(--text-secondary)] mono-data shrink-0">{exp.durationLabel}</span>
          </div>
        ))}

        {/* Footer */}
        <p className="text-xs font-medium text-[var(--accent-teal)] mt-3">
          View all {count} {count === 1 ? 'experience' : 'experiences'} →
        </p>
      </div>
    </Link>
  );
}
