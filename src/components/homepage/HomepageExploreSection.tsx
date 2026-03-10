'use client';

import { useState } from 'react';
import Link from 'next/link';

type SessionItem = {
  name: string;
  startTime: string;
  endTime: string;
};

type WindowItem = {
  slug: string;
  label: string;
  startTime: string | null;
  endTime: string | null;
  maxDurationHours: number | null;
  count: number;
  experiences: {
    slug: string;
    title: string;
    imageEmoji: string;
    durationLabel: string;
  }[];
};

export type ExploreDayData = {
  dayOfWeek: string;
  label: string;
  dateLabel: string;
  sessions: SessionItem[];
  windows: WindowItem[];
};

interface Props {
  city: string;
  days: ExploreDayData[];
  expBasePath: string;
  tzLabel: string;
  scheduleHref: string;
}

function fmt12(t: string | null): string {
  if (!t) return '';
  const [hStr, mStr] = t.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

export default function HomepageExploreSection({ city, days, expBasePath, tzLabel, scheduleHref }: Props) {
  const fridayIdx = days.findIndex(d => d.dayOfWeek === 'Friday');
  const [selectedIdx, setSelectedIdx] = useState(fridayIdx >= 0 ? fridayIdx : 0);
  const day = days[selectedIdx];
  if (!day) return null;

  const activeWindows = day.windows.filter(w => w.count > 0);

  return (
    <section className="max-w-6xl mx-auto px-4 py-16 border-t border-[var(--border-subtle)]">
      <h2 className="font-display font-black text-3xl text-white uppercase-heading mb-8 text-center">
        Explore {city}
      </h2>

      {/* Day tabs */}
      <div className="flex gap-3 mb-10 justify-center">
        {days.map((d, i) => (
          <button
            key={d.dayOfWeek}
            onClick={() => setSelectedIdx(i)}
            className={`flex flex-col items-center gap-0.5 w-[72px] py-3 rounded-full font-bold transition-colors cursor-pointer ${
              i === selectedIdx
                ? 'bg-[var(--accent-red)] text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-white border border-[var(--border-subtle)]'
            }`}
          >
            <span className="text-sm">{d.label}</span>
            <span className="text-[11px] font-normal opacity-80">{d.dateLabel}</span>
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* F1 on track */}
        {day.sessions.length > 0 && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-3">
              F1 ON TRACK
            </p>
            <div className="space-y-2">
              {day.sessions.map((s) => (
                <div key={s.name} className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                  <p className="font-semibold text-white">{s.name}</p>
                  <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                    {fmt12(s.startTime)} – {fmt12(s.endTime)} {tzLabel}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Experience windows */}
        {activeWindows.length > 0 && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-3">
              EXPLORE {city.toUpperCase()}
            </p>
            <div className="space-y-4">
              {activeWindows.map((w) => (
                <div key={w.slug} className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] overflow-hidden">
                  <div className="px-5 pt-5 pb-3">
                    <h3 className="font-bold text-white text-base">{w.label}</h3>
                    {w.startTime && w.endTime && (
                      <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                        {fmt12(w.startTime)} – {fmt12(w.endTime)} {tzLabel}
                        {w.maxDurationHours != null && ` · up to ${w.maxDurationHours}h free`}
                      </p>
                    )}
                  </div>

                  <div className="border-t border-[var(--border-subtle)]">
                    {w.experiences.slice(0, 4).map((exp) => (
                      <Link
                        key={exp.slug}
                        href={`${expBasePath}/${exp.slug}`}
                        className="flex items-center justify-between px-5 py-3 hover:bg-[var(--bg-surface)] transition-colors border-b border-[var(--border-subtle)] last:border-b-0"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xl shrink-0">{exp.imageEmoji}</span>
                          <span className="text-sm font-medium text-white truncate">{exp.title}</span>
                        </div>
                        <span className="text-xs text-[var(--text-secondary)] mono-data shrink-0 ml-4">
                          {exp.durationLabel}
                        </span>
                      </Link>
                    ))}
                  </div>

                  <div className="px-5 py-3 border-t border-[var(--border-subtle)]">
                    <Link
                      href={`${expBasePath}?window=${w.slug}`}
                      className="text-sm font-medium text-[var(--accent-teal)] hover:underline"
                    >
                      View all {w.count} experiences →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-12 flex justify-center">
        <Link
          href={scheduleHref}
          className="px-8 py-3 rounded-full bg-white text-[var(--bg-primary)] font-display font-black uppercase tracking-widest hover:bg-[var(--accent-teal)] transition-colors"
        >
          View Full Schedule
        </Link>
      </div>
    </section>
  );
}
