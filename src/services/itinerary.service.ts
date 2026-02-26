import { db } from '@/lib/db';
import { itineraries } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { Itinerary, ManualItineraryInput, SessionSlot, GapSlot } from '@/types/itinerary';
import { generateId } from '@/lib/utils';
import { getRaceBySlug, getSessionsByRace, getWindowsByRace } from '@/services/race.service';
import { getExperiencesByWindow } from '@/services/experience.service';
import type { ExperienceWindow } from '@/types/race';

const DAY_ORDER = ['Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
const SESSION_DAYS = ['Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
const DAY_START = '08:00';
const DAY_END = '22:00';

// Compute race day dates from the race's race_date (Sunday = race day).
// Thursday = -3 days, Friday = -2, Saturday = -1, Sunday = 0.
function computeRaceDates(raceDateStr: string): Record<string, string> {
    const DAYS = ['Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
    const OFFSETS = [-3, -2, -1, 0];
    const result: Record<string, string> = {};
    for (let i = 0; i < DAYS.length; i++) {
        const d = new Date(raceDateStr + 'T00:00:00Z');
        d.setUTCDate(d.getUTCDate() + OFFSETS[i]);
        result[DAYS[i]] = d.toISOString().split('T')[0];
    }
    return result;
}

function timeToMinutes(t: string): number {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

function overlapMinutes(
    startA: string, endA: string,
    startB: string | null, endB: string | null,
): number {
    if (!startB || !endB) return 0;
    const a = timeToMinutes(startA);
    const b = timeToMinutes(endA);
    const c = timeToMinutes(startB);
    const d = timeToMinutes(endB);
    return Math.max(0, Math.min(b, d) - Math.max(a, c));
}

// Find the window with the most overlap (>= 30 min) for a given gap + day
function findBestWindow(
    gapStart: string,
    gapEnd: string,
    day: string,
    windows: ExperienceWindow[],
): ExperienceWindow | null {
    const dayWindows = windows.filter(w => w.dayOfWeek === day);
    let best: ExperienceWindow | null = null;
    let bestOverlap = 29; // require at least 30 min

    for (const w of dayWindows) {
        const overlap = overlapMinutes(gapStart, gapEnd, w.startTime, w.endTime);
        if (overlap > bestOverlap) {
            bestOverlap = overlap;
            best = w;
        }
    }
    return best;
}

export async function buildManualItinerary(input: ManualItineraryInput): Promise<Itinerary> {
    const race = await getRaceBySlug(input.raceSlug);
    if (!race) throw new Error(`Race not found: ${input.raceSlug}`);

    const RACE_DATES = computeRaceDates(race.raceDate);

    const [allSessions, windows] = await Promise.all([
        getSessionsByRace(race.id),
        getWindowsByRace(race.id),
    ]);

    // Determine which days the visitor is present
    const arrivalIdx  = DAY_ORDER.indexOf(input.arrivalDay  as typeof DAY_ORDER[number]);
    const departureIdx = DAY_ORDER.indexOf(input.departureDay as typeof DAY_ORDER[number]);
    const presentDays = DAY_ORDER.slice(arrivalIdx, departureIdx + 1);
    const activeDays  = presentDays.filter(d => (SESSION_DAYS as readonly string[]).includes(d));

    const days = [];

    for (const day of activeDays) {
        // Sessions the user selected on this day, sorted by start time
        const daySessions = allSessions
            .filter(s => s.dayOfWeek === day && input.sessionIds.includes(s.id))
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

        // Compute gaps: time not covered by selected sessions
        type TimeBlock = { start: string; end: string };
        const gapBlocks: TimeBlock[] = [];
        let cursor = DAY_START;

        for (const s of daySessions) {
            if (cursor < s.startTime) {
                gapBlocks.push({ start: cursor, end: s.startTime });
            }
            cursor = s.endTime;
        }
        if (cursor < DAY_END) {
            gapBlocks.push({ start: cursor, end: DAY_END });
        }

        // Build gap slots
        const gapSlots: GapSlot[] = [];
        for (const gap of gapBlocks) {
            const window = findBestWindow(gap.start, gap.end, day, windows);
            if (!window) continue;

            const windowExperiences = await getExperiencesByWindow(window.slug, race.id);
            const suggestionIds = windowExperiences.slice(0, 3).map(e => e.id);

            gapSlots.push({
                type: 'gap',
                startTime: gap.start,
                endTime: gap.end,
                windowLabel: window.label,
                suggestionIds,
            });
        }

        // Build session slots
        const sessionSlots: SessionSlot[] = daySessions.map(s => ({
            type: 'session',
            startTime: s.startTime,
            endTime: s.endTime,
            name: s.name,
            shortName: s.shortName,
            series: 'Formula 1',
        }));

        // Merge and sort by startTime
        const slots = [...gapSlots, ...sessionSlots].sort((a, b) =>
            a.startTime.localeCompare(b.startTime)
        );

        days.push({
            date: RACE_DATES[day] ?? '',
            dayLabel: day,
            slots,
        });
    }

    const id = generateId();
    const title = `${race.city} ${race.season} — ${input.arrivalDay} to ${input.departureDay}`;
    const itinerary: Itinerary = { id, title, days };

    await db.insert(itineraries).values({
        id,
        race_id: race.id,
        arrival_day: input.arrivalDay,
        departure_day: input.departureDay,
        interests: null,
        group_size: 1,
        itinerary_json: itinerary,
        prompt_hash: null,
        generation_model: 'manual',
    });

    return itinerary;
}

export async function getItinerary(id: string): Promise<Itinerary | null> {
    const result = await db
        .select()
        .from(itineraries)
        .where(eq(itineraries.id, id))
        .limit(1);

    if (!result[0]) return null;

    // Increment view count (fire and forget)
    db.update(itineraries)
        .set({ view_count: (result[0].view_count ?? 0) + 1 })
        .where(eq(itineraries.id, id))
        .catch(() => {});

    return result[0].itinerary_json as Itinerary;
}
