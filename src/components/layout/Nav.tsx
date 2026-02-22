'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/95 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="font-display font-black text-xl tracking-widest text-white uppercase"
        >
          PITLANE
        </Link>

        <div className="flex items-center gap-6">
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
            href="/itinerary"
            className="text-sm font-medium px-4 py-1.5 bg-[var(--accent-red)] hover:bg-[var(--accent-red-hover)] text-white rounded-full transition-colors"
          >
            Build Itinerary
          </Link>
        </div>
      </div>
    </nav>
  );
}
