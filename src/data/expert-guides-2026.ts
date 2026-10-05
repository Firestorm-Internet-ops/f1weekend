/**
 * Long-form race guides (SEO experiment "expert-guide", see
 * src/data/seo-experiments.ts): one in-depth page by a named author, every
 * section with its sources, and a "last checked" date. Facts only from the
 * cited pages; where a 2026 detail isn't published yet, the guide says so and
 * gives the latest year that is.
 */
import type { BylineSource } from '@/components/race/PageByline';

export type GuideBlock =
  | { p: string }
  | { ul: string[] }
  | { table: { caption?: string; head: string[]; rows: string[][] } }
  | { note: string };

export interface GuideSection {
  id: string;
  heading: string;
  blocks: GuideBlock[];
  sources: BylineSource[];
  /** Show bookable tours matching this pattern under the section… */
  tours?: RegExp;
  /** …except these (e.g. night flights that clash with evening sessions)… */
  toursExclude?: RegExp;
  /** …and no longer than this (hours). */
  toursMaxHours?: number;
}

export interface ExpertGuide {
  author: string;
  /** Day the facts were last checked (YYYY-MM-DD). */
  lastChecked: string;
  /** First published (YYYY-MM-DD). */
  published: string;
  title: (season: number) => string;
  description: (season: number) => string;
  headline: string;
  intro: string;
  sections: GuideSection[];
}

const LVGP = { label: 'Las Vegas Grand Prix (official)', url: 'https://www.f1lasvegasgp.com/' };

