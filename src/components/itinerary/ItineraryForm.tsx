'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Session } from '@/types/race';
import type { Itinerary, ManualItineraryInput } from '@/types/itinerary';
import LocalTime from '@/components/race/LocalTime';
import ItineraryView from '@/components/itinerary/ItineraryView';
import { raceKey } from '@/lib/race-url';

const ARRIVAL_DAYS = ['Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
const DEPARTURE_DAYS = ['Sunday', 'Monday', 'Tuesday'] as const;
const WEEKEND = ['Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

type ArrivalDay = typeof ARRIVAL_DAYS[number];
type DepartureDay = typeof DEPARTURE_DAYS[number];

export interface FormRace {
    slug: string;
    name: string;
    city: string;
    flag: string;
    shortCode: string;
    dates: string;
}

interface Props {
    /** Upcoming races; choosing one reloads the page with its sessions. */
    races: FormRace[];
    raceSlug: string;
    /** This race's F1 sessions (track time). */
    sessions: Session[];
    /** Session id → start as an ISO instant, for "your time". */
    sessionIso: Record<number, string>;
    trackTz: string;
    tzLabel: string;
    /** Choices carried by an "Edit" link. */
    initial?: Partial<ManualItineraryInput>;
}

const isHeadline = (s: Session) => s.sessionType === 'race' || s.sessionType === 'qualifying';

export default function ItineraryForm({ races, raceSlug, sessions, sessionIso, trackTz, tzLabel, initial }: Props) {
    const router = useRouter();
    const race = races.find((r) => r.slug === raceSlug);
    const [arrivalDay, setArrivalDay] = useState<ArrivalDay>((initial?.arrivalDay as ArrivalDay) ?? 'Thursday');
    const [departureDay, setDepartureDay] = useState<DepartureDay>(initial?.departureDay ?? 'Sunday');
    const [selectedIds, setSelectedIds] = useState<Set<number>>(
        () => new Set(initial?.sessionIds ?? sessions.filter(isHeadline).map((s) => s.id)),
    );
    const [loading, setLoading] = useState<'quick' | 'form' | null>(null);
    const [error, setError] = useState('');
    const [unsaved, setUnsaved] = useState<Itinerary | null>(null);

    // Weekend days the visitor is there for (arrival day onwards; every departure day is Sunday or later).
    const fromIdx = WEEKEND.indexOf(arrivalDay as typeof WEEKEND[number]);
    const presentDays = WEEKEND.slice(fromIdx === -1 ? 0 : fromIdx);
    const sessionsByDay = presentDays
        .map((day) => ({ day, list: sessions.filter((s) => s.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime)) }))
        .filter((d) => d.list.length > 0);
    // Sessions before the arrival day can't be attended.
    const chosen = [...selectedIds].filter((id) => sessions.some((s) => s.id === id && (presentDays as readonly string[]).includes(s.dayOfWeek)));

    const toggleSession = (id: number) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    async function build(input: ManualItineraryInput, mode: 'quick' | 'form') {
        setError('');
        setLoading(mode);
        try {
            const res = await fetch('/api/itinerary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(input),
            });
            if (!res.ok) throw new Error('Failed to build itinerary');
            const data = (await res.json()) as { id: string | null; itinerary?: Itinerary };
            if (data.id) {
                router.push(`/itinerary/${data.id}`);
                return;
            }
            // Built but not saved: show it here rather than an error.
            if (data.itinerary) setUnsaved(data.itinerary);
            setLoading(null);
        } catch {
            setError('Failed to build your plan. Please try again.');
            setLoading(null);
        }
    }

    const quickPlan = () => {
        const ids = sessions.filter(isHeadline).map((s) => s.id);
        build({ raceSlug, arrivalDay: 'Thursday', departureDay: 'Sunday', sessionIds: ids.length ? ids : sessions.map((s) => s.id) }, 'quick');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (chosen.length === 0) {
            setError('Pick at least one session.');
            return;
        }
        build({ raceSlug, arrivalDay, departureDay, sessionIds: chosen }, 'form');
    };

    if (unsaved) {
        return (
            <div>
                <p className="text-sm text-[var(--text-secondary)] mb-6 rounded-lg bg-[var(--bg-tertiary)] px-4 py-3">
                    Here&apos;s your plan. We couldn&apos;t save it just now, so it has no link to share. Take a screenshot or try again later.
                </p>
                <ItineraryView itinerary={unsaved} experiences={[]} tzLabel={tzLabel} />
            </div>
        );
    }

    const dayBtnClass = (active: boolean) =>
        `px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
            active
                ? 'border-[var(--accent-red)] bg-[var(--accent-red-muted)] text-[var(--accent-red)]'
                : 'border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--border-medium)] hover:text-[var(--text-primary)]'
        }`;

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Race */}
            <div>
                <label htmlFor="race" className="block text-xs font-medium uppercase-label text-[var(--text-secondary)] mb-3">RACE</label>
                <select
                    id="race"
                    value={raceSlug}
                    onChange={(e) => router.push(`/itinerary?race=${raceKey(e.target.value)}`)}
                    className="w-full px-4 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-sm font-medium text-[var(--text-primary)]"
                >
                    {races.map((r) => (
                        <option key={r.slug} value={r.slug}>
                            {r.flag} {r.name} · {r.city} · {r.dates}
                        </option>
                    ))}
                </select>
            </div>

            {/* One tap */}
            <div className="rounded-xl border border-[var(--accent-red)]/30 bg-[var(--accent-red-muted)] p-4">
                <p className="text-sm text-[var(--text-primary)] font-medium">Don&apos;t want to choose?</p>
                <p className="text-sm text-[var(--text-secondary)] mt-0.5 mb-3">
                    Thursday to Sunday, watching qualifying and the race{race ? ` in ${race.city}` : ''}.
                </p>
                <button
                    type="button"
                    onClick={quickPlan}
                    disabled={loading !== null || sessions.length === 0}
                    className="w-full py-2.5 rounded-full font-semibold text-sm bg-[var(--accent-red)] hover:bg-[var(--accent-red-hover)] text-white transition-colors disabled:opacity-50"
                >
                    {loading === 'quick' ? 'Planning…' : 'Plan my weekend in one tap →'}
                </button>
            </div>

            <p className="text-xs uppercase-label text-center text-[var(--text-muted)]">or choose yourself</p>

            {/* Arrival */}
            <fieldset>
                <legend className="block text-xs font-medium uppercase-label text-[var(--text-secondary)] mb-3">ARRIVING</legend>
                <div className="flex gap-2 flex-wrap">
                    {ARRIVAL_DAYS.map((day) => (
                        <button key={day} type="button" aria-pressed={arrivalDay === day} onClick={() => setArrivalDay(day)} className={dayBtnClass(arrivalDay === day)}>
                            {day}
                        </button>
                    ))}
                </div>
            </fieldset>

            {/* Departure */}
            <fieldset>
                <legend className="block text-xs font-medium uppercase-label text-[var(--text-secondary)] mb-3">LEAVING</legend>
                <div className="flex gap-2 flex-wrap">
                    {DEPARTURE_DAYS.map((day) => (
                        <button key={day} type="button" aria-pressed={departureDay === day} onClick={() => setDepartureDay(day)} className={dayBtnClass(departureDay === day)}>
                            {day}
                        </button>
                    ))}
                </div>
                {departureDay !== 'Sunday' && (
                    <p className="text-xs text-[var(--text-secondary)] mt-2">We&apos;ll add ideas for {departureDay === 'Monday' ? 'Monday' : 'Monday and Tuesday'} too.</p>
                )}
            </fieldset>

            {/* Sessions */}
            <fieldset>
                <legend className="block text-xs font-medium uppercase-label text-[var(--text-secondary)] mb-1">SESSIONS YOU&apos;RE WATCHING</legend>
                <p className="text-xs text-[var(--text-muted)] mb-3">Times are track time ({tzLabel}).</p>
                {sessionsByDay.length === 0 ? (
                    <p className="text-sm text-[var(--text-secondary)]">
                        {sessions.length === 0 ? 'The session times aren’t published yet.' : 'No F1 sessions from your arrival day.'}
                    </p>
                ) : (
                    <div className="space-y-5">
                        {sessionsByDay.map(({ day, list }) => (
                            <div key={day}>
                                <p className="text-sm font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wider">{day}</p>
                                <div className="space-y-2">
                                    {list.map((s) => {
                                        const on = selectedIds.has(s.id);
                                        return (
                                            <button
                                                key={s.id}
                                                type="button"
                                                role="checkbox"
                                                aria-checked={on}
                                                onClick={() => toggleSession(s.id)}
                                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all ${
                                                    on
                                                        ? 'border-[var(--accent-red)] bg-[var(--accent-red-muted)] text-[var(--text-primary)]'
                                                        : 'border-[var(--border-subtle)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:border-[var(--border-medium)] hover:text-[var(--text-primary)]'
                                                }`}
                                            >
                                                <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${on ? 'bg-[var(--accent-red)] border-[var(--accent-red)]' : 'border-[var(--border-medium)]'}`}>
                                                    {on && <span className="text-white text-[10px] leading-none font-bold">✓</span>}
                                                </span>
                                                <span className="font-medium text-sm flex-1">
                                                    {s.shortName}
                                                    <span className="font-normal text-[var(--text-secondary)] ml-1.5 text-xs">{s.name}</span>
                                                </span>
                                                <span className="text-right shrink-0">
                                                    <span className="block text-sm text-[var(--text-secondary)] mono-data">{s.startTime} – {s.endTime}</span>
                                                    {sessionIso[s.id] && <LocalTime iso={sessionIso[s.id]} trackTz={trackTz} />}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </fieldset>

            {error && <p className="text-sm text-[var(--accent-red)]">{error}</p>}

            <button
                type="submit"
                disabled={loading !== null || chosen.length === 0}
                className="w-full py-3 rounded-full font-display font-bold text-lg bg-[var(--accent-red)] hover:bg-[var(--accent-red-hover)] text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
                {loading === 'form' ? 'Building your plan…' : chosen.length === 0 ? 'Pick at least one session' : 'Build my plan'}
            </button>
        </form>
    );
}
