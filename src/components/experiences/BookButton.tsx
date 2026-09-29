'use client';

import type { Experience } from '@/types/experience';
import { openBooking, type ClickSource } from '@/lib/analytics';
import { providerName } from '@/lib/providers/meta';

type BookableExperience = Pick<Experience, 'id' | 'affiliateUrl' | 'instantConfirmation' | 'skipTheLine' | 'reviewCount' | 'rating'> &
  Partial<Pick<Experience, 'affiliatePartner'>>;

function deriveLabel(experience: BookableExperience): string {
  if (experience.skipTheLine) return 'Skip the Queue — Book Now →';
  if (experience.instantConfirmation) return 'Book Instantly →';
  if ((experience.reviewCount ?? 0) >= 500) return `Book · ${(experience.reviewCount ?? 0).toLocaleString()}+ Reviews →`;
  return `Book on ${providerName(experience.affiliatePartner)} →`;
}

interface Props {
  experience: BookableExperience;
  /** A specific provider offer; without it /api/click picks the experience's default offer. */
  offer?: { id: number | null; provider: string };
  source?: ClickSource;
  className?: string;
  label?: string;
}

export default function BookButton({
  experience,
  offer,
  source = 'feed',
  className = '',
  label,
}: Props) {
  const displayLabel = label ?? deriveLabel(experience);

  const handleBook = (e: React.MouseEvent) => {
    e.stopPropagation();
    openBooking(experience.id, source, undefined, offer);
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