export const EXPERT_GUIDES: Record<string, ExpertGuide> = {
  'las-vegas': {
    author: 'jamshed-v-rajan',
    lastChecked: '2026-10-05',
    published: '2026-10-05',
    title: (season) => `F1 Las Vegas ${season}: Grand Prix Guide to the Track, Tickets, Hotels & Road Closures`,
    description: (season) => `The ${season} Las Vegas Grand Prix (19–21 Nov): session times, the Strip circuit, where to watch and ${season} ticket prices, road closures and the Monorail, where to stay, the weather and daytime trips. Researched and sourced.`,
    headline: 'Las Vegas Grand Prix 2026: the complete guide',
    intro: 'The Las Vegas Grand Prix is the only race of the season that runs on a Saturday night down a city’s main boulevard: Formula 1 cars race along the Las Vegas Strip past the Bellagio fountains, Caesars Palace and the Sphere, and the centre of the Strip reorganises itself around the track for race week. This guide covers what you need to plan the 2026 weekend: when everything runs, the circuit, where to watch and what it costs, how to get around the closures, where to stay, what to pack and how to use the free daytime hours. Each section lists its sources. Prices and road plans change, so check the official pages before you book.',
    sections: [
      {
        id: 'when',
        heading: 'When is the Las Vegas Grand Prix 2026?',
        blocks: [
          { p: 'Thursday 19 to Saturday 21 November 2026. All the track action is in the evening: practice starts at 4:30 pm and the race starts at 8:00 pm Pacific Time on Saturday, which is 11:00 pm Eastern and 04:00 on Sunday in the UK. The race is 50 laps, and there is no sprint.' },
          {
            table: {
              caption: 'Formula 1 sessions, Las Vegas Grand Prix 2026',
              head: ['Session', 'Day', 'Las Vegas (PT)', 'New York (ET)', 'London (GMT)'],
              rows: [
                ['Practice 1', 'Thu 19 Nov', '4:30–5:30 pm', '7:30 pm', '00:30 Fri'],
                ['Practice 2', 'Thu 19 Nov', '8:00–9:00 pm', '11:00 pm', '04:00 Fri'],
                ['Practice 3', 'Fri 20 Nov', '4:30–5:30 pm', '7:30 pm', '00:30 Sat'],
                ['Qualifying', 'Fri 20 Nov', '8:00–9:00 pm', '11:00 pm', '04:00 Sat'],
                ['Race (50 laps)', 'Sat 21 Nov', '8:00 pm', '11:00 pm', '04:00 Sun'],
              ],
            },
          },
          { p: 'The first two races, in 2023 and 2024, started at 10 pm; since 2025 lights-out has been at 8 pm, and the 2026 schedule keeps the 2025 format. The F1 Academy season finale is part of the 2026 weekend.' },
        ],
        sources: [
          { label: 'Official schedule', url: 'https://www.f1lasvegasgp.com/schedule/' },
          { label: 'ESPN: 2026 race start time', url: 'https://www.espn.com/f1/story/_/id/49535006/formula-1-start-s-does-2026-race-begin' },
          { label: 'Spire: 2023 race-night forecast (10 pm start)', url: 'https://spire.com/blog/weather-climate/whats-the-weather-forecast-for-the-2023-las-vegas-grand-prix/' },
          { label: 'F1 Academy finale (F1Technical)', url: 'https://www.f1technical.net/news/28103' },
        ],
      },
      {
        id: 'track',
        heading: 'The Las Vegas Strip Circuit: track map and lap',
        blocks: [
          { p: 'The circuit is 6.201 km (3.853 miles) long with 17 turns, so the 50 laps add up to about 310 km. It is laid out on public roads: the Strip itself between Spring Mountain Road and Harmon Avenue, plus Koval Lane, Harmon Avenue and Sands Avenue, with a section that loops around the Sphere.' },
          { p: 'The signature is the flat-out run of about 1.92 km (1.2 miles) up Las Vegas Boulevard between Turns 12 and 14, past the Venetian, Caesars Palace, Paris and its Eiffel Tower and the Bellagio fountains. The pits are in a permanent building of about 300,000 sq ft at the north-east corner of Harmon Avenue and Koval Lane, on a 39-acre site that hosts the Grand Prix Plaza attractions for the rest of the year.' },
          {
            ul: [
              'Lap record: 1:33.365, Max Verstappen (Red Bull), 2025.',
              '2023 winner: Max Verstappen (Red Bull).',
              '2024 winner: George Russell (Mercedes).',
              '2025 winner: Max Verstappen (Red Bull). George Russell and Kimi Antonelli completed the podium after both McLarens were disqualified for plank wear.',
            ],
          },
        ],
        sources: [
          { label: 'Las Vegas Strip Circuit (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Las_Vegas_Strip_Circuit' },
          { label: 'Formula 1: everything you need to know', url: 'https://www.formula1.com/en/latest/article/las-vegas-grand-prix-everything-you-need-to-know-about-F1s-newest-race.7HD0mpbF6pjSFsNatKZTwH' },
          { label: 'KTNV: the paddock site', url: 'https://www.ktnv.com/news/previewing-the-formula-1-paddock-site-ahead-las-vegas-grand-prix' },
          { label: 'Crash.net: the pit building', url: 'https://crash.net/f1/news/1040568/1/staggering-cost-behind-f1-las-vegas-grand-prix-bigmoney-pit-building' },
          { label: 'Formula 1: 2025 fastest laps', url: 'https://www.formula1.com/en/results/2025/races/1274/las-vegas/fastest-laps' },
          { label: 'The Race: 2025 result', url: 'https://www.the-race.com/formula-1/f1-2025-las-vegas-grand-prix-race-result/' },
        ],
      },
      {
        id: 'tickets',
        heading: 'Las Vegas Grand Prix tickets: where to watch, zone by zone',
        blocks: [
          { p: 'Tickets are sold by zone. The prices below are the 2026 “from” prices for three days, including taxes and fees, as published when tickets went on sale. Popular options sell out and prices move, so treat them as a guide and buy from the official site or another authorised seller.' },
          {
            table: {
              caption: '2026 ticket options (three days, from)',
              head: ['Option', 'What you get', 'From'],
              rows: [
                ['Flamingo Zone (general admission)', 'Standing, first-come viewing platforms', '$492 (single day from $50)'],
                ['T-Mobile Zone at Sphere (general admission)', 'Standing viewing in the zone around the Sphere', '$809 (single day from $81)'],
                ['Heineken GA+', 'Unassigned bleachers at Turn 4 and the Koval straight', 'See the official site'],
                ['Heineken Grandstands', 'Reserved grandstand seat', '$925'],
                ['West Harmon Grandstand', 'Reserved seat on Harmon Avenue', '$1,012'],
                ['Turn 3 Grandstand (Koval Zone)', 'West side of Turn 3, looking over Turns 3–4 and the Koval straight', '$1,329'],
                ['T-Mobile Grandstands', 'Reserved grandstand seat', '$1,445'],
                ['Heineken Silver Main Grandstand', 'East Harmon, opposite the pits; the pre- and post-race ceremonies happen here', '$2,051'],
              ],
            },
          },
          { p: 'Single-day general admission starts at $50 for Thursday, $99 for Friday and $393 for Saturday. The $50 Flamingo Zone day ticket is the cheapest way in so far, and it has been reported as sold out.' },
          { p: 'Hospitality starts at $2,542 (Club Paris) and goes up through the HGV Clubhouse ($3,728), Turn 3 Club ($5,489), Skybox ($8,377) and Trackside Tavern on the Paddock Club rooftop ($10,902) to the Wynn Grid Club at $25,997, on the second floor of the pit building above the start-finish line and Turns 1–2.' },
          { p: 'New for 2026: the West Harmon Zone now connects to the East Harmon Zone and the Koval Zone, with access to the Heineken Stage for driver interviews and entertainment, and the Turn 3 Grandstand has moved to the west side of Turn 3.' },
          { note: 'Can you watch for free? Not really. The pedestrian bridges over the track have privacy screens and staff keep people moving, and in 2023 venues overlooking the track were reportedly asked to pay licence fees or have their view blocked. Plan on a ticket.' },
        ],
        sources: [
          { label: 'Formula 1: 2026 tickets on sale', url: 'https://corp.formula1.com/tickets-on-sale-now-for-the-formula-1-heineken-las-vegas-grand-prix-2026-set-for-november-19-21/' },
          { label: 'Official grandstands page', url: 'https://www.f1lasvegasgp.com/tickets/grandstands/' },
          { label: 'Sports Illustrated: 2026 ticket options', url: 'https://www.si.com/onsi/f1/las-vegas-grand-prix-2026-unveils-ticket-options-for-every-type-of-f1-fan-exclusive' },
          { label: '8 News Now: 2026 prices', url: 'https://www.8newsnow.com/sports/vegas-full-throttle/f1-las-vegas-grand-prix-ticket-prices-for-2026-begin-at-50-3-day-general-admission-from-492/amp/' },
          { label: 'Official: 2026 ticket timeline and zones', url: 'https://www.f1lasvegasgp.com/2026/03/formula-1-heineken-las-vegas-grand-prix-announces-on-sale-ticket-timeline-and-ticket-options-for-2026-race-nov-19-21/' },
          { label: 'The Drive: blocked views (2023)', url: 'https://www.thedrive.com/news/f1-wants-las-vegas-venues-to-pay-millions-or-it-will-block-their-view-of-the-race-report' },
        ],
      },
      {
        id: 'getting-around',
        heading: 'Getting around on race week: road closures, the Monorail and the bridges',
        blocks: [
          { p: 'The track is built on public roads, so traffic in the middle of the Strip is restricted for most of race week. Clark County publishes the plan each year; until the 2026 details are out, the 2025 plan is the best guide.' },
          {
            ul: [
              'In 2025, lane restrictions on the Strip started at 1 pm on race days, and the circuit was fully closed from 5 pm Thursday to 2:30 am, 5 pm Friday to 2 am, and 5 pm Saturday to 4 am Sunday.',
              'The roads inside the circuit: the Strip (Spring Mountain Road to Harmon), Koval Lane (Sands to Harmon), Harmon Avenue (Strip to Koval), Sands Avenue (Strip to Manhattan) and Flamingo Road (I-15 to Koval).',
              'In 2025, Koval Lane between Rochelle and Harmon was closed completely from the Saturday before the race to the Monday after it.',
              'The pedestrian bridges stay open on race nights but are enclosed and staffed; some close overnight while the track is being built.',
            ],
          },
          { p: 'The Las Vegas Monorail is the easiest way to cross the track area without a car. In 2025 it ran non-stop, 24 hours a day, from 7 am on the Tuesday of race week to 3 am on the Monday after; the stations closest to the race zones are Harrah’s/The LINQ, Flamingo/Caesars Palace and Horseshoe/Paris. RTC buses, including the Deuce on the Strip, run on special schedules and detours during race week, so check RTC’s alerts before you travel.' },
          { p: 'Harry Reid International Airport (LAS) is about two miles from the Strip, but allow extra time on race evenings. Once the track is live, drivers can only cross it on the temporary vehicle bridges (in 2023 at Flamingo and Koval and at Harmon and Audrie), so be where you want to be by mid-afternoon.' },
        ],
        sources: [
          { label: 'Clark County: circuit impacts', url: 'https://www.clarkcountynv.gov/government/departments/public_communications/formula_1_info/f1-news-release-circuit-impacts' },
          { label: 'KTNV: 2025 closure times', url: 'https://www.ktnv.com/news/vegas-grand-prix/2025-grand-prix-brings-earliest-traffic-closures-yet-to-the-las-vegas-strip' },
          { label: 'Review-Journal: Koval Lane closure', url: 'https://www.reviewjournal.com/local/traffic/f1-track-work-begins-next-week-bringing-strip-area-lane-closures-3871105/' },
          { label: 'Review-Journal: pedestrian bridges', url: 'https://www.reviewjournal.com/sports/motor-sports/formula-1/f1-circuit-prep-prompts-strip-lane-reductions-pedestrian-bridge-closures-3529249/' },
          { label: 'Las Vegas Monorail: F1 weekend', url: 'https://www.lvmonorail.com/events/f1-grand-prix-las-vegas/' },
          { label: 'RTC alerts and detours', url: 'https://www.rtcsnv.com/alertsanddetours' },
          { label: 'Harry Reid International Airport', url: 'https://www.harryreidairport.com/our-airports' },
          { label: 'Las Vegas Advisor: hotel access', url: 'https://www.lasvegasadvisor.com/question/f1-access-hotels/' },
        ],
      },
      {
        id: 'where-to-stay',
        heading: 'Where to stay for the Las Vegas Grand Prix',
        blocks: [
          { p: 'Staying on the circuit is the big draw. Hotels with track frontage include the Venetian and Palazzo, Treasure Island, Harrah’s, the LINQ, Flamingo, the Cromwell, Caesars Palace, Bellagio, Paris, Planet Hollywood, the Cosmopolitan, ARIA and Hilton Grand Vacations. You can walk to the zones, but these hotels can be awkward to reach by car while the track is live (in 2023 the Cromwell, Flamingo, LINQ, Harrah’s and Venetian garages were reached from Linq Lane).' },
          { p: 'Staying away from the circuit, at the south end of the Strip or Downtown around Fremont Street, keeps the roads open to you; add the Monorail or a walk over the bridges to reach the zones.' },
          { p: 'Race weekend is still the most expensive week of November, but prices have come down since the first race: Booking.com’s average nightly rate for race weekend fell from $2,130 in 2023 to $953 in 2024 and $725 in 2025, still about 41% above the week before. Book early and check the cancellation terms.' },
        ],
        sources: [
          { label: 'Las Vegas Advisor: hotels and F1 access', url: 'https://www.lasvegasadvisor.com/question/f1-access-hotels/' },
          { label: 'VegasInsider: 2025 race-weekend hotel prices', url: 'https://www.vegasinsider.com/auto-racing/2025-las-vegas-grand-prix-accommodation-prices-drop/' },
        ],
      },
      {
        id: 'weather',
        heading: 'Las Vegas Grand Prix weather: what to wear',
        blocks: [
          { p: 'Las Vegas in late November is mild by day and cold at night. National Weather Service normals for November go from highs of 23 °C (74 °F) and lows of 12 °C (53 °F) at the start of the month to highs of 16 °C (60 °F) and lows of 6 °C (42 °F) at the end, with about 8 mm (0.3 in) of rain for the whole month.' },
          { p: 'At lights-out the forecast was about 14–15 °C (57–59 °F) in 2023, 2024 and 2025, and it keeps falling through the night. You will be outside for three to five hours after dark, so bring a warm layer, a hat and comfortable closed shoes for the walking.' },
        ],
        sources: [
          { label: 'National Weather Service: Las Vegas November climate', url: 'https://www.weather.gov/media/vef/Las_Vegas_climate_book_November.pdf' },
          { label: 'Formula 1: 2025 race forecast', url: 'https://www.formula1.com/en/latest/article/what-is-the-weather-forecast-for-the-2025-las-vegas-grand-prix.3K6y5zmuYyNFE02ziubMiB' },
          { label: 'Formula 1: 2024 race forecast', url: 'https://www.formula1.com/en/latest/article/what-is-the-weather-forecast-for-the-2024-las-vegas-grand-prix.3hAhEgT344420JLMplTakF' },
          { label: 'Spire: 2023 race forecast', url: 'https://spire.com/blog/weather-climate/whats-the-weather-forecast-for-the-2023-las-vegas-grand-prix/' },
        ],
      },
      {
        id: 'daytime',
        heading: 'What to do in the daytime: Grand Canyon, Hoover Dam and Red Rock',
        blocks: [
          { p: 'Every session is in the evening, so your days are free, and that is the best part of a Las Vegas race trip. Saturday, with the race not until 8 pm, is the day for the longest trip.' },
          {
            ul: [
              'Red Rock Canyon: about 17 miles west of the Strip. A scenic drive and short hikes fit in a morning.',
              'Hoover Dam: about 30 miles south-east. With the drive and a tour, it takes half a day.',
              'Valley of Fire State Park: about 50 miles north-east, off I-15. Red sandstone and petroglyphs; plan most of a day.',
              'Grand Canyon West and the Skywalk: about 130 miles, roughly two hours each way. A full day: Saturday is the one to use.',
              'Grand Canyon South Rim: 278 miles by road, too far for a race day. Go before or after the weekend, or fly.',
            ],
          },
        ],
        tours: /grand canyon|hoover dam|red rock|valley of fire|skywalk/i,
        toursExclude: /night|sunset|evening|overnight|antelope|horseshoe|zion|bryce/i,
        toursMaxHours: 12,
        sources: [
          { label: 'Bureau of Reclamation: Hoover Dam directions', url: 'https://www.usbr.gov/lc/hooverdam/service/directions.html' },
          { label: 'BLM: Red Rock Canyon', url: 'https://www.blm.gov/visit/red-rock-canyon-national-conservation-area' },
          { label: 'Travel Nevada: Valley of Fire', url: 'https://travelnevada.com/parks-recreational-areas/valley-of-fire-state-park/' },
          { label: 'Grand Canyon West: from Las Vegas', url: 'https://grandcanyonwest.com/2-hour-trip-from-las-vegas/' },
          { label: 'NPS: directions to the South Rim', url: 'https://www.nps.gov/grca/planyourvisit/directions_s_rim.htm' },
        ],
      },
      {
        id: 'tips',
        heading: 'Planning tips',
        blocks: [
          {
            ul: [
              'Choose your zone first, then the hotel: on race nights walking beats driving.',
              'Book the hotel early: race-weekend rates run well above the week before.',
              'Cross the track by Monorail or the pedestrian bridges, and leave extra time.',
              'Pack a warm layer: it is cold after dark, and you will be outside for hours.',
              'Use the free days: one long trip (Grand Canyon West, ideally Saturday) and one short one (Red Rock Canyon or Hoover Dam).',
              'Check the official site in the week before the race for final road closures and gate times.',
            ],
          },
        ],
        sources: [LVGP],
      },
    ],
  },
};

export function expertGuideFor(raceKey: string): ExpertGuide | null {
  return EXPERT_GUIDES[raceKey] ?? null;
}

/** Every source in a guide, once (for the page byline and the Article schema). */
export function guideSources(g: ExpertGuide): BylineSource[] {
  const seen = new Map<string, BylineSource>();
  for (const s of g.sections.flatMap((x) => x.sources)) seen.set(s.url ?? s.label, s);
  return [...seen.values()];
}

/** Rough word count of a guide (intro + every block). */
export function guideWords(g: ExpertGuide): number {
  const text = [g.intro, ...g.sections.flatMap((s) => [s.heading, ...s.blocks.flatMap((b) =>
    'p' in b ? [b.p] : 'ul' in b ? b.ul : 'note' in b ? [b.note] : [b.table.caption ?? '', ...b.table.head, ...b.table.rows.flat()])])].join(' ');
  return text.split(/\s+/).filter(Boolean).length;
}
