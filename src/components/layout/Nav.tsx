'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/95 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <Link
            href="/"
            className="font-display font-black text-xl tracking-widest text-white uppercase"
          >
            PITLANE
          </Link>
          <span className="hidden sm:inline text-xs text-[var(--text-muted)] font-medium tracking-wide">
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

        <div className="flex items-center gap-3 sm:gap-6">
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
            className={`text-sm font-medium transition-colors hidden sm:block ${
              pathname === '/getting-there'
                ? 'text-[var(--accent-teal)]'
                : 'text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            Getting There
          </Link>
          <Link
            href="/itinerary"
            className="text-sm font-medium px-3 sm:px-4 py-1.5 bg-[var(--accent-red)] hover:bg-[var(--accent-red-hover)] text-white rounded-full transition-colors whitespace-nowrap"
          >
            <span className="sm:hidden">Itinerary</span>
            <span className="hidden sm:inline">Build Itinerary</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
