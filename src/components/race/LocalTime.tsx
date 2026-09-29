'use client';

import { useSyncExternalStore } from 'react';

const noSubscribe = () => () => {};

/**
 * A session start in the visitor's own time zone ("14:30 your time"), shown
 * only when that differs from track time. Renders after mount (visitor time
 * zone is unknown on the server).
 */
export default function LocalTime({ iso, trackTz }: { iso: string; trackTz: string }) {
  const text = useSyncExternalStore(noSubscribe, () => {
    const d = new Date(iso);
    const f = (tz?: string) => new Intl.DateTimeFormat('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', ...(tz ? { timeZone: tz } : {}) }).format(d);
    const mine = f();
    return mine === f(trackTz) ? null : mine;
  }, () => null);
  if (!text) return null;
  return <span className="block text-[11px] text-[var(--text-muted)] text-right">{text} your time</span>;
}
