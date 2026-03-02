'use client';

import { useState, useEffect, useRef } from 'react';
import type { Experience } from '@/types/experience';
import BookButton from '@/components/experiences/BookButton';

interface Props {
  experience: Pick<Experience, 'id' | 'affiliateUrl' | 'instantConfirmation' | 'skipTheLine' | 'reviewCount' | 'rating' | 'title' | 'priceLabel'>;
  topCtaId?: string;
}

export default function StickyBookingBar({ experience, topCtaId = 'top-book-cta' }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = document.getElementById(topCtaId);
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [topCtaId]);

  return (
    <div
      className={`md:hidden fixed bottom-0 inset-x-0 z-50 transition-transform duration-300 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 border-t border-[var(--border-subtle)]"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div className="min-w-0">
          <p className="text-xs font-medium text-white truncate">{experience.title}</p>
          <p className="text-xs text-[var(--text-secondary)]">{experience.priceLabel} per person</p>
        </div>
        <BookButton
          experience={experience}
          source="feed"
          label="Book Now →"
          className="shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold bg-[var(--accent-red)] hover:bg-[var(--accent-red-hover)] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
}
