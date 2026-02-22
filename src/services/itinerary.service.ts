import { db } from '@/lib/db';
import { itineraries } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createHash } from 'crypto';
import type { Itinerary, ItineraryInput } from '@/types/itinerary';
import { generateId } from '@/lib/utils';
import { generateText } from '@/lib/llm';
import { getRaceBySlug, getSessionsByRace, getWindowsByRace } from '@/services/race.service';
import { getExperiencesByRace } from '@/services/experience.service';

function buildPrompt(
  input: ItineraryInput,
  sessions: Awaited<ReturnType<typeof getSessionsByRace>>,
  experiences: Awaited<ReturnType<typeof getExperiencesByRace>>,
  windows: Awaited<ReturnType<typeof getWindowsByRace>>
): { system: string; user: string } {
  const system = `You are an expert F1 travel planner. You create personalized day-by-day race weekend itineraries for Melbourne Grand Prix attendees. You know Albert Park circuit, Melbourne's neighbourhoods, and how to balance F1 sessions with sightseeing. Always respond with valid JSON only — no prose, no markdown code fences.`;

  const sessionList = sessions
    .map((s) => `- ${s.dayOfWeek}: ${s.name} ${s.startTime}–${s.endTime} AEDT`)
    .join('\n');

  const windowList = windows
    .map(
      (w) =>
        `- ${w.slug} (${w.dayOfWeek}): "${w.label}" ${w.startTime ?? ''}–${w.endTime ?? ''}, max ${w.maxDurationHours}h — ${w.description}`
    )
    .join('\n');

  const expList = experiences
    .slice(0, 25)
    .map(
      (e) =>
        `- ID:${e.id} "${e.title}" [${e.category}] ${e.durationLabel} ${e.priceLabel} ★${e.rating} — ${e.shortDescription}`
    )
    .join('\n');

  const user = `Create an F1 race weekend itinerary for 2026 Australian Grand Prix in Melbourne.

Visitor profile:
- Arrival: ${input.arrivalDay}
- Departure: ${input.departureDay}
- Interests: ${input.interests.join(', ')}
- Group size: ${input.groupSize ?? 1}${input.freeText ? `\n- Notes: ${input.freeText}` : ''}

F1 Sessions (mandatory to include):
${sessionList}

Free time windows available (only include days visitor is present):
${windowList}

Available experiences (choose ones matching interests):
${expList}

Return ONLY valid JSON in this exact shape:
{
  "title": "string",
  "summary": "2-3 sentence overview of the trip",
  "days": [
    {
      "date": "YYYY-MM-DD",
      "dayLabel": "Thursday",
      "slots": [
        {
          "type": "session|experience|free",
          "experienceId": 123,
          "startTime": "HH:MM",
          "endTime": "HH:MM",
          "note": "short description"
        }
      ]
    }
  ]
}

Rules:
- Only include days from arrival to departure (inclusive)
- Include all F1 sessions that occur on days the visitor is present
- Fill gaps with experiences matching their interests
- experienceId is only included for type "experience" slots
- note is required for all slots`;

  return { system, user };
}

export async function createItinerary(input: ItineraryInput): Promise<Itinerary> {
  const race = await getRaceBySlug(input.raceSlug);
  if (!race) throw new Error(`Race not found: ${input.raceSlug}`);

  const [sessions, windows, allExperiences] = await Promise.all([
    getSessionsByRace(race.id),
    getWindowsByRace(race.id),
    getExperiencesByRace(race.id),
  ]);

  // Deduplication by prompt hash
  const promptStr = JSON.stringify({ ...input, raceId: race.id });
  const promptHash = createHash('sha256').update(promptStr).digest('hex');

  const existing = await db
    .select()
    .from(itineraries)
    .where(eq(itineraries.prompt_hash, promptHash))
    .limit(1);

  if (existing[0]) {
    return existing[0].itinerary_json as Itinerary;
  }

  const { system, user } = buildPrompt(input, sessions, allExperiences, windows);
  const raw = await generateText(system, user);

  // Extract JSON from response (in case model adds prose)
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('LLM did not return valid JSON');

  const parsed = JSON.parse(jsonMatch[0]) as Omit<Itinerary, 'id'>;
  const id = generateId();
  const itinerary: Itinerary = { id, ...parsed };

  await db.insert(itineraries).values({
    id,
    race_id: race.id,
    arrival_day: input.arrivalDay,
    departure_day: input.departureDay,
    interests: input.interests,
    group_size: input.groupSize ?? 1,
    itinerary_json: itinerary,
    prompt_hash: promptHash,
    generation_model: 'claude-sonnet',
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
