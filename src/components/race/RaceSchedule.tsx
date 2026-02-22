'use client';

import { useState } from 'react';
import type { Session, ExperienceWindow } from '@/types/race';
import { formatTime } from '@/lib/utils';
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
};

interface Props {
  sessions: Session[];
  windows: ExperienceWindow[];
  windowCounts: { slug: string; count: number }[];
}

export default function RaceSchedule({ sessions, windows, windowCounts }: Props) {
  const [activeDay, setActiveDay] = useState<Day>('Thursday');

  const daySessions = sessions.filter((s) => s.dayOfWeek === activeDay);
  const dayWindows = windows.filter((w) => w.dayOfWeek === activeDay);
  const countMap = Object.fromEntries(windowCounts.map((wc) => [wc.slug, wc.count]));

  return (
    <div>
      {/* Day tabs */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all uppercase-label ${
              activeDay === day
                ? 'bg-[var(--accent-red)] text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            {DAY_SHORT[day]}
          </button>
        ))}
      </div>

      {/* F1 sessions on track */}
      {daySessions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-medium uppercase-label text-[var(--text-muted)] mb-3">
            F1 ON TRACK
          </h3>
          <div className="flex flex-col gap-2">
            {daySessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center gap-4 p-3 rounded-lg bg-[var(--bg-tertiary)]"
              >
                <div
                  className="w-1.5 h-8 rounded-full shrink-0"
                  style={{
                    backgroundColor: SESSION_COLORS[session.sessionType] ?? '#6E6E82',
                  }}
                />
                <div>
                  <p className="font-medium text-white text-sm">{session.name}</p>
                  <p className="text-xs text-[var(--text-tertiary)] mono-data">
                    {formatTime(session.startTime)} – {formatTime(session.endTime)} AEDT
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gap cards — explore Melbourne */}
      {dayWindows.length > 0 && (
        <div>
          <h3 className="text-xs font-medium uppercase-label text-[var(--text-muted)] mb-3">
            EXPLORE MELBOURNE
          </h3>
          <div className="flex flex-col gap-3">
            {dayWindows.map((window) => (
              <GapCard
                key={window.id}
                slug={window.slug}
                label={window.label}
                description={window.description ?? ''}
                maxDurationHours={window.maxDurationHours}
                count={countMap[window.slug] ?? 0}
                startTime={window.startTime}
                endTime={window.endTime}
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
    </div>
  );
}
