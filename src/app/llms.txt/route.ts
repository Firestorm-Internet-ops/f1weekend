import { getAvailableRaces } from '@/services/race.service';
import { isRaceOver } from '@/data/calendar-2026';
import { raceKey } from '@/lib/race-url';

export const revalidate = 3600;

const SITE = 'https://f1weekend.co';

/**
 * llms.txt (https://llmstxt.org): a plain-text map of the site for AI answer
 * engines — what F1 Weekend is and where the useful pages for each race are.
 */
export async function GET() {
  // Each race on its current or next weekend (next season once F1 publishes it).
  const races = await getAvailableRaces();
  const now = new Date();
  const upcoming = races.filter((r) => !isRaceOver(r, now));
  const past = races.filter((r) => isRaceOver(r, now));

  const line = (r: (typeof races)[number]) => {
    const when = r.startDate ? `${r.startDate} to ${r.raceDate}` : r.raceDate;
    const venue = `${r.circuitName}, ${r.city}`;
    return [
      `- [${r.name} ${r.season}](${SITE}/races/${raceKey(r.slug)}): ${venue}, ${when}. Race-weekend travel guide.`,
      `  - [Session times](${SITE}/races/${raceKey(r.slug)}/schedule)`,
      `  - [Getting to the circuit](${SITE}/races/${raceKey(r.slug)}/getting-there)`,
      `  - [Things to do on race weekend](${SITE}/races/${raceKey(r.slug)}/experiences)`,
    ].join('\n');
  };

  const body = `# F1 Weekend

> Travel companion for Formula 1 race weekends: session times in track time, how to reach each circuit, and bookable things to do in the race city between sessions (tours and tickets from GetYourGuide, Viator and Tiqets).

- Session times come from the official F1 timetable (via the Jolpica F1 API) and are shown in the circuit's local time.
- Bookings happen on the provider's site; F1 Weekend earns an affiliate commission and does not sell tickets itself.
- Published by Firestorm Internet (${SITE}/about). Contact: help@firestorm-internet.com.

## Upcoming races

${upcoming.map(line).join('\n')}

## Season overview

- [F1 2026 calendar: all races, cities and dates](${SITE}/f1-2026)

## Recent races

${past.map((r) => `- [${r.name} ${r.season}](${SITE}/races/${raceKey(r.slug)})`).join('\n')}
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
