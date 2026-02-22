'use client';

import { useEffect, useState } from 'react';

// FP1 start: Thursday 5 March 2026, 12:30 AEDT (UTC+11)
const TARGET = new Date('2026-03-05T01:30:00Z');

interface TimeLeft {
  d: number;
  h: number;
  m: number;
  s: number;
}

function getTimeLeft(): TimeLeft | null {
  const diff = TARGET.getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    d: Math.floor(diff / 86_400_000),
    h: Math.floor((diff % 86_400_000) / 3_600_000),
    m: Math.floor((diff % 3_600_000) / 60_000),
    s: Math.floor((diff % 60_000) / 1_000),
  };
}

export default function RaceCountdown() {
  const [time, setTime] = useState<TimeLeft | null>(null);

  useEffect(() => {
    setTime(getTimeLeft());
    const id = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  if (time === null && typeof window !== 'undefined' && Date.now() >= TARGET.getTime()) {
    return (
      <p className="font-display font-black text-2xl text-[var(--accent-red)] uppercase-heading tracking-widest">
        LIGHTS OUT 🏁
      </p>
    );
  }

  if (!time) return null; // SSR / first paint — avoid hydration mismatch

  const units = [
    { value: time.d, label: 'DAYS' },
    { value: time.h, label: 'HRS' },
    { value: time.m, label: 'MIN' },
    { value: time.s, label: 'SEC' },
  ];

  return (
    <div className="flex items-end gap-1 md:gap-2">
      {units.map(({ value, label }, i) => (
        <div key={label} className="flex items-end gap-1 md:gap-2">
          {i > 0 && (
            <span className="text-[var(--text-muted)] font-bold text-2xl md:text-3xl mb-5 select-none">
              :
            </span>
          )}
          <div className="text-center">
            <div
              className="font-display font-black text-3xl md:text-5xl text-white mono-data tabular-nums"
              style={{ minWidth: '2.5ch' }}
            >
              {String(value).padStart(2, '0')}
            </div>
            <div className="text-xs text-[var(--text-muted)] uppercase-label tracking-widest mt-1">
              {label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
