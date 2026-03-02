import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <p className="text-xs font-bold uppercase-label text-[var(--accent-red)] tracking-widest mb-4">404</p>
      <h1 className="font-display font-black text-5xl sm:text-6xl text-white uppercase-heading leading-none mb-4">
        Page Not<br /><span className="text-[var(--accent-teal)]">Found</span>
      </h1>
      <p className="text-[var(--text-secondary)] text-lg max-w-sm mb-8">
        This page doesn&apos;t exist. It may have moved or been removed.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/"
          className="px-6 py-3 rounded-xl bg-[var(--accent-red)] hover:bg-[var(--accent-red-hover)] text-white font-display font-bold transition-colors"
        >
          Back to Home
        </Link>
        <Link
          href="/f1-2026"
          className="px-6 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-display font-bold hover:text-white hover:border-[var(--border-medium)] transition-colors"
        >
          2026 Season Guide
        </Link>
      </div>
    </div>
  );
}
