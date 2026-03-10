import ItineraryForm from '@/components/itinerary/ItineraryForm';
import { getAvailableRaces, getSessionsByRace } from '@/services/race.service';
import { getActiveRaceSlug } from '@/lib/activeRace';
import type { Race, Session } from '@/types/race';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Build Itinerary | F1 Weekend',
    description: 'Pick your F1 sessions and we\'ll fill the gaps with the best race city experiences.',
    robots: { index: false, follow: true },
};

interface Props {
    searchParams: Promise<{ race?: string }>;
}

export default async function ItineraryPage({ searchParams }: Props) {
    const { race: raceParam } = await searchParams;
    const [races, activeRaceSlug] = await Promise.all([
        getAvailableRaces(),
        getActiveRaceSlug(),
    ]);
    const defaultRaceSlug = raceParam ?? activeRaceSlug;

    // For each race, fetch sessions and build a slug → sessions map
    const sessionsByRace: Record<string, Session[]> = {};
    await Promise.all(
        races.map(async (race: Race) => {
            const all = await getSessionsByRace(race.id);
            sessionsByRace[race.slug] = all.filter(s =>
                ['practice', 'qualifying', 'sprint', 'race'].includes(s.sessionType)
            );
        })
    );

    return (
        <div className="min-h-screen pt-24 pb-24 px-4">
            <div className="max-w-xl mx-auto">
                <div className="mb-10">
                    <p className="text-xs font-medium uppercase-label text-[var(--accent-teal)] mb-2">
                        Weekend Planner
                    </p>
                    <h1 className="font-display font-black text-4xl text-white uppercase-heading leading-tight">
                        Build Your<br />Itinerary
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-3">
                        Pick your race, select your sessions, and we&apos;ll fill the gaps with the best experiences.
                    </p>
                </div>

                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6 md:p-8">
                    <ItineraryForm
                        races={races}
                        sessionsByRace={sessionsByRace}
                        defaultRaceSlug={defaultRaceSlug}
                    />
                </div>
            </div>
        </div>
    );
}
