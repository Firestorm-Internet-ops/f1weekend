'use client';

import { useSyncExternalStore } from 'react';

interface TimeLeft {
  d: number;
  h: number;
  m: number;
  s: number;
}

function subscribeSecond(onChange: () => void) {
  const id = setInterval(onChange, 1000);
  return () => clearInterval(id);
}

export default function RaceCountdown({ targetDate }: { targetDate: string }) {
  const targetMs = new Date(targetDate).getTime();
  // Whole seconds left: a number, so it only re-renders when it changes.
  // Null on the server (the visitor's clock decides), so nothing mismatches on hydration.
  const secondsLeft = useSyncExternalStore(
    subscribeSecond,
    () => Math.max(0, Math.floor((targetMs - Date.now()) / 1000)),
    () => null,
  );
  const completed = secondsLeft === 0;
  const time: TimeLeft | null = secondsLeft == null ? null : {
    d: Math.floor(secondsLeft / 86_400),
    h: Math.floor((secondsLeft % 86_400) / 3_600),
    m: Math.floor((secondsLeft % 3_600) / 60),
    s: secondsLeft % 60,
  };

  if (completed) {
    return (
      <p className="font-display font-black text-2xl text-[var(--accent-red)] uppercase-heading tracking-widest">
        LIGHTS OUT
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
            <span className="text-[var(--text-secondary)] font-bold text-2xl md:text-3xl mb-5 select-none">
              :
            </span>
          )}
          <div className="text-center">
            <div
              className="font-display font-black text-3xl md:text-5xl text-[var(--text-primary)] mono-data tabular-nums"
              style={{ minWidth: '2.5ch' }}
            >
              {String(value).padStart(2, '0')}
            </div>
            <div className="text-sm text-[var(--text-secondary)] uppercase-label tracking-widest mt-1">
              {label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
