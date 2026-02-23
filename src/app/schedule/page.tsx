import type { Metadata } from 'next';
import ScheduleView from '@/components/schedule/ScheduleView';

export const metadata: Metadata = {
  title: 'Schedule | Pitlane',
  description:
    'Full 2026 Australian Grand Prix weekend schedule — all sessions, support races, press conferences and F1 Experiences across Thursday to Sunday at Albert Park.',
};

export default function SchedulePage() {
  return (
    <div className="min-h-screen">
      <section className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        <p className="text-xs uppercase-label text-[var(--accent-red)] mb-3 tracking-widest">
          Melbourne · Mar 5–8, 2026
        </p>
        <h1 className="font-display font-black text-4xl md:text-5xl text-white uppercase-heading mb-2">
          Weekend Schedule
        </h1>
        <p className="text-[var(--text-secondary)] text-sm mb-8">
          All times AEDT (UTC+11) · Subject to change
        </p>
        <ScheduleView />
      </section>
    </div>
  );
}
