import Link from 'next/link';
import type { Experience } from '@/types/experience';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/constants/categories';
import BookButton from '@/components/experiences/BookButton';

interface Props {
  experiences: Experience[];
  raceSlug: string;
}

export default function ExperienceSuggestions({ experiences, raceSlug }: Props) {
  if (experiences.length === 0) return null;

  return (
    <div>
      <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-[var(--text-tertiary)] mb-3">
        More Experiences
      </p>
      <div className="space-y-3">
        {experiences.map((exp) => {
          const color = CATEGORY_COLORS[exp.category] ?? '#6E6E82';
          return (
            <div
              key={exp.id}
              className="flex flex-col p-3 rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-medium)] hover:bg-[var(--bg-secondary)] transition-all duration-200 group"
            >
              <Link
                href={`/races/${raceSlug}/experiences/${exp.slug}`}
                className="flex items-start gap-3 mb-2"
              >
                <span className="text-2xl leading-none shrink-0 mt-0.5">{exp.imageEmoji}</span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-white transition-colors leading-snug line-clamp-2 mb-1">
                    {exp.title}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wide"
                      style={{ color }}
                    >
                      {CATEGORY_LABELS[exp.category]}
                    </span>
                    <span className="text-[var(--text-tertiary)] text-[10px]">·</span>
                    <span className="text-[10px] text-[var(--text-tertiary)]">{exp.priceLabel}</span>
                  </div>
                </div>
              </Link>
              <BookButton
                experience={exp}
                source="feed"
                label="Book →"
                className="w-full py-1.5 rounded-lg text-xs font-medium bg-[var(--accent-red)] hover:bg-[var(--accent-red-hover)] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
