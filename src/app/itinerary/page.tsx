import ItineraryForm, { type FormRace } from '@/components/itinerary/ItineraryForm';
import { getAvailableRaces, getSessionsByRace } from '@/services/race.service';
import { getActiveRaceSlug } from '@/lib/activeRace';
import { isRaceOver } from '@/data/calendar-2026';
import { formatRaceDates, getTimezoneAbbr, sessionToUtcDate } from '@/lib/utils';
import type { ManualItineraryInput } from '@/types/itinerary';
import { raceKey } from '@/lib/race-url';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: { absolute: 'Plan Your F1 Race Weekend | F1 Weekend' },
    description: 'Pick your F1 sessions and we\'ll fill the gaps with the best race city experiences.',
    robots: { index: false, follow: true },
};

interface Props {
    searchParams: Promise<{ race?: string; arrive?: string; depart?: string; sessions?: string }>;
}

const ARRIVE = ['Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
const DEPART = ['Sunday', 'Monday', 'Tuesday'] as const;
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Calendar date (YYYY-MM-DD) of a weekday in the race's week, counting from race day (Sunday or Saturday). */
function dateOfDay(raceDate: string, day: string): string {
    const race = new Date(`${raceDate}T00:00:00Z`);
    const want = WEEKDAYS.indexOf(day);
    let diff = want - race.getUTCDay();
    if (diff > 2) diff -= 7; // Thursday before a Sunday race, not after
    const d = new Date(race);
    d.setUTCDate(d.getUTCDate() + diff);
    return d.toISOString().slice(0, 10);
}

export default async function ItineraryPage({ searchParams }: Props) {
    const sp = await searchParams;
    const [available, activeRaceSlug] = await Promise.all([getAvailableRaces(), getActiveRaceSlug()]);

    // Only races still to come can be planned (after the season, keep them all).
    const now = new Date();
    const upcoming = available.filter((r) => !isRaceOver(r, now));
    const races = upcoming.length > 0 ? upcoming : available;
    // ?race= may be the URL key ("bahrain") or the full slug.
    const race = races.find((r) => r.slug === sp.race || raceKey(r.slug) === sp.race) ?? races.find((r) => r.slug === activeRaceSlug) ?? races[0];

    // Only this race's sessions: switching race reloads the page for the new one.
    const sessions = race
        ? (await getSessionsByRace(race.id)).filter((s) => ['practice', 'qualifying', 'sprint', 'race'].includes(s.sessionType))
        : [];
    const sessionIso: Record<number, string> = {};
    if (race) for (const s of sessions) sessionIso[s.id] = sessionToUtcDate(dateOfDay(race.raceDate, s.dayOfWeek), s.startTime, race.timezone).toISOString();

    // "Edit" links carry the previous choices.
    const ids = (sp.sessions ?? '').split(',').map(Number).filter((n) => sessions.some((s) => s.id === n));
    const initial: Partial<ManualItineraryInput> = {
        arrivalDay: (ARRIVE as readonly string[]).includes(sp.arrive ?? '') ? (sp.arrive as ManualItineraryInput['arrivalDay']) : undefined,
        departureDay: (DEPART as readonly string[]).includes(sp.depart ?? '') ? (sp.depart as ManualItineraryInput['departureDay']) : undefined,
        sessionIds: ids.length > 0 ? ids : undefined,
    };

    const formRaces: FormRace[] = races.map((r) => ({
        slug: r.slug, name: r.name, city: r.city, flag: r.flag ?? '', shortCode: r.shortCode ?? '',
        dates: formatRaceDates(r.raceDate, r.hasThursdayFreeDay),
    }));

    return (
        <div className="min-h-screen pt-24 pb-24 px-4">
            <div className="max-w-xl mx-auto">
                <div className="mb-8">
                    <p className="text-xs font-medium uppercase-label text-[var(--accent-red)] mb-2">
                        Weekend Planner
                    </p>
                    <h1 className="font-display font-black text-4xl text-[var(--text-primary)] uppercase-heading leading-tight">
                        Plan your<br />race weekend
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-3">
                        Tell us which sessions you&apos;re watching and we&apos;ll fill the time around them with things to do
                        {race ? ` in ${race.city}` : ''}, each one checked to fit the gap.
                    </p>
                </div>

                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6 md:p-8">
                    {race ? (
                        <ItineraryForm
                            key={race.slug}
                            races={formRaces}
                            raceSlug={race.slug}
                            sessions={sessions}
                            sessionIso={sessionIso}
                            trackTz={race.timezone}
                            tzLabel={getTimezoneAbbr(race.timezone, new Date(`${race.raceDate}T12:00:00Z`))}
                            initial={initial}
                        />
                    ) : (
                        <p className="text-[var(--text-secondary)]">No upcoming races to plan right now.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
