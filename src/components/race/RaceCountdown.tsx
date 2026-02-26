'use client';

import { useEffect, useMemo, useState } from 'react';

interface TimeLeft {
  d: number;
  h: number;
  m: number;
  s: number;
}

export default function RaceCountdown({ targetDate }: { targetDate: string }) {
  const target = useMemo(() => new Date(targetDate), [targetDate]);
  const [time, setTime] = useState<TimeLeft | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    function getTimeLeft(): TimeLeft | null {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        setCompleted(true);
        return null;
      }
      return {
        d: Math.floor(diff / 86_400_000),
        h: Math.floor((diff % 86_400_000) / 3_600_000),
        m: Math.floor((diff % 3_600_000) / 60_000),
        s: Math.floor((diff % 60_000) / 1_000),
      };
    }
    setTime(getTimeLeft());
    const id = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (completed) {
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
            <span className="text-[var(--text-secondary)] font-bold text-2xl md:text-3xl mb-5 select-none">
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
            <div className="text-sm text-[var(--text-secondary)] uppercase-label tracking-widest mt-1">
              {label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
