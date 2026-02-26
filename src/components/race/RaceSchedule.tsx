'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import type { Session, ExperienceWindow } from '@/types/race';
import type { ExperiencePreview } from '@/types/experience';
import { formatTime } from '@/lib/utils';
import { computeISODayDates, getUtcOffsetHours, getSessionStatus, getSessionProgress } from '@/lib/schedule-utils';
import GapCard from './GapCard';

const DAYS = ['Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
type Day = (typeof DAYS)[number];

const DAY_SHORT: Record<Day, string> = {
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
};

const SESSION_COLORS: Record<string, string> = {
  practice: '#B8B8CC',
  qualifying: '#FFB800',
  sprint: '#FF6B35',
  race: '#E10600',
  support: '#6E6E82',
  event: '#00D2BE',
};

const SESSION_GROUP_LABEL: Record<string, string> = {
  practice: 'F1 ON TRACK',
  qualifying: 'F1 ON TRACK',
  sprint: 'F1 ON TRACK',
  race: 'F1 ON TRACK',
  support: 'SUPPORT RACING',
  event: 'F1 EVENTS',
};

const F1_TYPES = new Set(['practice', 'qualifying', 'sprint', 'race']);

interface Props {
  sessions: Session[];
  windows: ExperienceWindow[];
  windowData: { slug: string; count: number; experiences: ExperiencePreview[] }[];
  basePath?: string;
  schedulePath?: string;
  race: { city: string; raceDate: string; timezone: string };
}

export default function RaceSchedule({ sessions, windows, windowData, basePath = '/experiences', schedulePath = '/schedule', race }: Props) {
  // Compute dynamic date/timezone values from race prop
  const dayDates = computeISODayDates(race.raceDate);
  const utcOffsetHours = getUtcOffsetHours(race.timezone, race.raceDate);

  // Format dates for tab display: "Mar 13"
  const dayDisplayDates = Object.fromEntries(
    Object.entries(dayDates).map(([day, ds]) => {
      const d = new Date(ds + 'T00:00:00Z');
      return [day, d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })];
    }),
  ) as Record<Day, string>;

  // Timezone label for session times (e.g., "CST", "AEDT")
  const tzLabel = (() => {
    try {
      const parts = new Intl.DateTimeFormat('en', {
        timeZone: race.timezone,
        timeZoneName: 'short',
      }).formatToParts(new Date(race.raceDate + 'T12:00:00Z'));
      return parts.find((p) => p.type === 'timeZoneName')?.value ?? 'LT';
    } catch {
      return 'LT';
    }
  })();

  // Only show tabs for days that have sessions
  const daysWithSessions = DAYS.filter((day) => sessions.some((s) => s.dayOfWeek === day));

  const [activeDay, setActiveDay] = useState<Day>(() => daysWithSessions[0] ?? 'Friday');
  const [tick, setTick] = useState(0);
  const [liveTick, setLiveTick] = useState(0);

  // Recompute statuses every 60s
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // Update live progress bar every 10s
  useEffect(() => {
    const id = setInterval(() => setLiveTick((t) => t + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  const daySessions = sessions.filter((s) => s.dayOfWeek === activeDay);
  const dayWindows = windows.filter((w) => w.dayOfWeek === activeDay);
  const countMap = Object.fromEntries(windowData.map((w) => [w.slug, w.count]));
  const expMap = Object.fromEntries(windowData.map((w) => [w.slug, w.experiences]));

  // Compute statuses for current tick
  const statuses = useMemo(
    () => daySessions.map((s) => getSessionStatus(activeDay, s.startTime, s.endTime, dayDates, utcOffsetHours)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [daySessions, activeDay, tick],
  );

  const liveProgressValues = useMemo(
    () =>
      daySessions.map((s, i) =>
        statuses[i] === 'live' ? getSessionProgress(activeDay, s.startTime, s.endTime, dayDates, utcOffsetHours) : 0,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [daySessions, activeDay, statuses, liveTick],
  );

  // Group sessions: F1 sessions first, then support, then events
  const typeOrder = ['practice', 'qualifying', 'sprint', 'race', 'event'];
  const grouped = typeOrder
    .map((type) => ({
      type,
      label: SESSION_GROUP_LABEL[type],
      items: daySessions
        .map((s, i) => ({ session: s, index: i }))
        .filter(({ session }) => session.sessionType === type),
    }))
    .filter((g) => g.items.length > 0);

  // Merge consecutive groups with the same label
  const merged: { label: string; items: { session: Session; index: number }[] }[] = [];
  for (const g of grouped) {
    if (merged.length > 0 && merged[merged.length - 1].label === g.label) {
      merged[merged.length - 1].items.push(...g.items);
    } else {
      merged.push({ label: g.label, items: [...g.items] });
    }
  }

  return (
    <div>
      {/* Day tabs — only days that have sessions */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {daysWithSessions.map((day) => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`px-6 py-3 rounded-full text-base font-medium transition-all flex flex-col items-center leading-tight ${
              activeDay === day
                ? 'bg-[var(--accent-red)] text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            <span className="uppercase-label">{DAY_SHORT[day]}</span>
            <span className={`text-sm font-normal mt-0.5 ${activeDay === day ? 'text-white/80' : 'text-[var(--text-secondary)]'}`}>{dayDisplayDates[day]}</span>
          </button>
        ))}
      </div>

      {/* Sessions on circuit — grouped by type */}
      {daySessions.length > 0 && (
        <div className="mb-6 flex flex-col gap-5">
          {merged.map((group) => (
            <div key={group.label}>
              <h3 className="text-sm font-semibold uppercase-label text-white mb-3">
                {group.label}
              </h3>
              {/* key={activeDay} forces remount on tab switch → triggers stagger */}
              <div key={activeDay} className="flex flex-col gap-2">
                {group.items.map(({ session, index }) => {
                  const status = statuses[index];
                  const progress = liveProgressValues[index];
                  const isF1 = F1_TYPES.has(session.sessionType);
                  const color = SESSION_COLORS[session.sessionType] ?? '#6E6E82';
                  const isCompleted = status === 'completed';
                  const isLive = status === 'live';

                  return (
                    <div
                      key={session.id}
                      className={`relative rounded-lg overflow-hidden ${isCompleted ? 'opacity-40' : ''}`}
                      style={{
                        animation: 'card-enter 250ms cubic-bezier(0.16,1,0.3,1) both',
                        animationDelay: `${index * 40}ms`,
                        background: isF1
                          ? 'color-mix(in srgb, #E10600 6%, var(--bg-tertiary))'
                          : 'var(--bg-tertiary)',
                      }}
                    >
                      {/* Left border */}
                      <div
                        className="absolute left-0 top-0 bottom-0"
                        style={{
                          width: isF1 ? '3px' : '2px',
                          background: isCompleted ? 'var(--text-muted)' : color,
                        }}
                      />

                      {/* Live progress bar */}
                      {isLive && (
                        <div
                          className="absolute bottom-0 left-0 h-0.5 transition-all duration-1000"
                          style={{ width: `${progress}%`, background: color }}
                        />
                      )}

                      <div className="pl-4 pr-3 py-3 flex items-center gap-3">
                        {/* Session name + time */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white text-base leading-tight">
                            {session.name}
                          </p>
                          <p className="text-base text-[var(--text-secondary)] mono-data mt-0.5">
                            {formatTime(session.startTime)} – {formatTime(session.endTime)}{' '}
                            <span className="text-[var(--text-secondary)]">{tzLabel}</span>
                          </p>
                        </div>

                        {/* Live indicator */}
                        {isLive && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{
                                background: '#E10600',
                                animation: 'pulse-red 2s ease-in-out infinite',
                              }}
                            />
                            <span className="text-[10px] font-semibold text-[var(--accent-red)] uppercase-label">
                              LIVE
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Gap cards — explore city */}
      {dayWindows.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold uppercase-label text-[var(--text-secondary)] mb-3">
            EXPLORE {race.city.toUpperCase()}
          </h3>
          <div className="flex flex-col gap-3">
            {dayWindows.map((window) => (
              <GapCard
                key={window.id}
                slug={window.slug}
                label={window.label}
                maxDurationHours={window.maxDurationHours}
                count={countMap[window.slug] ?? 0}
                startTime={window.startTime}
                endTime={window.endTime}
                experiences={expMap[window.slug] ?? []}
                basePath={basePath}
              />
            ))}
          </div>
        </div>
      )}

      {daySessions.length === 0 && dayWindows.length === 0 && (
        <div className="text-[var(--text-muted)] text-sm py-12 text-center">
          No schedule data for {activeDay}.
        </div>
      )}

      {/* View full schedule CTA */}
      <div className="mt-6 pt-4 border-t border-[var(--border-subtle)]">
        <Link
          href={schedulePath}
          className="text-sm font-medium text-[var(--accent-teal)] hover:text-white transition-colors flex items-center gap-1"
        >
          View full schedule →
        </Link>
      </div>
    </div>
  );
}
