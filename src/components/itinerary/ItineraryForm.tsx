'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Session } from '@/types/race';

const ARRIVAL_DAYS = ['Wednesday', 'Thursday', 'Friday'] as const;
const DEPARTURE_DAYS = ['Sunday', 'Monday', 'Tuesday'] as const;
const DAY_ORDER = ['Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
const SESSION_DAYS = ['Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

type ArrivalDay = typeof ARRIVAL_DAYS[number];
type DepartureDay = typeof DEPARTURE_DAYS[number];

interface Props {
    sessions: Session[];
}

export default function ItineraryForm({ sessions }: Props) {
    const router = useRouter();
    const [arrivalDay, setArrivalDay] = useState<ArrivalDay>('Thursday');
    const [departureDay, setDepartureDay] = useState<DepartureDay>('Sunday');
    const [selectedIds, setSelectedIds] = useState<Set<number>>(
        () => new Set(
            sessions
                .filter(s => s.sessionType === 'race' || s.sessionType === 'qualifying')
                .map(s => s.id)
        )
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Days the visitor is present, filtered to race weekend days
    const arrivalIdx   = DAY_ORDER.indexOf(arrivalDay   as typeof DAY_ORDER[number]);
    const departureIdx = DAY_ORDER.indexOf(departureDay as typeof DAY_ORDER[number]);
    const activeDays = DAY_ORDER
        .slice(arrivalIdx, departureIdx + 1)
        .filter((d): d is typeof SESSION_DAYS[number] =>
            (SESSION_DAYS as readonly string[]).includes(d)
        );

    // Sessions grouped by day, only for active days
    const sessionsByDay = activeDays.reduce<Record<string, Session[]>>((acc, day) => {
        acc[day] = sessions.filter(s => s.dayOfWeek === day);
        return acc;
    }, {});

    const toggleSession = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedIds.size === 0) {
            setError('Please select at least one session.');
            return;
        }
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/itinerary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    raceSlug: 'melbourne-2026',
                    arrivalDay,
                    departureDay,
                    sessionIds: Array.from(selectedIds),
                }),
            });

            if (!res.ok) throw new Error('Failed to build itinerary');

            const { id } = await res.json();
            router.push(`/itinerary/${id}`);
        } catch {
            setError('Failed to build itinerary. Please try again.');
            setLoading(false);
        }
    };

    const dayBtnClass = (active: boolean) =>
        `px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
            active
                ? 'border-[var(--accent-teal)] bg-[var(--accent-teal-muted)] text-[var(--accent-teal)]'
                : 'border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--border-medium)] hover:text-white'
        }`;

    return (
        <form onSubmit={handleSubmit} className="space-y-8">

            {/* Arrival day */}
            <div>
                <label className="block text-xs font-medium uppercase-label text-[var(--text-muted)] mb-3">
                    ARRIVAL DAY
                </label>
                <div className="flex gap-2 flex-wrap">
                    {ARRIVAL_DAYS.map(day => (
                        <button
                            key={day}
                            type="button"
                            onClick={() => setArrivalDay(day)}
                            className={dayBtnClass(arrivalDay === day)}
                        >
                            {day}
                        </button>
                    ))}
                </div>
            </div>

            {/* Departure day */}
            <div>
                <label className="block text-xs font-medium uppercase-label text-[var(--text-muted)] mb-3">
                    DEPARTURE DAY
                </label>
                <div className="flex gap-2 flex-wrap">
                    {DEPARTURE_DAYS.map(day => (
                        <button
                            key={day}
                            type="button"
                            onClick={() => setDepartureDay(day)}
                            className={dayBtnClass(departureDay === day)}
                        >
                            {day}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sessions to attend */}
            <div>
                <label className="block text-xs font-medium uppercase-label text-[var(--text-muted)] mb-3">
                    SESSIONS TO ATTEND
                </label>

                {(() => {
                    const visibleDays = activeDays.filter(d => (sessionsByDay[d]?.length ?? 0) > 0);
                    if (activeDays.length === 0 || visibleDays.length === 0) {
                        return (
                            <p className="text-sm text-[var(--text-muted)]">
                                {sessions.length === 0
                                    ? 'Sessions unavailable — please refresh or try again.'
                                    : 'No F1 sessions on your selected days.'}
                            </p>
                        );
                    }
                    return (
                        <div className="space-y-5">
                            {activeDays.map(day => {
                                const daySessions = sessionsByDay[day] ?? [];
                                if (daySessions.length === 0) return null;
                                return (
                                    <div key={day}>
                                        <p className="text-xs font-medium text-[var(--text-muted)] mb-2 uppercase tracking-wider">
                                            {day}
                                        </p>
                                        <div className="space-y-2">
                                            {daySessions.map(session => {
                                                const isChecked   = selectedIds.has(session.id);
                                                const isMandatory = session.sessionType === 'race' || session.sessionType === 'qualifying';
                                                return (
                                                    <button
                                                        key={session.id}
                                                        type="button"
                                                        onClick={() => toggleSession(session.id)}
                                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all ${
                                                            isChecked
                                                                ? isMandatory
                                                                    ? 'border-[var(--accent-red)] bg-[#e1060012] text-white'
                                                                    : 'border-[var(--accent-teal)] bg-[var(--accent-teal-muted)] text-white'
                                                                : 'border-[var(--border-subtle)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:border-[var(--border-medium)] hover:text-white'
                                                        }`}
                                                    >
                                                        {/* Checkbox indicator */}
                                                        <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                                            isChecked
                                                                ? isMandatory
                                                                    ? 'bg-[var(--accent-red)] border-[var(--accent-red)]'
                                                                    : 'bg-[var(--accent-teal)] border-[var(--accent-teal)]'
                                                                : 'border-[var(--border-medium)]'
                                                        }`}>
                                                            {isChecked && (
                                                                <span className="text-white text-[10px] leading-none font-bold">✓</span>
                                                            )}
                                                        </span>

                                                        {/* Session name */}
                                                        <span className="font-medium text-sm flex-1">
                                                            {session.shortName}
                                                            <span className="font-normal text-[var(--text-muted)] ml-1.5 text-xs">
                                                                {session.name}
                                                            </span>
                                                        </span>

                                                        {/* Time */}
                                                        <span className="text-xs text-[var(--text-muted)] mono-data shrink-0">
                                                            {session.startTime} – {session.endTime}
                                                        </span>

                                                        {/* Must-see badge */}
                                                        {isMandatory && (
                                                            <span className="text-xs text-[var(--accent-red)] font-medium shrink-0">
                                                                Must-see
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })()}
            </div>

            {error && <p className="text-sm text-[var(--accent-red)]">{error}</p>}

            {selectedIds.size === 0 && sessions.length > 0 && (
                <p className="text-sm text-[var(--text-muted)] text-center -mb-4">
                    Select at least one session to continue
                </p>
            )}

            <button
                type="submit"
                disabled={loading || selectedIds.size === 0}
                className="w-full py-3 rounded-full font-display font-bold text-lg bg-[var(--accent-red)] hover:bg-[var(--accent-red-hover)] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Building your itinerary…
                    </span>
                ) : (
                    'Build My Itinerary ✦'
                )}
            </button>
        </form>
    );
}
