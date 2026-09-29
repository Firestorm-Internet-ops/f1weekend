import Link from 'next/link';
import LocalTime from '@/components/race/LocalTime';
import { sessionToUtcDate } from '@/lib/utils';

const GLANCE_DAYS = ['Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
const GLANCE_OFFSET: Record<string, number> = { Thursday: -3, Friday: -2, Saturday: -1, Sunday: 0 };

/** Card with the weekend's F1 sessions (local time) and a link to the full schedule. */
export default function WeekendGlance({ sessions, raceDate, circuitName, tzLabel, scheduleHref, desktopOnly = true, timezone }: {
  sessions: { name: string; dayOfWeek: string; startTime: string; sessionType: string }[];
  raceDate: string;
  circuitName: string;
  tzLabel: string;
  scheduleHref: string;
  /** Hidden below md (the home hero); set false to always show. */
  desktopOnly?: boolean;
  /** Track time zone (IANA): when set, each session also shows the visitor's own time. */
  timezone?: string;
}) {
  if (sessions.length === 0) return null;
  const isoDateOf = (day: string) => {
    const d = new Date(`${raceDate}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + (GLANCE_OFFSET[day] ?? 0));
    return d.toISOString().slice(0, 10);
  };
  const dateOf = (day: string) => {
    const d = new Date(`${raceDate}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + (GLANCE_OFFSET[day] ?? 0));
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  };
  return (
    <div className={desktopOnly ? 'hidden md:block' : ''}>
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] shadow-[0_8px_30px_rgba(21,21,30,0.06)] p-6">
        <p className="text-xs font-bold uppercase-label text-[var(--accent-red)] mb-1">Race weekend</p>
        <p className="font-display font-bold text-xl text-[var(--text-primary)] mb-5">{circuitName}</p>
        <div className="space-y-4">
          {GLANCE_DAYS.filter((d) => sessions.some((s) => s.dayOfWeek === d)).map((day) => (
            <div key={day}>
              <p className="text-xs font-semibold uppercase-label text-[var(--text-muted)] mb-1.5">{day} · {dateOf(day)}</p>
              <ul className="divide-y divide-[var(--border-subtle)]">
                {sessions.filter((s) => s.dayOfWeek === day).map((s) => (
                  <li key={s.name} className="flex items-center justify-between py-1.5">
                    <span className={`text-sm ${s.sessionType === 'race' ? 'font-bold text-[var(--accent-red)]' : 'text-[var(--text-primary)]'}`}>{s.name}</span>
                    <span className="text-right">
                      <span className="block text-sm mono-data text-[var(--text-secondary)]">{s.startTime.slice(0, 5)}</span>
                      {timezone && <LocalTime iso={sessionToUtcDate(isoDateOf(day), s.startTime, timezone).toISOString()} trackTz={timezone} />}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-5 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>Track time ({tzLabel})</span>
          <Link href={scheduleHref} className="font-medium text-[var(--accent-strong)] hover:underline">Full schedule →</Link>
        </div>
      </div>
    </div>
  );
}
