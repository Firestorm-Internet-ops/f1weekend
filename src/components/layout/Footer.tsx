export default function Footer() {
  return (
    <footer className="border-t border-[var(--border-subtle)] mt-20 py-8">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[var(--text-muted)]">
        <span className="font-display font-black tracking-widest uppercase text-white/40">PITLANE</span>
        <p>F1 2026 Australian Grand Prix · Melbourne · Mar 5–8</p>
        <p>© 2026 Pitlane. Affiliate links may earn a commission.</p>
      </div>
    </footer>
  );
}
