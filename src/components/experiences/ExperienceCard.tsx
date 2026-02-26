'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Experience } from '@/types/experience';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/constants/categories';

interface Props {
  experience: Experience;
  onBook: (id: number) => void;
  loading?: boolean;
  index?: number;
  detailHref?: string;
}

export default function ExperienceCard({ experience, onBook, loading, index = 0, detailHref }: Props) {
  const color = CATEGORY_COLORS[experience.category] ?? '#6E6E82';
  const categoryLabel = CATEGORY_LABELS[experience.category] ?? experience.category;
  const href = detailHref ?? `/experiences/${experience.slug}`;

  return (
    <div
      className="group rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] overflow-hidden hover:border-[var(--border-medium)] transition-all duration-300 hover:-translate-y-1"
      style={{
        animation: 'card-enter 350ms cubic-bezier(0.16, 1, 0.3, 1) both',
        animationDelay: `${index * 50}ms`,
      }}
    >
      {/* ── Visual header (links to detail page) ── */}
      <Link href={href} className="block">
        <div className="relative h-60 overflow-hidden">
          {experience.imageUrl ? (
            <Image
              src={experience.imageUrl}
              alt={experience.title}
              fill
              unoptimized
              referrerPolicy="no-referrer"
              sizes="(max-width: 640px) 100vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
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
              style={{ color, backgroundColor: 'rgba(15,15,30,0.72)', border: `1px solid ${color}55`, backdropFilter: 'blur(8px)' }}
            >
              {categoryLabel}
            </span>
            <div className="flex items-start gap-1.5 flex-wrap justify-end">
              {(experience.isFeatured || experience.tag) && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[var(--accent-red)] text-white uppercase-badge shadow-lg">
                  {experience.tag ?? 'Featured'}
                </span>
              )}
              {experience.bestseller && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-400 uppercase-badge shadow-lg backdrop-blur-sm">
                  🏆 Best
                </span>
              )}
              {experience.skipTheLine && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-teal-500/25 text-teal-400 uppercase-badge shadow-lg backdrop-blur-sm">
                  ⚡ Skip line
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* ── Card body ── */}
      <div className="p-5 pt-3">
        {/* Title (links to detail page) */}
        <Link href={href}>
          <h3 className="font-display font-bold text-white text-xl leading-snug mb-2 hover:text-[var(--accent-teal)] transition-colors">
            {experience.title}
          </h3>
        </Link>

        {/* Short description */}
        <p className="text-base text-[var(--text-secondary)] leading-relaxed mb-4 line-clamp-2">
          {experience.shortDescription}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-4 text-base text-white/60 mb-1">
          <span className="mono-data">⏱ {experience.durationLabel}</span>
          <span className="mono-data">
            ★ {experience.rating.toFixed(1)}{' '}
            <span className="text-sm">({experience.reviewCount.toLocaleString()})</span>
          </span>
        </div>

        {/* Options count */}
        {experience.optionsSnapshot && experience.optionsSnapshot.length > 1 && (
          <p className="text-base text-[var(--text-secondary)] mb-3">
            {experience.optionsSnapshot.length} options available
          </p>
        )}
        {(!experience.optionsSnapshot || experience.optionsSnapshot.length <= 1) && (
          <div className="mb-3" />
        )}

        {/* Price + CTAs */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-xl font-display font-bold text-white">{experience.priceLabel}</span>
            <span className="text-base text-[var(--text-secondary)] ml-1">per person</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={href}
              className="px-3 py-2 rounded-full text-base font-medium border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-medium)] hover:text-white transition-colors"
            >
              Details
            </Link>
            <button
              onClick={(e) => { e.stopPropagation(); onBook(experience.id); }}
              disabled={loading}
              className="flex-1 sm:flex-none px-4 py-2 rounded-full text-base font-medium bg-[var(--accent-red)] hover:bg-[var(--accent-red-hover)] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Opening…' : 'Book'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
