'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Nav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

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
            {/* Desktop-only nav links */}
            <div className="hidden sm:flex items-center gap-6">
              <Link
                href="/schedule"
                className={`text-sm font-medium transition-colors ${
                  pathname === '/schedule'
                    ? 'text-[var(--accent-teal)]'
                    : 'text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                Schedule
              </Link>
              <Link
                href="/experiences"
                className={`text-sm font-medium transition-colors ${
                  pathname.startsWith('/experiences')
                    ? 'text-[var(--accent-teal)]'
                    : 'text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                Experiences
              </Link>
              <Link
                href="/getting-there"
                className={`text-sm font-medium transition-colors ${
                  pathname === '/getting-there'
                    ? 'text-[var(--accent-teal)]'
                    : 'text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                Getting There
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
            <Link
              href="/schedule"
              onClick={() => setIsOpen(false)}
              className={`text-sm font-medium py-2 transition-colors ${
                pathname === '/schedule'
                  ? 'text-[var(--accent-teal)]'
                  : 'text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              Schedule
            </Link>
            <Link
              href="/experiences"
              onClick={() => setIsOpen(false)}
              className={`text-sm font-medium py-2 transition-colors ${
                pathname.startsWith('/experiences')
                  ? 'text-[var(--accent-teal)]'
                  : 'text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              Experiences
            </Link>
            <Link
              href="/getting-there"
              onClick={() => setIsOpen(false)}
              className={`text-sm font-medium py-2 transition-colors ${
                pathname === '/getting-there'
                  ? 'text-[var(--accent-teal)]'
                  : 'text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              Getting There
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
