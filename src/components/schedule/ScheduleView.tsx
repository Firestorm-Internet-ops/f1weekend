'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import type { ScheduleDay, SeriesKey, ScheduleEntry } from '@/types/schedule';
import { getSessionStatus, getSessionProgress } from '@/lib/schedule-utils';

// ─── Series config ───────────────────────────────────────────────

const SERIES_CONFIG: Record<SeriesKey, { color: string; label: string; shortLabel: string }> = {
  f1:          { color: '#E10600', label: 'Formula 1',               shortLabel: 'F1'       },
  f2:          { color: '#FF6B35', label: 'FIA Formula 2',           shortLabel: 'F2'       },
  f3:          { color: '#FFB800', label: 'FIA Formula 3',           shortLabel: 'F3'       },
  supercars:   { color: '#6E6E82', label: 'Supercars Championship',  shortLabel: 'SC'       },
  porsche:     { color: '#A855F7', label: 'Porsche Carrera Cup',     shortLabel: 'PCC'      },
  press:       { color: '#00D2BE', label: 'Press Conference',        shortLabel: 'PRESS'    },
  promoter:    { color: '#3B82F6', label: 'Promoter Activity',       shortLabel: 'EVENT'    },
  experiences: { color: '#22C55E', label: 'F1 Experiences',          shortLabel: 'EXP'      },
};

const FILTER_CHIPS: { key: SeriesKey | 'all'; label: string }[] = [
  { key: 'all',         label: 'All'       },
  { key: 'f1',          label: '🔴 F1'     },
  { key: 'f2',          label: 'F2'        },
  { key: 'f3',          label: 'F3'        },
  { key: 'supercars',   label: '🚗 SC'     },
  { key: 'porsche',     label: 'PCC'       },
  { key: 'press',       label: '📋 Press'  },
  { key: 'promoter',    label: 'Events'    },
  { key: 'experiences', label: '🎟 Exp'   },
];

// ─── Types ───────────────────────────────────────────────────────

type Day = 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
type SessionStatus = ReturnType<typeof getSessionStatus>;

const DAYS: Day[] = ['Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT: Record<Day, string> = {
  Thursday: 'THU', Friday: 'FRI', Saturday: 'SAT', Sunday: 'SUN',
};

// ─── Helpers ─────────────────────────────────────────────────────

