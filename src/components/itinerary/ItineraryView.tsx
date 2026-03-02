'use client';

import { useState } from 'react';
import type { Itinerary, ItineraryDay, SessionSlot, GapSlot } from '@/types/itinerary';
import type { Experience } from '@/types/experience';
import { formatTime } from '@/lib/utils';
import BookButton from '@/components/experiences/BookButton';

interface Props {
    itinerary: Itinerary;
    experiences: Experience[];
}

export default function ItineraryView({ itinerary, experiences }: Props) {
    const [activeDay, setActiveDay] = useState(0);
    const [copied, setCopied] = useState(false);
    const expMap = Object.fromEntries(experiences.map(e => [e.id, e]));
    const day: ItineraryDay | undefined = itinerary.days[activeDay];

    // Collect all unique suggested experience IDs across all days/gaps
    const allSuggestedIds = Array.from(
        new Set(
            itinerary.days
                .flatMap(d => d.slots)
                .filter((s): s is GapSlot => s.type === 'gap')
                .flatMap(s => s.suggestionIds ?? [])
        )
    );
    const allSuggestedExps = allSuggestedIds
        .map(id => expMap[id])
        .filter((e): e is Experience => Boolean(e));

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // clipboard API not available
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="font-display font-black text-3xl text-white uppercase-heading mb-2 leading-tight">
                    {itinerary.title}
                </h1>
                {itinerary.summary && (
                    <p className="text-[var(--text-secondary)] leading-relaxed">{itinerary.summary}</p>
                )}
                <button
                    onClick={handleShare}
                    className="mt-4 text-sm px-4 py-1.5 rounded-full border border-[var(--border-medium)] text-[var(--text-secondary)] hover:text-white transition-colors"
                >
                    {copied ? '✓ Copied!' : 'Share Itinerary ↗'}
                </button>
            </div>

            {/* Day tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {itinerary.days.map((d, i) => (
                    <button
                        key={i}
                        onClick={() => setActiveDay(i)}
                        className={`px-5 py-2.5 rounded-full text-base font-medium transition-all ${
                            activeDay === i
                                ? 'bg-[var(--accent-red)] text-white'
                                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-white'
                        }`}
                    >
                        {d.dayLabel}
                    </button>
                ))}
            </div>

            {/* Timeline */}
            {day ? (
                <div className="space-y-0">
                    {day.slots.map((slot, i) => {
                        const isLast = i === day.slots.length - 1;
                        const dotColor = slot.type === 'session' ? '#E10600' : '#00D2BE';

                        return (
                            <div key={i} className="flex gap-4">
                                {/* Time */}
                                <div className="w-20 shrink-0 pt-3 text-right">
                                    <span className="text-base mono-data text-[var(--text-secondary)]">
                                        {formatTime(slot.startTime)}
                                    </span>
                                </div>

                                {/* Timeline dot + line */}
                                <div className="relative flex flex-col items-center">
                                    <div
                                        className="w-3 h-3 rounded-full mt-3 shrink-0 ring-2 ring-[var(--bg-primary)]"
                                        style={{ backgroundColor: dotColor }}
                                    />
                                    {!isLast && (
                                        <div
                                            className="w-px flex-1 mt-1 min-h-6"
                                            style={{ backgroundColor: `${dotColor}30` }}
                                        />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 pb-4">
                                    {slot.type === 'session'
                                        ? <SessionBlock slot={slot} />
                                        : <GapBlock slot={slot} expMap={expMap} />
                                    }
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-[var(--text-secondary)] text-sm">No slots for this day.</p>
            )}

            {/* Book All section */}
            {allSuggestedExps.length > 0 && (
                <div className="mt-10 pt-8 border-t border-[var(--border-subtle)]">
                    <h2 className="font-display font-bold text-white text-xl mb-1">Your Experiences</h2>
                    <p className="text-sm text-[var(--text-secondary)] mb-5">
                        Lock in your plan — book before race week sells out
                    </p>
                    <div className="space-y-3">
                        {allSuggestedExps.map(exp => (
                            <div
                                key={exp.id}
                                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="text-2xl leading-none shrink-0">{exp.imageEmoji}</span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{exp.title}</p>
                                        <p className="text-xs text-[var(--text-secondary)]">
                                            {exp.priceLabel} · {exp.durationLabel}
                                        </p>
                                    </div>
                                </div>
                                <BookButton
                                    experience={exp}
                                    source="itinerary"
                                    label="Book →"
                                    className="shrink-0 px-4 py-2 rounded-full text-sm font-medium bg-[var(--accent-red)] hover:bg-[var(--accent-red-hover)] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function SessionBlock({ slot }: { slot: SessionSlot }) {
    return (
        <div className="rounded-lg border border-[#E1060030] bg-[#E1060010] p-3">
            <p className="text-sm text-[#E10600] font-medium mb-1">🏎 {slot.series}</p>
            <p className="font-bold text-white text-base">{slot.name}</p>
            <p className="text-base mono-data text-white/60 mt-0.5">
                {formatTime(slot.startTime)} – {formatTime(slot.endTime)} AEDT
            </p>
        </div>
    );
}

function GapBlock({ slot, expMap }: { slot: GapSlot; expMap: Record<number, Experience> }) {
    const suggestionIds = slot.suggestionIds ?? [];
    const suggestions = suggestionIds
        .map(id => expMap[id])
        .filter((e): e is Experience => Boolean(e));

    return (
        <div>
            <p className="text-sm text-[var(--accent-teal)] font-medium mb-2">
                ✦ Free Window
            </p>
            <p className="text-base text-[var(--text-secondary)] mb-3">{slot.windowLabel}</p>

            {suggestions.length > 0 && (
                <div className="space-y-2">
                    {suggestions.map(exp => (
                        <ExperienceCard key={exp.id} exp={exp} />
                    ))}
                </div>
            )}
        </div>
    );
}

function ExperienceCard({ exp }: { exp: Experience }) {
    return (
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-3">
            <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-semibold text-white text-base">
                    {exp.imageEmoji} {exp.title}
                </p>
                {exp.distanceKm != null && (
                    <span className="text-sm mono-data text-[var(--accent-teal)] bg-[var(--accent-teal-muted)] px-2 py-0.5 rounded-full shrink-0">
                        {exp.distanceKm < 10
                            ? `${exp.distanceKm.toFixed(1)} km`
                            : `${Math.round(exp.distanceKm)} km`
                        }
                    </span>
                )}
            </div>

            <p className="text-sm text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                {exp.shortDescription}
            </p>

            <div className="flex items-center gap-3 mt-2 text-sm text-white/60">
                <span>{exp.durationLabel}</span>
                <span>{exp.priceLabel}</span>
                <span>★ {exp.rating.toFixed(1)}</span>
                {exp.travelMins != null && (
                    <span>{exp.travelMins} min away</span>
                )}
            </div>

            {exp.affiliateUrl && (
                <div className="mt-3">
                    <BookButton
                        experience={exp}
                        source="itinerary"
                        label="Book →"
                        className="text-sm px-3 py-1.5 rounded-full font-medium bg-[var(--accent-red)] hover:bg-[var(--accent-red-hover)] text-white transition-colors"
                    />
                </div>
            )}
        </div>
    );
}
