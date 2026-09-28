'use client';

import type { Experience } from '@/types/experience';
import { openBooking, type ClickSource } from '@/lib/analytics';

function deriveLabel(experience: Pick<Experience, 'skipTheLine' | 'instantConfirmation' | 'reviewCount'>): string {
  if (experience.skipTheLine) return 'Skip the Queue — Book Now →';
  if (experience.instantConfirmation) return 'Book Instantly →';
  if ((experience.reviewCount ?? 0) >= 500) return `Book · ${(experience.reviewCount ?? 0).toLocaleString()}+ Reviews →`;
  return 'Book on GetYourGuide →';
}

interface Props {
  experience: Pick<Experience, 'id' | 'affiliateUrl' | 'instantConfirmation' | 'skipTheLine' | 'reviewCount' | 'rating'>;
  source?: ClickSource;
  className?: string;
  label?: string;
}

export default function BookButton({
  experience,
  source = 'feed',
  className = '',
  label,
}: Props) {
  const displayLabel = label ?? deriveLabel(experience);

  const handleBook = (e: React.MouseEvent) => {
    e.stopPropagation();
    openBooking(experience.id, source);
  };

  return (
    <button
      onClick={handleBook}
      className={className || 'px-6 py-3 rounded-full font-medium bg-[var(--accent-red)] hover:bg-[var(--accent-red-hover)] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed'}
    >
      {displayLabel}
    </button>
  );
}
