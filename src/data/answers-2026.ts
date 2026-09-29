/**
 * "Answer-first" pages (SEO experiment, see src/data/seo-experiments.ts): the
 * questions people actually search (Ahrefs, US, Sept 2026) as headings, each
 * with a direct 40–60-word answer. Dates, session times and picks come from
 * live data, so answers can't go stale; fixed facts are the circuit's own.
 */
import type { Race, Session } from '@/types/race';

export interface Answer {
  /** Heading, phrased like the search. */
  q: string;
  a: string;
  /** Anchor id for linking straight to the answer. */
  id: string;
  /** The searches this answers (for the experiment log). */
  searches: string[];
}

export interface AnswerContext {
  race: Race;
  /** This weekend's F1 sessions (track time). */
  sessions: Session[];
  /** Time zone abbreviation at the track, e.g. "CDT". */
  tzLabel: string;
  /** Titles of the current editorial picks. */
  picks: string[];
}

function longDate(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
}

function weekendRange(race: Race): string {
  const end = new Date(`${race.raceDate}T12:00:00Z`);
  const start = race.startDate ? new Date(`${race.startDate}T12:00:00Z`) : new Date(end.getTime() - 2 * 86_400_000);
  const month = end.toLocaleDateString('en-GB', { month: 'long', timeZone: 'UTC' });
  return `${start.getUTCDate()}–${end.getUTCDate()} ${month} ${race.season}`;
}

const wordCount = (s: string) => s.trim().split(/\s+/).length;

const byType = (sessions: Session[], type: Session['sessionType']) => sessions.find((s) => s.sessionType === type);

function usaAnswers({ race, sessions, tzLabel, picks }: AnswerContext): Answer[] {
  const grandPrix = byType(sessions, 'race');
  const quali = sessions.find((s) => s.sessionType === 'qualifying' && !/sprint/i.test(s.name));
  const sprint = byType(sessions, 'sprint');
  const timeAnswer = grandPrix
    ? `The ${race.season} United States Grand Prix starts on ${longDate(race.raceDate)} at ${grandPrix.startTime} Austin time (${tzLabel}).` +
      (quali ? ` Qualifying is on ${quali.dayOfWeek} at ${quali.startTime}` : '') +
      (sprint ? `, and the Sprint on ${sprint.dayOfWeek} at ${sprint.startTime}` : '') +
      (quali ? '.' : '') +
      ' Aim to be at the circuit about two hours early for security and the support races.' +
      ' Our schedule page lists every session, in track time and in your own time zone.'
    : `The ${race.season} United States Grand Prix weekend runs ${weekendRange(race)}, with the race on ${longDate(race.raceDate)}. F1 publishes exact session times a few weeks before the weekend; they appear on our schedule page, in track time and your own time zone, as soon as they're out.`;

  const thingsLead = 'Mornings before the sessions and evenings after them are free: Barton Springs, a barbecue lunch, the Texas State Capitol and live music downtown all fit.';
  const fallback = 'Our experiences page sorts every bookable tour and ticket by the gap in the F1 schedule it fits.';
  const listOf = (p: string[]) => `Right now the best-reviewed bookings that fit around the sessions are ${p.slice(0, -1).join(', ')} and ${p[p.length - 1]}.`;
  // Live pick titles vary in length: use as many as keep the answer within 60 words.
  const pickLine = [3, 2].map((n) => picks.slice(0, n)).find((p) => p.length >= 2 && wordCount(`${thingsLead} ${listOf(p)}`) <= 60);

  return [
    {
      id: 'what-is-cota',
      q: 'What is COTA, and where is it?',
      a: `COTA stands for Circuit of the Americas, the purpose-built track that hosts the Formula 1 United States Grand Prix. It sits in Elroy, Texas, about 24 km (15 miles) south-east of downtown Austin and roughly 15 minutes by car from Austin-Bergstrom airport. The ${race.season} race weekend is ${weekendRange(race)}.`,
      searches: ['what does cota stand for', 'what is cota', 'where is cota race track', 'where is circuit of the americas', 'where is the us grand prix'],
    },
    {
      id: 'race-start-time',
      q: 'What time is the Austin Grand Prix?',
      a: timeAnswer,
      searches: ['what time is the austin grand prix', 'what time is austin grand prix'],
    },
    {
      id: 'track-length',
      q: 'How long is the COTA track?',
      a: 'The Circuit of the Americas is 5.513 km (3.426 miles) long with 20 corners, and the Grand Prix runs 56 laps, about 308 km. Its signature is the steep 41-metre climb to Turn 1, which is also where most overtaking attempts happen at the start.',
      searches: ['how long is cota', 'how long is cota track'],
    },
    {
      id: 'where-to-watch',
      q: 'Where is the best place to watch F1 at COTA?',
      a: 'Turn 1 is the classic spot: you see the start, the uphill braking zone and most of the overtaking. The Main Grandstand faces the start-finish straight and the pit lane, while the stadium section around Turns 12 to 15 gives slow corners and a big screen. General admission covers the grassy banks around the lap.',
      searches: ['where to watch f1 austin'],
    },
    {
      id: 'getting-to-cota',
      q: 'How do I get to COTA on race weekend?',
      a: 'There is no train to the circuit. Most fans take the official race shuttles from downtown Austin, booked in advance on the circuit’s website, which take about 45 minutes; others use a pre-booked rideshare drop-off or drive to the official car parks. On Saturday and Sunday allow extra time: the roads into Elroy back up before and after the sessions.',
      searches: ['how to get to cota', 'cota shuttle'],
    },
    {
      id: 'where-to-stay',
      q: 'Where should I stay for the US Grand Prix?',
      a: 'Downtown Austin is the most practical base: the race shuttles leave from there, and the evenings are easy with live music on Sixth Street and Rainey Street. South Congress and East Austin are good alternatives. Hotels by the airport are closest to the circuit but quiet at night. Prices rise sharply for race weekend, so book early.',
      searches: ['where to stay for austin grand prix'],
    },
    {
      id: 'things-to-do',
      q: 'What is there to do in Austin during the Grand Prix?',
      a: `${thingsLead} ${pickLine ? listOf(pickLine) : fallback}`,
      searches: ['things to do in austin during f1', 'austin grand prix things to do'],
    },
  ];
}

const BUILDERS: Record<string, (ctx: AnswerContext) => Answer[]> = {
  usa: usaAnswers,
};

/** The answer-first set for a race key, or null when the race doesn't run this variant. */
export function answersFor(raceKey: string, ctx: AnswerContext): Answer[] | null {
  return BUILDERS[raceKey]?.(ctx) ?? null;
}
