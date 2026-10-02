'use client';

import { openFeedBooking } from '@/lib/analytics';

/** Small "Book" link for a live-feed tour (tracked, with the page's campaign ID). */
export default function BookTourButton({ raceSlug, provider, productId, label = 'Book' }: { raceSlug: string; provider: string; productId: string; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => openFeedBooking(raceSlug, { provider, productId })}
      className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--accent-red)] text-white hover:bg-[var(--accent-red-hover)] transition-colors"
    >
      {label} →
    </button>
  );
}
