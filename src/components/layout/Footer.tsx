import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border-subtle)] mt-20 py-10">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        {/* Row 1: Brand + Firestorm */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span className="font-display font-black tracking-widest uppercase text-white/70 text-xl">
            F1WEEKEND.CO
          </span>
          <a
            href="https://firestorm-internet.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-base text-[var(--text-secondary)] hover:text-white transition-colors"
          >
            A Firestorm Internet product →
          </a>
        </div>

        {/* Row 2: Footer nav */}
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-base text-[var(--text-secondary)]">
          <Link href="/about" className="hover:text-white transition-colors">About</Link>
          <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
        </nav>

        {/* Row 3: Legal */}
        <div className="flex flex-col sm:flex-row gap-2 text-base text-[var(--text-secondary)] pt-2 border-t border-[var(--border-subtle)]">
          <p>© 2026 Firestorm Internet. Affiliate links may earn a commission.</p>
        </div>
      </div>
    </footer>
  );
}
