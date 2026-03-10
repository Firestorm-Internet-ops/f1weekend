import { fetchOpenF1 } from '@/lib/openf1';
import { formatLapTime } from '@/lib/utils';

interface Lap {
    lap_duration: number | null;
    st_speed: number | null;
}

interface PitStop {
    driver_number: number;
}

interface DataInsightsProps {
    countryName: string;
    year: number;
    circuitName: string;
}

export default async function DataInsights({ countryName, year, circuitName }: DataInsightsProps) {
    // 1. Get session_key — returns null if race hasn't happened yet
    const sessions = await fetchOpenF1('sessions', { country_name: countryName, year, session_name: 'Race' });
    const sessionKey = sessions?.[0]?.session_key;
    if (!sessionKey) return null;

    // 2. Fetch laps + pit data in parallel
    const [lapsData, pitData] = await Promise.all([
        fetchOpenF1('laps', { session_key: sessionKey }) as Promise<Lap[] | null>,
        fetchOpenF1('pit', { session_key: sessionKey }) as Promise<PitStop[] | null>,
    ]);

    // 3. Process
    const validLaps = lapsData?.filter((l): l is Lap & { lap_duration: number } => l.lap_duration != null && l.lap_duration > 0) ?? [];
    const minDuration = validLaps.length > 0 ? Math.min(...validLaps.map(l => l.lap_duration)) : null;
    const fastestLap = minDuration != null ? formatLapTime(minDuration) : null;

    const speedReadings = lapsData?.map(l => l.st_speed).filter((s): s is number => s != null && s > 0) ?? [];
    const topSpeed = speedReadings.length > 0 ? Math.max(...speedReadings) : null;

    let winningStrategy: number | null = null;
    if (pitData && pitData.length > 0) {
        const stopsByDriver = pitData.reduce((acc: Record<number, number>, stop) => {
            acc[stop.driver_number] = (acc[stop.driver_number] || 0) + 1;
            return acc;
        }, {});
        const stopCounts = Object.values(stopsByDriver);
        const modeMap: Record<number, number> = {};
        let maxCount = 0;
        let mode = 0;
        for (const count of stopCounts) {
            modeMap[count] = (modeMap[count] || 0) + 1;
            if (modeMap[count] > maxCount) { maxCount = modeMap[count]; mode = count; }
        }
        winningStrategy = mode;
    }

    const insights = [
        { label: `${year} Top Speed`,    value: topSpeed ? `${topSpeed} km/h` : null },
        { label: `${year} Fastest Lap`,  value: fastestLap },
        { label: 'Winning Strategy',     value: winningStrategy ? `${winningStrategy}-stop` : null },
    ].filter(i => i.value !== null);

    // Nothing to show — hide the section entirely
    if (insights.length === 0) return null;

    return (
        <section className="mb-12 border-t border-[var(--border-subtle)] pt-10">
            <h2 className="font-display font-bold text-2xl text-white uppercase-heading mb-4">
                Data Insights from the {year} Race
            </h2>
            <p className="text-[var(--text-secondary)] text-base leading-relaxed mb-6">
                Based on historical data from the {year} {countryName} Grand Prix via OpenF1, here is what to expect at {circuitName} in {year}.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {insights.map(({ label, value }) => (
                    <div key={label} className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                        <p className="text-xs font-medium uppercase-label text-[var(--text-secondary)] mb-1">{label}</p>
                        <p className="font-display font-bold text-white text-sm">{String(value)}</p>
                    </div>
                ))}
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
                *Data reflects the {year} {countryName} Grand Prix, sourced from the OpenF1 API. This is an unofficial community project.
            </p>
        </section>
    );
}
