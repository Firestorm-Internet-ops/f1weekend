'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';

// Ticks every 15s; the snapshot is a string so it only re-renders when the minute changes.
function subscribeClock(onChange: () => void) {
  const t = setInterval(onChange, 15_000);
  return () => clearInterval(t);
}

function readClocks(timezone: string): string {
  const fmt = (tz?: string) =>
    new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', ...(tz ? { timeZone: tz } : {}) }).format(new Date());
  return `${fmt()}|${fmt(timezone)}`;
}

/**
 * F1-style race strip: "R16 | 02 – 04 OCT" + race name leading to the
 * schedule, and a live "My time / Track time" clock. Times render after
 * mount so server and visitor time zones never disagree during hydration.
 */
export default function RaceStrip({ round, dateLabel, flag, raceName, href, timezone }: {
  round: number;
  /** e.g. "02 – 04 OCT" */
  dateLabel: string;
  flag?: string;
  raceName: string;
  href: string;
  /** Track time zone (IANA). */
  timezone: string;
}) {
  const clocks = useSyncExternalStore(subscribeClock, () => readClocks(timezone), () => null);
  const [mine, track] = clocks ? clocks.split('|') : ['--:--', '--:--'];

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
        <p className="text-[11px] text-white/60 group-hover:text-white/90 transition-colors">Full schedule →</p>
      </Link>
      <div className="shrink-0 grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5 text-xs mono-data" aria-live="off">
        <span className="font-bold text-white flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-red)]" />MY TIME</span>
        <span className="font-bold text-white text-right">{mine}</span>
        <span className="text-white/60">TRACK TIME</span>
        <span className="text-white/60 text-right">{track}</span>
      </div>
    </div>
  );
}