function parseDuration(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// ─── Session row ─────────────────────────────────────────────────

interface SessionRowProps {
  entry: ScheduleEntry;
  status: SessionStatus;
  liveProgress: number;
  index: number;
}

function SessionRow({ entry, status, liveProgress, index }: SessionRowProps) {
  const cfg = SERIES_CONFIG[entry.seriesKey];
  const isF1 = entry.seriesKey === 'f1';
  const isCompleted = status === 'completed';
  const isLive = status === 'live';
  const duration = parseDuration(entry.startTime, entry.endTime);

  return (
    <div
      className={`relative rounded-xl overflow-hidden transition-opacity ${isCompleted ? 'opacity-40' : 'opacity-100'}`}
      style={{
        animation: 'card-enter 250ms cubic-bezier(0.16,1,0.3,1) both',
        animationDelay: `${index * 35}ms`,
        background: isF1
          ? 'color-mix(in srgb, #E10600 6%, var(--bg-secondary))'
          : 'var(--bg-secondary)',
      }}
    >
      {/* Left border */}
      <div
        className="absolute left-0 top-0 bottom-0"
        style={{
          width: isF1 ? '3px' : '2px',
          background: isCompleted ? 'var(--text-muted)' : cfg.color,
        }}
      />

      {/* Live progress bar */}
      {isLive && (
        <div
          className="absolute bottom-0 left-0 h-0.5 transition-all duration-1000"
          style={{ width: `${liveProgress}%`, background: cfg.color }}
        />
      )}

      <div className="pl-4 pr-3 py-3 flex items-center gap-3">
        {/* Time */}
        <div className="shrink-0 w-28 font-mono text-sm text-[var(--text-secondary)] leading-tight">
          <span className="block">{entry.startTime} – {entry.endTime}</span>
          <span className="text-xs text-[var(--text-secondary)] uppercase-label">AEDT</span>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Series badge */}
          <span
            className="inline-block text-[10px] font-semibold uppercase-badge px-2 py-0.5 rounded-full mb-1"
            style={{
              background: `${cfg.color}25`,
              color: isCompleted ? 'var(--text-muted)' : cfg.color,
            }}
          >
            {cfg.shortLabel}
          </span>

          {/* Session name */}
          <p
            className={isF1
              ? 'font-display font-bold text-base uppercase-heading text-white leading-tight'
              : 'text-sm font-medium text-white leading-tight'
            }
          >
            {entry.name}
          </p>
        </div>

        {/* Right side: duration + status */}
        <div className="shrink-0 flex flex-col items-end gap-1">
          {duration > 0 && (
            <span className="text-xs font-mono text-[var(--text-secondary)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-full">
              {formatDuration(duration)}
            </span>
          )}
          {isLive && (
            <div className="flex items-center gap-1.5">
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
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────

interface Props {
  schedule: ScheduleDay[];
}

export default function ScheduleView({ schedule }: Props) {
  const [activeDay, setActiveDay] = useState<Day>('Thursday');
  const [activeFilter, setActiveFilter] = useState<SeriesKey | 'all'>('all');
  const [tick, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update statuses every 60s
  useEffect(() => {
    intervalRef.current = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const dayData = schedule.find((d) => d.day === activeDay) ?? { day: activeDay, date: '', entries: [] };

  const filteredEntries = useMemo(
    () =>
      activeFilter === 'all'
        ? dayData.entries
        : dayData.entries.filter((e) => e.seriesKey === activeFilter),
    [dayData, activeFilter],
  );

  // Compute statuses for the current tick
  const statuses = useMemo(
    () =>
      filteredEntries.map((e) => getSessionStatus(activeDay, e.startTime, e.endTime)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredEntries, activeDay, tick],
  );

  // Update live progress every 10s
  const [liveTick, setLiveTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setLiveTick((t) => t + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  const liveProgressValues = useMemo(
    () =>
      filteredEntries.map((e, i) =>
        statuses[i] === 'live'
          ? getSessionProgress(activeDay, e.startTime, e.endTime)
          : 0,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredEntries, activeDay, statuses, liveTick],
  );

  return (
    <div>
      {/* Day tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => {
              setActiveDay(day);
              setActiveFilter('all');
            }}
            className={`px-5 py-2.5 rounded-full text-base font-semibold transition-all uppercase-label ${
              activeDay === day
                ? 'bg-[var(--accent-red)] text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            {DAY_SHORT[day]}
          </button>
        ))}
      </div>

      {/* Series filter chips */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.key}
            onClick={() => setActiveFilter(chip.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeFilter === chip.key
                ? 'bg-[var(--accent-teal)] text-[var(--bg-primary)]'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-surface)]'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Day header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-[var(--border-subtle)]" />
        <span className="text-xs font-semibold uppercase-label text-[var(--text-secondary)]">
          {activeDay.toUpperCase()} &nbsp; {dayData.date.toUpperCase()}
        </span>
        <div className="h-px flex-1 bg-[var(--border-subtle)]" />
      </div>

      {/* Session list — key forces re-mount (re-stagger) on day/filter change */}
      {filteredEntries.length > 0 ? (
        <div key={`${activeDay}-${activeFilter}`} className="flex flex-col gap-2">
          {filteredEntries.map((entry, i) => (
            <SessionRow
              key={`${entry.startTime}-${entry.seriesKey}-${entry.name}`}
              entry={entry}
              status={statuses[i]}
              liveProgress={liveProgressValues[i]}
              index={i}
            />
          ))}
        </div>
      ) : (
        <p className="text-[var(--text-secondary)] text-sm py-10 text-center">
          No {activeFilter === 'all' ? '' : SERIES_CONFIG[activeFilter as SeriesKey].label + ' '}sessions on {activeDay}.
        </p>
      )}
    </div>
  );
}
