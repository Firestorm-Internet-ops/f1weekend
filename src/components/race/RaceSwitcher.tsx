'use client';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { RACES } from '@/lib/constants/races';

interface Props {
  raceSlug: string;
  pageType: 'schedule' | 'experiences' | 'getting-there';
}

export default function RaceSwitcher({ raceSlug, pageType }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = RACES[raceSlug];

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!current) return null;

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-sm font-medium text-white hover:border-[var(--border-medium)] transition-colors"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="text-base">{current.flag}</span>
        <span className="font-bold text-[var(--accent-red)]">{current.short}</span>
        <span className="text-[var(--text-secondary)]">·</span>
        <span>{current.city}</span>
        <span className="text-xs text-[var(--text-secondary)]">{current.dates}</span>
        <svg
          className={`w-3.5 h-3.5 text-[var(--text-secondary)] transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-2 w-72 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] shadow-xl z-50 overflow-hidden"
          role="listbox"
          aria-label="Switch race"
        >
          {Object.entries(RACES).map(([slug, meta]) => (
            <div key={slug} role="option" aria-selected={slug === raceSlug}>
              {meta.available ? (
                <Link
                  href={`/races/${slug}/${pageType}`}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-secondary)] transition-colors ${slug === raceSlug ? 'bg-[var(--bg-secondary)]' : ''}`}
                >
                  <span className="text-xl">{meta.flag}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{meta.country}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{meta.city} · {meta.dates}</p>
                  </div>
                  {slug === raceSlug && (
                    <span className="text-xs text-[var(--accent-teal)] font-bold">✓</span>
                  )}
                </Link>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 opacity-50 cursor-not-allowed">
                  <span className="text-xl">{meta.flag}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{meta.country}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{meta.city} · {meta.dates}</p>
                  </div>
                  <span className="text-xs text-[var(--text-secondary)] px-2 py-0.5 rounded-full border border-[var(--border-subtle)]">
                    Soon
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
