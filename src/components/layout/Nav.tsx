'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import type { Race } from '@/types/race';
import { raceKey } from '@/lib/race-url';
import Icon from '@/components/ui/Icon';

function extractRaceSlug(pathname: string): string | null {
  const match = pathname.match(/^\/races\/([^/]+)/);
  return match ? match[1] : null;
}

export default function Nav({ defaultRaceSlug, races }: { defaultRaceSlug: string; races: Race[] }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [raceDropdownOpen, setRaceDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 300);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Unknown slugs (a 404 page) fall back to the current race, so nav links still work.
  // URLs carry the race key ("bahrain"); old ones the full slug. Either picks the race.
  const urlSlug = extractRaceSlug(pathname);
  const urlRace = urlSlug ? races.find((r) => r.slug === urlSlug || raceKey(r.slug) === urlSlug) : undefined;
  const raceSlug = urlRace?.slug ?? null;
  const displayRaceSlug = raceSlug ?? defaultRaceSlug;
  const displayRace = races.find(r => r.slug === displayRaceSlug) ?? races[0] ?? null;

  // Raw sub-route (everything after /races/[slug])
  const rawSubRoute = raceSlug ? pathname.slice(`/races/${raceKey(raceSlug)}`.length) : '';
  // When on an experience detail page (/experiences/[slug]), collapse to /experiences
  // so switching races lands on the list, not a non-existent slug on the new race.
  // Exception: /experiences/map is a shared page that should be preserved.
  const subRoute = /^\/experiences\/(?!map(?:\/|$)).+/.test(rawSubRoute)
    ? '/experiences'
    : rawSubRoute;

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
    (!!raceSlug && pathname.startsWith(`/races/${raceKey(raceSlug)}/schedule`));
  const isExperiencesActive =
    pathname.startsWith('/experiences') ||
    (!!raceSlug && pathname.startsWith(`/races/${raceKey(raceSlug)}/experiences`));
  const isGettingThereActive =
    pathname === '/getting-there' ||
    (!!raceSlug && pathname.startsWith(`/races/${raceKey(raceSlug)}/getting-there`));
  const isTipsActive =
    !!raceSlug && pathname.startsWith(`/races/${raceKey(raceSlug)}/tips`);

  // Nav link targets — keep users in their current race context
  const scheduleHref = `/races/${raceKey(displayRaceSlug)}/schedule`;
  const experiencesHref = `/races/${raceKey(displayRaceSlug)}/experiences`;
  const gettingThereHref = `/races/${raceKey(displayRaceSlug)}/getting-there`;
  const tipsHref = `/races/${raceKey(displayRaceSlug)}/tips`;
  // Races without tips content have no tips page (404): don't link to it.
  const showTips = displayRace?.hasTips !== false;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between relative">
          <div className="flex items-baseline gap-2">
            <Link
              href="/"
              className="font-display font-black text-xl tracking-widest text-[var(--text-primary)] uppercase"
            >
              F1WEEKEND.CO
            </Link>
            <span className="hidden xl:inline text-sm text-[var(--text-secondary)] font-medium tracking-wide whitespace-nowrap">
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
              <div className="relative sm:static" ref={dropdownRef}>
                <button
                  onClick={() => setRaceDropdownOpen((o) => !o)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-sm font-medium text-[var(--text-primary)] hover:border-[var(--border-medium)] transition-colors"
                >
                  <span>{displayRace.flag}</span>
                  <span className="text-[var(--accent-red)] font-bold">{displayRace.shortCode}</span>
                  <span className="hidden sm:inline text-[var(--text-secondary)]">·</span>
                  <span className="hidden sm:inline whitespace-nowrap">{displayRace.city}</span>
                  <span className="text-[var(--text-secondary)] ml-0.5">▾</span>
                </button>

                {raceDropdownOpen && (() => {
                  const today = new Date().toISOString().slice(0, 10);
                  const upcoming = races.filter((r) => r.raceDate >= today && r.available);
                  const mobileRaces = upcoming.slice(0, 4);

                  const renderRaceItem = (race: Race) => {
                    const d = new Date(race.raceDate + 'T00:00:00Z');
                    const raceDay = d.getUTCDate();
                    const raceMonth = d.toLocaleDateString('en-AU', { month: 'short', timeZone: 'UTC' });
                    const startOffset = race.hasThursdayFreeDay ? 3 : 2;
                    const startDate = new Date(d);
                    startDate.setUTCDate(raceDay - startOffset);
                    const startDay = startDate.getUTCDate();
                    const startMonth = startDate.toLocaleDateString('en-AU', { month: 'short', timeZone: 'UTC' });
                    const datesStr = startMonth === raceMonth
                      ? `${raceMonth} ${startDay}–${raceDay}`
                      : `${startMonth} ${startDay} – ${raceMonth} ${raceDay}`;

                    if (!race.available) {
                      return (
                        <div
                          key={race.slug}
                          className="flex items-center gap-3 px-4 py-2.5 opacity-60 cursor-default"
                        >
                          <span className="text-lg">{race.flag}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--text-secondary)] leading-tight">{race.name}</p>
                            <p className="text-xs text-[var(--text-muted)]">{race.city} · {datesStr}</p>
                          </div>
                          <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide border border-[var(--border-subtle)] rounded px-1.5 py-0.5">
                            Soon
                          </span>
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={race.slug}
                        href={scrolled && subRoute ? `/races/${raceKey(race.slug)}${subRoute}` : `/races/${raceKey(race.slug)}`}
                        onClick={() => setRaceDropdownOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--bg-secondary)] transition-colors ${
                          race.slug === displayRaceSlug ? 'bg-[var(--bg-secondary)]' : ''
                        }`}
                      >
                        <span className="text-lg">{race.flag}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)] leading-tight">{race.name}</p>
                          <p className="text-xs text-[var(--text-secondary)]">{race.city} · {datesStr}</p>
                        </div>
                        {race.slug === displayRaceSlug && (
                          <span className="text-xs text-[var(--accent-strong)] font-bold">✓</span>
                        )}
                      </Link>
                    );
                  };

                  const calendarLink = (
                    <Link
                      href="/f1-2026"
                      onClick={() => setRaceDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                      <Icon name="calendar" size={18} className="text-[var(--text-secondary)]" />
                      <p className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                        View Full 2026 Calendar →
                      </p>
                    </Link>
                  );

                  return (
                    <div className="absolute right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 top-full mt-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] shadow-xl z-50 overflow-hidden
                      w-64 sm:w-auto sm:min-w-[900px]">
                      {/* Mobile: next 4 races */}
                      <div className="sm:hidden">
                        {mobileRaces.map((race) => renderRaceItem(race))}
                        <div className="border-t border-[var(--border-subtle)]">{calendarLink}</div>
                      </div>

                      {/* sm+: all upcoming races in a 4-column grid */}
                      <div className="hidden sm:block">
                        <div className="grid grid-cols-4">
                          {upcoming.map((race) => renderRaceItem(race))}
                        </div>
                        <div className="border-t border-[var(--border-subtle)]">{calendarLink}</div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Desktop-only nav links */}
            <div className="hidden lg:flex items-center gap-5">
              <Link
                href={scheduleHref}
                className={`text-sm font-medium whitespace-nowrap transition-colors ${
                  isScheduleActive
                    ? 'text-[var(--accent-strong)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Schedule
              </Link>
              <Link
                href={experiencesHref}
                className={`text-sm font-medium whitespace-nowrap transition-colors ${
                  isExperiencesActive
                    ? 'text-[var(--accent-strong)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Experiences
              </Link>
              <Link
                href={gettingThereHref}
                className={`text-sm font-medium whitespace-nowrap transition-colors ${
                  isGettingThereActive
                    ? 'text-[var(--accent-strong)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Getting There
              </Link>
              {showTips && <Link
                href={tipsHref}
                className={`text-sm font-medium whitespace-nowrap transition-colors ${
                  isTipsActive
                    ? 'text-[var(--accent-strong)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Tips
              </Link>}
              <Link
                href="/f1-2026"
                className={`text-sm font-medium whitespace-nowrap transition-colors ${
                  pathname === '/f1-2026'
                    ? 'text-[var(--accent-strong)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                All Races
              </Link>
            </div>

            {/* Itinerary — desktop only (moved to hamburger on mobile) */}
            <Link
              href={`/itinerary?race=${raceKey(displayRaceSlug)}`}
              className="hidden lg:flex text-sm font-medium px-4 py-1.5 bg-[var(--accent-red)] hover:bg-[var(--accent-red-hover)] text-white rounded-full transition-colors whitespace-nowrap"
            >
              Plan my weekend
            </Link>

            {/* Hamburger — mobile only */}
            <button
              className="lg:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-lg w-8 h-8 flex items-center justify-center"
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
        <div className="lg:hidden fixed top-14 left-0 right-0 z-40 bg-[var(--bg-primary)] shadow-lg border-b border-[var(--border-subtle)]">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-1">
            <Link
              href={scheduleHref}
              onClick={() => setIsOpen(false)}
              className={`text-sm font-medium py-2 transition-colors ${
                isScheduleActive
                  ? 'text-[var(--accent-strong)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Schedule
            </Link>
            <Link
              href={experiencesHref}
              onClick={() => setIsOpen(false)}
              className={`text-sm font-medium py-2 transition-colors ${
                isExperiencesActive
                  ? 'text-[var(--accent-strong)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Experiences
            </Link>
            <Link
              href={gettingThereHref}
              onClick={() => setIsOpen(false)}
              className={`text-sm font-medium py-2 transition-colors ${
                isGettingThereActive
                  ? 'text-[var(--accent-strong)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Getting There
            </Link>
            {showTips && <Link
              href={tipsHref}
              onClick={() => setIsOpen(false)}
              className={`text-sm font-medium py-2 transition-colors ${
                isTipsActive
                  ? 'text-[var(--accent-strong)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Tips
            </Link>}
            <Link
              href="/f1-2026"
              onClick={() => setIsOpen(false)}
              className="text-sm font-medium py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <Icon name="calendar" size={16} className="inline -mt-0.5 mr-1.5" />2026 Calendar
            </Link>
            <div className="pt-2 mt-1 border-t border-[var(--border-subtle)]">
              <Link
                href={`/itinerary?race=${raceKey(displayRaceSlug)}`}
                onClick={() => setIsOpen(false)}
                className="block text-sm font-medium py-2.5 px-4 bg-[var(--accent-red)] hover:bg-[var(--accent-red-hover)] text-white rounded-lg transition-colors text-center"
              >
                Plan my weekend
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
