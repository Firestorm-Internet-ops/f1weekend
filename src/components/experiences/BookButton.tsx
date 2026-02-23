'use client';

import { useState } from 'react';
import type { Experience } from '@/types/experience';

const SESSION_KEY = 'pitlane-session';

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

interface Props {
  experience: Pick<Experience, 'id' | 'affiliateUrl'>;
  source?: 'feed' | 'itinerary' | 'featured';
  className?: string;
  label?: string;
}

export default function BookButton({
  experience,
  source = 'feed',
  className = '',
  label = 'Book on GetYourGuide →',
}: Props) {
  const [loading, setLoading] = useState(false);

  const handleBook = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      const res = await fetch('/api/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experienceId: experience.id,
          source,
          sessionId: getSessionId(),
        }),
      });
      const { affiliateUrl } = await res.json();
      window.open(affiliateUrl, '_blank');
    } catch {
      if (experience.affiliateUrl) window.open(experience.affiliateUrl, '_blank');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleBook}
      disabled={loading}
      className={className || 'px-6 py-3 rounded-full font-medium bg-[var(--accent-red)] hover:bg-[var(--accent-red-hover)] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed'}
    >
      {loading ? 'Opening…' : label}
    </button>
  );
}
