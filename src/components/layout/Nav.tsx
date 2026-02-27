'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { getActiveRaceSlug } from '@/lib/activeRace';
import { RACES } from '@/lib/constants/races';

function extractRaceSlug(pathname: string): string | null {
  const match = pathname.match(/^\/races\/([^/]+)/);
  return match ? match[1] : null;
}

export default function Nav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [raceDropdownOpen, setRaceDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const raceSlug = extractRaceSlug(pathname);
  const displayRaceSlug = raceSlug ?? getActiveRaceSlug();
  const displayRace = RACES[displayRaceSlug] ?? null;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setRaceDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Active detection: matches both old flat routes and new /races/[slug]/ routes
  const isScheduleActive =
    pathname === '/schedule' ||
    (!!raceSlug && pathname.startsWith(`/races/${raceSlug}/schedule`));
  const isExperiencesActive =
    pathname.startsWith('/experiences') ||
    (!!raceSlug && pathname.startsWith(`/races/${raceSlug}/experiences`));
  const isGettingThereActive =
    pathname === '/getting-there' ||
    (!!raceSlug && pathname.startsWith(`/races/${raceSlug}/getting-there`));
  const isTipsActive =
    !!raceSlug && pathname.startsWith(`/races/${raceSlug}/tips`);

  // Nav link targets — keep users in their current race context
  const scheduleHref = `/races/${displayRaceSlug}/schedule`;
  const experiencesHref = `/races/${displayRaceSlug}/experiences`;
  const gettingThereHref = `/races/${displayRaceSlug}/getting-there`;
  const tipsHref = `/races/${displayRaceSlug}/tips`;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <Link
              href="/"
              className="font-display font-black text-xl tracking-widest text-white uppercase"
            >
              F1WEEKEND.CO
            </Link>
            <span className="hidden sm:inline text-sm text-[var(--text-secondary)] font-medium tracking-wide">
              · by{' '}
              <a
                href="https://firestorm-internet.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--text-secondary)] transition-colors"
              >
                Firestorm Internet
              </a>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Race switcher badge — visible on all non-homepage pages */}
            {displayRace && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setRaceDropdownOpen((o) => !o)}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-sm font-medium text-white hover:border-[var(--border-medium)] transition-colors"
                >
                  <span>{displayRace.flag}</span>
                  <span className="text-[var(--accent-red)] font-bold">{displayRace.short}</span>
                  <span className="text-[var(--text-secondary)]">·</span>
                  <span>{displayRace.city}</span>
                  <span className="text-[var(--text-secondary)] ml-0.5">▾</span>
                </button>

                {raceDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] shadow-xl z-50 overflow-hidden">
                    {Object.entries(RACES).map(([slug, meta]) => (
                      <div key={slug}>
                        {meta.available ? (
                          <Link
                            href={`/races/${slug}`}
                            onClick={() => setRaceDropdownOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-secondary)] transition-colors ${
                              slug === displayRaceSlug ? 'bg-[var(--bg-secondary)]' : ''
                            }`}
                          >
                            <span className="text-xl">{meta.flag}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white">{meta.country}</p>
                              <p className="text-xs text-[var(--text-secondary)]">
                                {meta.city} · {meta.dates}
                              </p>
                            </div>
                            {slug === displayRaceSlug && (
                              <span className="text-xs text-[var(--accent-teal)] font-bold">✓</span>
                            )}
                          </Link>
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3 opacity-50 cursor-not-allowed">
                            <span className="text-xl">{meta.flag}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white">{meta.country}</p>
                              <p className="text-xs text-[var(--text-secondary)]">
                                {meta.city} · {meta.dates}
                              </p>
                            </div>
                            <span className="text-xs text-[var(--text-secondary)] font-medium px-2 py-0.5 rounded-full border border-[var(--border-subtle)]">
                              Soon
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="border-t border-[var(--border-subtle)]">
                      <Link
                        href="/f1-2026"
                        onClick={() => setRaceDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-secondary)] transition-colors"
                      >
                        <span className="text-xl">📅</span>
                        <p className="text-sm font-medium text-[var(--text-secondary)] hover:text-white">
                          View Full 2026 Calendar →
                        </p>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Desktop-only nav links */}
            <div className="hidden sm:flex items-center gap-6">
              <Link
                href={scheduleHref}
                className={`text-sm font-medium transition-colors ${
                  isScheduleActive
                    ? 'text-[var(--accent-teal)]'
                    : 'text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                Schedule
              </Link>
              <Link
                href={experiencesHref}
                className={`text-sm font-medium transition-colors ${
                  isExperiencesActive
                    ? 'text-[var(--accent-teal)]'
                    : 'text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                Experiences
              </Link>
              <Link
                href={gettingThereHref}
                className={`text-sm font-medium transition-colors ${
                  isGettingThereActive
                    ? 'text-[var(--accent-teal)]'
                    : 'text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                Getting There
              </Link>
              <Link
                href={tipsHref}
                className={`text-sm font-medium transition-colors ${
                  isTipsActive
                    ? 'text-[var(--accent-teal)]'
                    : 'text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                Tips
              </Link>
              <Link
                href="/f1-2026"
                className={`text-sm font-medium transition-colors ${
                  pathname === '/f1-2026'
                    ? 'text-[var(--accent-teal)]'
                    : 'text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                All Races
              </Link>
            </div>

            {/* Itinerary — always visible */}
            <Link
              href="/itinerary"
              className="text-sm font-medium px-3 sm:px-4 py-1.5 bg-[var(--accent-red)] hover:bg-[var(--accent-red-hover)] text-white rounded-full transition-colors whitespace-nowrap"
            >
              <span className="sm:hidden">Itinerary</span>
              <span className="hidden sm:inline">Build Itinerary</span>
            </Link>

            {/* Hamburger — mobile only */}
            <button
              className="sm:hidden text-[var(--text-secondary)] hover:text-white transition-colors text-lg w-8 h-8 flex items-center justify-center"
              onClick={() => setIsOpen(o => !o)}
              aria-label="Toggle menu"
            >
              {isOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {isOpen && (
        <div className="sm:hidden fixed top-14 left-0 right-0 z-40 bg-[var(--bg-primary)] border-b border-[var(--border-subtle)]">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-1">
            {/* Race switcher — mobile menu */}
            <div className="pb-2 mb-1 border-b border-[var(--border-subtle)]">
              <p className="text-[10px] font-bold uppercase-label text-[var(--text-secondary)] tracking-widest mb-2">
                SWITCH RACE
              </p>
              {Object.entries(RACES).map(([slug, meta]) =>
                meta.available ? (
                  <Link
                    key={slug}
                    href={`/races/${slug}`}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 py-2 ${slug === displayRaceSlug ? 'text-white' : 'text-[var(--text-secondary)]'}`}
                  >
                    <span>{meta.flag}</span>
                    <span className="text-sm font-medium flex-1">
                      {meta.city}{' '}
                      <span className="font-normal text-xs">· {meta.dates}</span>
                    </span>
                    {slug === displayRaceSlug && (
                      <span className="text-xs text-[var(--accent-teal)] font-bold">✓</span>
                    )}
                  </Link>
                ) : null,
              )}
            </div>
            <Link
              href={scheduleHref}
              onClick={() => setIsOpen(false)}
              className={`text-sm font-medium py-2 transition-colors ${
                isScheduleActive
                  ? 'text-[var(--accent-teal)]'
                  : 'text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              Schedule
            </Link>
            <Link
              href={experiencesHref}
              onClick={() => setIsOpen(false)}
              className={`text-sm font-medium py-2 transition-colors ${
                isExperiencesActive
                  ? 'text-[var(--accent-teal)]'
                  : 'text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              Experiences
            </Link>
            <Link
              href={gettingThereHref}
              onClick={() => setIsOpen(false)}
              className={`text-sm font-medium py-2 transition-colors ${
                isGettingThereActive
                  ? 'text-[var(--accent-teal)]'
                  : 'text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              Getting There
            </Link>
            <Link
              href={tipsHref}
              onClick={() => setIsOpen(false)}
              className={`text-sm font-medium py-2 transition-colors ${
                isTipsActive
                  ? 'text-[var(--accent-teal)]'
                  : 'text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              Tips
            </Link>
            <Link
              href="/f1-2026"
              onClick={() => setIsOpen(false)}
              className="text-sm font-medium py-2 text-[var(--text-secondary)] hover:text-white transition-colors"
            >
              📅 2026 Calendar
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
