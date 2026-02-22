'use client';

import { useState } from 'react';
import type { Itinerary, ItineraryDay } from '@/types/itinerary';
import type { Experience } from '@/types/experience';
import { formatTime } from '@/lib/utils';

const SLOT_STYLES = {
  session: { color: '#E10600', label: '🏎 F1 Session' },
  experience: { color: '#00D2BE', label: '✦ Experience' },
  free: { color: '#6E6E82', label: '· Free time' },
};

interface Props {
  itinerary: Itinerary;
  experiences: Experience[];
}

export default function ItineraryView({ itinerary, experiences }: Props) {
  const [activeDay, setActiveDay] = useState(0);
  const expMap = Object.fromEntries(experiences.map((e) => [e.id, e]));
  const day: ItineraryDay | undefined = itinerary.days[activeDay];

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: itinerary.title, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied!');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-black text-3xl text-white uppercase-heading mb-2 leading-tight">
          {itinerary.title}
        </h1>
        <p className="text-[var(--text-secondary)] leading-relaxed">{itinerary.summary}</p>
        <button
          onClick={handleShare}
          className="mt-4 text-sm px-4 py-1.5 rounded-full border border-[var(--border-medium)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-medium)] transition-colors"
        >
          Share Itinerary ↗
        </button>
      </div>

      {/* Day tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {itinerary.days.map((d, i) => (
          <button
            key={i}
            onClick={() => setActiveDay(i)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeDay === i
                ? 'bg-[var(--accent-red)] text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            {d.dayLabel}
          </button>
        ))}
      </div>

      {/* Timeline slots */}
      {day ? (
        <div className="space-y-0">
          {day.slots.map((slot, i) => {
            const exp = slot.experienceId ? expMap[slot.experienceId] : null;
            const style = SLOT_STYLES[slot.type] ?? SLOT_STYLES.free;
            const isLast = i === day.slots.length - 1;

            return (
              <div key={i} className="flex gap-4">
                {/* Time */}
                <div className="w-20 shrink-0 pt-3 text-right">
                  <span className="text-xs mono-data text-[var(--text-muted)]">
                    {formatTime(slot.startTime)}
                  </span>
                </div>

                {/* Timeline dot + line */}
                <div className="relative flex flex-col items-center">
                  <div
                    className="w-3 h-3 rounded-full mt-3 shrink-0 ring-2 ring-[var(--bg-primary)]"
                    style={{ backgroundColor: style.color }}
                  />
                  {!isLast && (
                    <div
                      className="w-px flex-1 mt-1 min-h-6"
                      style={{ backgroundColor: `${style.color}30` }}
                    />
                  )}
                </div>

                {/* Content card */}
                <div className="flex-1 pb-4">
                  <p className="text-xs text-[var(--text-muted)] mb-1">{style.label}</p>
                  {exp ? (
                    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-3">
                      <p className="font-medium text-white">
                        {exp.imageEmoji} {exp.title}
                      </p>
                      <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                        {exp.shortDescription}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
                        <span>{exp.durationLabel}</span>
                        <span>{exp.priceLabel}</span>
                        <span>★ {exp.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] p-3">
                      <p className="font-medium text-white">
                        {slot.note || slot.type}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-[var(--text-muted)] text-sm">No slots for this day.</p>
      )}
    </div>
  );
}
