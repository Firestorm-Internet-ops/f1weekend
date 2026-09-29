/**
 * FAQs written in code: the 2026 rules answer that replaces outdated DRS
 * questions, and full FAQ sets for races whose stored FAQs are for another
 * venue (the Bahrain GP moved to Sepang). Session times come from the
 * timetable so the answers can't disagree with the schedule page.
 */
import { timetableFor } from './timetables-2026';

export interface Faq {
  q: string;
  a: string;
}

/** Replaces any stored FAQ about DRS, which was dropped from F1 for 2026. */
export const OVERTAKING_2026_FAQ: Faq = {
  q: 'Is there DRS in Formula 1 in 2026?',
  a: 'No. DRS was dropped under the 2026 rules. Instead every car has movable front and rear wings: drivers switch to a low-drag "straight mode" on designated straights, and a driver within one second of the car ahead gets extra electric power to attack (the overtake mode). Expect overtaking on the long straights, just without the DRS flap.',
};

function sessionTime(slug: string, match: RegExp): string | null {
  const e = timetableFor(slug)?.find((x) => x.series === 'Formula 1' && match.test(x.name));
  return e ? `${e.day} ${e.start}` : null;
}

function sepangFaqs(): Faq[] {
  const slug = 'bahrain-2026';
  const race = sessionTime(slug, /^Grand Prix/) ?? 'Sunday 15:00';
  const quali = sessionTime(slug, /^Qualifying/) ?? 'Saturday 16:00';
  const fp1 = sessionTime(slug, /^Practice 1/) ?? 'Friday 12:30';
  return [
    {
      q: 'Where is the 2026 Bahrain Grand Prix held?',
      a: 'At Sepang International Circuit in Selangor, Malaysia, next to Kuala Lumpur International Airport (KLIA) and about 45 km south of central Kuala Lumpur. For 2026 the race moved from Sakhir, Bahrain; it is round 16 of the season, on 2–4 October.',
    },
    {
      q: 'What time does the race start?',
      a: `The Grand Prix starts ${race} Malaysia time (UTC+8), over 56 laps. Qualifying is ${quali} and first practice ${fp1}. Our schedule page lists every session, including the support races, in track time.`,
    },
    {
      q: 'How do I get to Sepang from Kuala Lumpur?',
      a: 'The quickest way from central Kuala Lumpur is the KLIA Ekspres or KLIA Transit train from KL Sentral to KLIA, then the race-weekend shuttle or a short Grab ride to the circuit. By road it is roughly 55–60 km along the expressways towards KLIA; traffic builds before and after the sessions, so leave early on Saturday and Sunday.',
    },
    {
      q: 'Where should I stay for the race?',
      a: 'Most fans stay in Kuala Lumpur for the choice of hotels, food and nightlife, then take the airport train to the circuit. Putrajaya is closer and quieter, and the airport hotels are the shortest trip of all if you mainly want the racing.',
    },
    {
      q: 'What is the weather like at Sepang in October?',
      a: 'Hot and humid, usually low 30s °C, with a real chance of a heavy afternoon thunderstorm. Bring sun protection, water and a light rain jacket or poncho; umbrellas block views in the grandstands.',
    },
    {
      q: 'What can I do in Kuala Lumpur between sessions?',
      a: 'Mornings before the F1 sessions and evenings after them are free: the Petronas Twin Towers, Batu Caves, the Jalan Alor food street and a Putrajaya lakeside tour all fit. Our experiences page lists bookable tours and tickets by travel time from the circuit.',
    },
    OVERTAKING_2026_FAQ,
  ];
}

const CODE_FAQS: Record<string, () => Faq[]> = {
  'bahrain-2026': sepangFaqs,
};

/** FAQs written in code for a race, when its stored ones don't apply. */
export function codeFaqs(slug: string): Faq[] | null {
  return CODE_FAQS[slug]?.() ?? null;
}
