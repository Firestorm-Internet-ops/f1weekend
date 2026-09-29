'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';

// Ticks every 15s; the snapshot is a string so it only re-renders when the minute changes.
function subscribeClock(onChange: () => void) {
  const t = setInterval(onChange, 15_000);
  return () => clearInterval(t);
}

function hhmm(date: Date, tz?: string): string {
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', ...(tz ? { timeZone: tz } : {}) }).format(date);
}

/**
 * F1-style race strip: "R16 | 02 – 04 OCT" + race name leading to the
 * schedule, and a live "My time / Track time" clock. Track time is in the
 * server HTML (from `renderedAt`); the visitor's own time needs their time
 * zone, so it appears once the page is running in the browser.
 */
export default function RaceStrip({ round, dateLabel, flag, raceName, note, href, timezone, renderedAt }: {
  round: number;
  /** e.g. "02 – 04 OCT" */
  dateLabel: string;
  flag?: string;
  raceName: string;
  /** e.g. "Held at Sepang, Malaysia in 2026 (moved from Sakhir, Bahrain)". */
  note?: string;
  href: string;
  /** Track time zone (IANA). */
  timezone: string;
  /** Server render time (ISO): server and hydration show the same clock. */
  renderedAt: string;
}) {
  const clocks = useSyncExternalStore(
    subscribeClock,
    () => { const now = new Date(); return `${hhmm(now)}|${hhmm(now, timezone)}`; },
    () => `|${hhmm(new Date(renderedAt), timezone)}`,
  );
  const [mine, track] = clocks.split('|');

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-[var(--text-primary)] text-white px-5 py-3 mb-6">
      <Link href={href} className="group min-w-0">
        <p className="text-xs font-bold mono-data tracking-wider text-white/70">
          R{round} <span className="mx-1.5 text-white/30">|</span> {dateLabel}
        </p>
        <p className="font-display font-bold text-lg leading-tight flex items-center gap-2 truncate">
          {flag && <span aria-hidden>{flag}</span>}
          <span className="truncate">{raceName}</span>
          <span className="text-[var(--accent-red)] group-hover:translate-x-0.5 transition-transform" aria-hidden>›</span>
        </p>
        <p className="text-[11px] text-white/60 group-hover:text-white/90 transition-colors truncate">
          {note ? `${note} · ` : ''}Full schedule →
        </p>
      </Link>
      <div className="shrink-0 grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5 text-xs mono-data">
        {mine && (
          <>
            <span className="font-bold text-white flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-red)]" />MY TIME</span>
            <span className="font-bold text-white text-right">{mine}</span>
          </>
        )}
        <span className={mine ? 'text-white/60' : 'font-bold text-white'}>TRACK TIME</span>
        <span className={`text-right ${mine ? 'text-white/60' : 'font-bold text-white'}`}>{track}</span>
      </div>
    </div>
  );
}
