'use client';

import type { Experience, OptionSnapshot } from '@/types/experience';
import { formatPrice } from '@/lib/utils';
import BookButton from '@/components/experiences/BookButton';

interface Props {
  experience: Pick<Experience, 'id' | 'affiliateUrl' | 'instantConfirmation' | 'skipTheLine' | 'reviewCount' | 'rating' | 'priceCurrency'>;
  options: OptionSnapshot[];
}

export default function OptionsPanel({ experience, options }: Props) {
  if (options.length < 2) return null;

  return (
    <div className="mb-8 p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
      <h3 className="font-medium text-white mb-3 text-sm">Choose your option</h3>
      <div className="space-y-2">
        {options.map((opt) => (
          <div
            key={opt.optionId}
            className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-medium)] transition-colors"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white leading-snug">{opt.title}</p>
              <p className="text-xs text-[var(--text-secondary)]">
                {formatPrice(Math.round(opt.price * 100), experience.priceCurrency)} per person
              </p>
            </div>
            <BookButton
              experience={experience}
              source="feed"
              label="Book →"
              className="shrink-0 px-4 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent-red)] hover:bg-[var(--accent-red-hover)] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
