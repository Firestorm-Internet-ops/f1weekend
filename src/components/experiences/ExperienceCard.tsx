'use client';

import type { Experience } from '@/types/experience';

const CATEGORY_COLORS: Record<string, string> = {
  food: '#FF6B35',
  culture: '#A855F7',
  adventure: '#22C55E',
  daytrip: '#3B82F6',
  nightlife: '#EC4899',
};

const CATEGORY_LABELS: Record<string, string> = {
  food: 'Food & Drink',
  culture: 'Culture',
  adventure: 'Adventure',
  daytrip: 'Day Trip',
  nightlife: 'Nightlife',
};

interface Props {
  experience: Experience;
  onBook: (id: number) => void;
  loading?: boolean;
}

export default function ExperienceCard({ experience, onBook, loading }: Props) {
  const color = CATEGORY_COLORS[experience.category] ?? '#6E6E82';
  const categoryLabel = CATEGORY_LABELS[experience.category] ?? experience.category;

  return (
    <div
      className="group rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] overflow-hidden hover:border-[var(--border-medium)] transition-all"
      style={{ animation: 'card-enter 250ms cubic-bezier(0.16, 1, 0.3, 1) both' }}
    >
      {/* ── Visual header ── */}
      <div className="relative h-44 overflow-hidden">
        {experience.imageUrl ? (
          <img
            src={experience.imageUrl}
            alt={experience.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center transition-transform duration-500 group-hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${color}30 0%, var(--bg-tertiary) 55%, ${color}12 100%)`,
            }}
          >
            <span
              className="text-7xl select-none"
              style={{ filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.4))' }}
            >
              {experience.imageEmoji}
            </span>
          </div>
        )}

        {/* Gradient fade to card body */}
        <div
          className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, var(--bg-secondary) 0%, transparent 100%)',
          }}
        />

        {/* Category colour strip at top */}
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: color }} />

        {/* Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          <span
            className="text-xs font-medium px-2.5 py-1 rounded-full uppercase-badge shadow-lg"
            style={{ color, backgroundColor: `${color}25`, backdropFilter: 'blur(4px)' }}
          >
            {categoryLabel}
          </span>
          {(experience.isFeatured || experience.tag) && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[var(--accent-red)] text-white uppercase-badge shadow-lg">
              {experience.tag ?? 'Featured'}
            </span>
          )}
        </div>
      </div>

      {/* ── Card body ── */}
      <div className="p-5 pt-3">
        {/* Title */}
        <h3 className="font-display font-bold text-white text-lg leading-snug mb-2">
          {experience.title}
        </h3>

        {/* Short description */}
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4 line-clamp-2">
          {experience.shortDescription}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-[var(--text-tertiary)] mb-4">
          <span className="mono-data">⏱ {experience.durationLabel}</span>
          <span className="mono-data">
            ★ {experience.rating.toFixed(1)}{' '}
            <span className="text-xs">({experience.reviewCount.toLocaleString()})</span>
          </span>
        </div>

        {/* Price + Book */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xl font-display font-bold text-white">{experience.priceLabel}</span>
            <span className="text-xs text-[var(--text-muted)] ml-1">per person</span>
          </div>
          <button
            onClick={() => onBook(experience.id)}
            disabled={loading}
            className="px-4 py-2 rounded-full text-sm font-medium bg-[var(--accent-red)] hover:bg-[var(--accent-red-hover)] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Opening…' : 'Book'}
          </button>
        </div>
      </div>
    </div>
  );
}
