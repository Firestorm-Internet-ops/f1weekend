/**
 * "Topic cluster" pages (SEO experiment, see src/data/seo-experiments.ts): the
 * race page links to focused pages, one per thing people search before the
 * trip, and each links back and to the others. Searches behind each page:
 * Ahrefs, US, Sept 2026 (docs/seo-experiments/mexico.md). Session times come
 * from live data; every other fact is dated and sourced on the page.
 */
import type { Race, Session } from '@/types/race';
import type { BylineSource } from '@/components/race/PageByline';

/** Pages built here. Getting There is an existing page that joins the cluster. */
export const CLUSTER_TOPICS = ['day-of-the-dead', 'where-to-stay', 'weather-what-to-pack'] as const;
export type ClusterTopic = typeof CLUSTER_TOPICS[number];

export interface ClusterLink {
  /** Path under /races/<key>/. */
  path: ClusterTopic | 'getting-there';
  label: string;
  desc: string;
}

export interface ClusterSection {
  id: string;
  /** Heading, phrased like the search. */
  q: string;
  /** First paragraph: the direct answer (quoted in the FAQ schema). */
  answer: string;
  more?: string[];
  items?: { name: string; detail: string }[];
}

export interface ClusterPage {
  topic: ClusterTopic;
  /** <title>, without the site name. */
  title: string;
  description: string;
  h1: string;
  intro: string;
  sections: ClusterSection[];
  sources: BylineSource[];
  /** Day the facts were last checked (YYYY-MM-DD). */
  verified: string;
  /** Live-feed products worth showing on this page. */
  feed?: {
    match: RegExp;
    /** Looser matches, used only when `match` finds fewer than three. */
    fill?: RegExp;
    /** Hide "Fits <session gap>" on these cards (their own dates matter more). */
    hideFits?: boolean;
    heading: string;
    description: string;
  };
  /** Extra JSON-LD (e.g. an Event). */
  ld?: object[];
  /** The searches this page answers (for the experiment log). */
  searches: string[];
}

export interface ClusterContext {
  race: Race;
  /** This weekend's F1 sessions (track time); empty until published. */
  sessions: Session[];
}

const byType = (sessions: Session[], type: Session['sessionType']) =>
  sessions.find((s) => s.sessionType === type && !/sprint/i.test(s.name));

// ─── Mexico City ──────────────────────────────────────────────────────────

const MEXICO_LINKS: ClusterLink[] = [
  { path: 'day-of-the-dead', label: 'Day of the Dead', desc: 'The parade is on qualifying day: how to see both' },
  { path: 'where-to-stay', label: 'Where to stay', desc: 'Best areas by Metro time to the circuit' },
  { path: 'getting-there', label: 'Getting there', desc: 'Metro, Metrobús, shuttles and gates' },
  { path: 'weather-what-to-pack', label: 'Weather & what to pack', desc: 'Altitude, sun, rain and the bag rules' },
];

const CDMX_CULTURE: BylineSource = {
  label: 'Secretaría de Cultura de la Ciudad de México',
  url: 'https://www.cultura.cdmx.gob.mx/eventos/evento/gran-desfile-de-dia-de-muertos-2026',
};
const MEXICO_GP_RULES: BylineSource = { label: 'Mexico City Grand Prix: rules for visitors', url: 'https://www.mexico.gp/en/rules-for-visitors-19' };
const METRO_CDMX: BylineSource = { label: 'Metro de la Ciudad de México', url: 'https://www.metro.cdmx.gob.mx/' };

function mexicoDayOfTheDead({ race, sessions }: ClusterContext): ClusterPage {
  const quali = byType(sessions, 'qualifying');
  const gp = byType(sessions, 'race');
  const qualiAt = quali ? `at ${quali.startTime}` : 'in the afternoon';
  const gpAt = gp ? ` at ${gp.startTime}` : '';
  return {
    topic: 'day-of-the-dead',
    title: `Day of the Dead in Mexico City ${race.season}: Parade Date & the F1 Weekend`,
    description: `The ${race.season} Day of the Dead parade in Mexico City is on Saturday 31 October, qualifying day at the Grand Prix. Dates, route, where to see Día de Muertos and how to fit it around the F1 sessions.`,
    h1: 'Day of the Dead on F1 weekend',
    intro: `The ${race.season} Mexico City Grand Prix falls on Día de Muertos. The city's Day of the Dead parade is on Saturday 31 October, the same day as qualifying, and the race is on 1 November, the first of the two Days of the Dead. Here is when everything happens and how to see it around the sessions.`,
    verified: '2026-09-30',
    sources: [
      CDMX_CULTURE,
      { label: 'Time Out México (alebrijes parade)', url: 'https://www.timeoutmexico.mx/ciudad-de-mexico/arte/desfile-alebrijes-monumentales-hora-y-cuando-es-cdmx' },
      { label: 'El Financiero (Catrinas procession)', url: 'https://www.elfinanciero.com.mx/cdmx/2026/09/26/mega-procesion-de-catrinas-2026-en-cdmx-fecha-horario-y-ruta-del-desfile/' },
    ],
    searches: [
      'day of the dead mexico city', 'dia de los muertos mexico city', 'mexico city day of the dead parade',
      'day of the dead parade mexico city 2026', 'when is day of the dead 2026', 'when is dia de los muertos in mexico city',
    ],
    sections: [
      {
        id: 'when',
        q: `When is Day of the Dead ${race.season} in Mexico City?`,
        answer: `Día de Muertos is on 1 and 2 November ${race.season}: 1 November remembers children who have died, 2 November adults. Mexico City celebrates for weeks before that, with the monumental alebrijes parade on 17 October, the Catrinas procession on 25 October and the big Day of the Dead parade on Saturday 31 October.`,
        more: [
          'Families build ofrendas (altars) with photos, marigolds (cempasúchil), candles, pan de muerto and the favourite food and drink of the people they remember, and spend the night of 1–2 November with them in the cemeteries.',
        ],
      },
      {
        id: 'parade',
        q: 'When and where is the Day of the Dead parade?',
        answer: `The Gran Desfile de Día de Muertos ${race.season} is on Saturday 31 October, starting at 12:00 from the Puerta de los Leones in Chapultepec Park and running along Paseo de la Reforma to the Zócalo. It is free and about 1.5 million people watched in 2025, so find a spot on Reforma well before noon.`,
        more: [
          'The giant alebrijes (fantastical painted creatures) from the 17 October parade stay on show along Reforma, between the Ángel de la Independencia and the Estela de Luz, until 8 November: an easy evening walk on any day of the race weekend.',
        ],
      },
      {
        id: 'parade-and-qualifying',
        q: 'Can I see the parade and F1 qualifying on the same day?',
        answer: `Yes, if you leave early. Qualifying is ${qualiAt} on Saturday at the Autódromo Hermanos Rodríguez, across the city from the parade. Watch the first floats near Chapultepec at noon, then take the Metro (Line 1 to Tacubaya, then Line 9 to Velódromo or Ciudad Deportiva). Allow about an hour and a half: roads around Reforma are closed.`,
        more: [
          'Short on time on Saturday? The alebrijes on Reforma are on show every evening of the race weekend, and if you arrive a week early the Catrinas procession runs on Sunday 25 October (18:00, from the Ángel de la Independencia to the Zócalo). Taxis and rideshares get stuck near the parade route, so use the Metro on parade day.',
        ],
      },
      {
        id: 'after-the-race',
        q: 'What happens on 1 and 2 November?',
        answer: `The Grand Prix${gpAt} is on Sunday 1 November, the first Day of the Dead, and Monday 2 November is the main day for remembering adults. If you can stay on Monday, that is the best day to see ofrendas in Coyoacán and the city centre; the candle-lit cemetery vigils in Mixquic run through the night of 1–2 November.`,
      },
      {
        id: 'where',
        q: 'Where can I see Day of the Dead in Mexico City?',
        answer: 'The Zócalo and Centro Histórico for the parade finish and big ofrendas; Coyoacán for altars, flowers and street stalls around its plazas; San Andrés Mixquic for the most traditional cemetery vigil; and Xochimilco for boat rides on the canals with night-time Day of the Dead shows. Mixquic and Xochimilco are easiest on a guided tour.',
        items: [
          { name: 'Zócalo & Centro Histórico', detail: 'Where the parade ends. Ofrendas in the main square, museums and churches; on Metro Line 2 for the circuit.' },
          { name: 'Coyoacán', detail: 'Colourful altars, marigolds and pan de muerto around Jardín Centenario and Plaza Hidalgo; liveliest in the evenings of 31 October to 2 November.' },
          { name: 'San Andrés Mixquic (Tláhuac)', detail: 'The best-known cemetery vigil, lit by thousands of candles on the night of 1–2 November. About 1.5 hours from the centre; go with a tour.' },
          { name: 'Xochimilco', detail: 'Trajinera boat rides on the canals, with Day of the Dead night shows around this time of year.' },
        ],
      },
      {
        id: 'tips',
        q: 'Tips for Day of the Dead during the Grand Prix',
        answer: 'Book Day of the Dead tours and restaurants early: F1 weekend and Día de Muertos fill the city at the same time. Use the Metro on parade day, carry small peso notes for street food and pan de muerto, and in cemeteries ask before photographing families at their graves.',
      },
    ],
    feed: {
      // Day of the Dead itself; not mural or museum tours that only mention La Catrina.
      match: /^(?!.*(mural|museum)).*(day of the dead|d[ií]a de (los )?muertos|catrina|mixquic|ofrenda)/i,
      // Tours of the places on this page, but not party boats.
      fill: /^(?!.*(party|drinks|booze)).*(xochimilco|coyoac[aá]n)/i,
      hideFits: true,
      heading: 'Day of the Dead tours you can book',
      description: 'Tours and tickets from GetYourGuide, Viator and Tiqets; the price shown is the cheapest site for each.',
    },
    ld: [{
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: `Gran Desfile de Día de Muertos ${race.season}`,
      startDate: `${race.season}-10-31T12:00:00-06:00`,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      isAccessibleForFree: true,
      location: {
        '@type': 'Place',
        name: 'Paseo de la Reforma, from Chapultepec Park to the Zócalo',
        address: { '@type': 'PostalAddress', addressLocality: 'Mexico City', addressCountry: 'MX' },
      },
      organizer: { '@type': 'Organization', name: 'Secretaría de Cultura de la Ciudad de México', url: 'https://www.cultura.cdmx.gob.mx' },
    }],
  };
}

function mexicoWhereToStay({ race }: ClusterContext): ClusterPage {
  return {
    topic: 'where-to-stay',
    title: `Where to Stay for the Mexico City Grand Prix ${race.season}: Best Areas`,
    description: `The best areas to stay for the ${race.season} Mexico City Grand Prix, by Metro time to the Autódromo Hermanos Rodríguez: Roma and Condesa, Centro Histórico, Polanco, Coyoacán and the airport.`,
    h1: 'Where to stay for the Mexico City GP',
    intro: 'The Autódromo Hermanos Rodríguez is in the east of the city, near the airport, and Metro Line 9 stops right outside it. The best base is somewhere with good evenings and an easy ride to a Line 9 station.',
    verified: '2026-09-30',
    sources: [METRO_CDMX, { label: 'Autódromo Hermanos Rodríguez (Mexico City tourism)', url: 'https://www.mexicocity.cdmx.gob.mx/venues/hermanos-rodriguez-race-track/?lang=en' }],
    searches: ['where to stay in mexico city', 'best area to stay in mexico city', 'hotel near autodromo hermanos rodriguez', 'hotel grand prix mexico city', 'best neighborhoods in mexico city'],
    sections: [
      {
        id: 'best-area',
        q: 'What is the best area to stay for the Mexico City Grand Prix?',
        answer: 'Roma Norte or Condesa for most fans: walkable streets, the best restaurants and bars, and Metro Line 9 (Chilpancingo, Centro Médico or Patriotismo) straight to the circuit in about 30–40 minutes door to door. Centro Histórico suits sightseeing and the Day of the Dead parade; the airport area is closest to the track.',
      },
      {
        id: 'areas',
        q: 'Mexico City neighbourhoods compared for race weekend',
        answer: 'Roma and Condesa suit most fans, Centro Histórico and Juárez put you on the parade route, Polanco is the most upscale, Coyoacán has the best Day of the Dead altars and the airport area is closest. Times are our Metro estimates to the Velódromo or Ciudad Deportiva stations, walking and one change included.',
        items: [
          { name: 'Roma Norte & Condesa · 30–40 min', detail: 'Tree-lined streets, cafés, the city\'s best food and nightlife. Line 9 from Chilpancingo, Centro Médico or Patriotismo, no change. Best for first-timers.' },
          { name: 'Centro Histórico · 30–40 min', detail: 'The Zócalo, cathedral and museums, and the finish of the Day of the Dead parade. Line 2 to Chabacano, then Line 9. Quiet late at night away from the main streets.' },
          { name: 'Juárez & Reforma · 35–45 min', detail: 'Between Roma and the centre, right on the parade route. Line 1 to Tacubaya, then Line 9.' },
          { name: 'Polanco · 45–60 min', detail: 'Upscale hotels and restaurants next to Chapultepec Park. Line 7 to Tacubaya, then Line 9. The longest ride of the popular areas.' },
          { name: 'Coyoacán · 45–60 min', detail: 'Colonial squares, Frida Kahlo\'s Casa Azul and some of the best Day of the Dead altars. Line 3 to Centro Médico, then Line 9.' },
          { name: 'Airport & circuit area · 15–25 min', detail: 'Chain hotels by the airport and in Iztacalco, the shortest trip to the track by taxi or Line 9, but little to do in the evenings.' },
        ],
      },
      {
        id: 'closest-hotels',
        q: 'Which hotels are closest to the Autódromo Hermanos Rodríguez?',
        answer: 'The closest are the chain hotels around Mexico City airport and in Iztacalco, 10–20 minutes from the circuit by taxi. They suit fans who mainly want the racing; for evenings out, Roma and Condesa are a direct Metro ride away and a better base for most visitors.',
      },
      {
        id: 'tips',
        q: 'Tips for booking a hotel on race weekend',
        answer: 'Book as early as you can: the Grand Prix and Día de Muertos fill the city at the same time, and prices rise with them. Pick a hotel a short walk from a Line 9 station, or from Line 1, 2, 3 or 7 with one change, and check the walk to the station before you book.',
        more: ['After the race the Metro is packed for an hour or so: a late lunch near the circuit, or a rideshare pick-up a few streets from the gates, beats the queue.'],
      },
    ],
    feed: {
      // Evening tours near where fans stay; no party or booze tours.
      match: /^(?!.*(party|drinks|booze|pub crawl)).*(roma|condesa|food tour|taco|street food|walking tour|mezcal|lucha libre)/i,
      heading: 'Evenings in the city: food and walking tours',
      description: 'Well-reviewed tours near where most fans stay, from GetYourGuide, Viator and Tiqets.',
    },
  };
}

function mexicoWeatherAndPacking({ race }: ClusterContext): ClusterPage {
  return {
    topic: 'weather-what-to-pack',
    title: `Mexico City Weather, Altitude & What to Pack for the Grand Prix ${race.season}`,
    description: `Weather in Mexico City in late October and early November, the altitude at the Autódromo Hermanos Rodríguez, what to wear, and what you can bring into the circuit for the ${race.season} Grand Prix.`,
    h1: 'Weather, altitude and what to pack',
    intro: 'Mexico City in late October and early November is warm by day, cool at night and high up. Here is what to expect on race weekend and what to bring to the circuit.',
    verified: '2026-09-30',
    sources: [MEXICO_GP_RULES, { label: 'Mexico City Grand Prix FAQ', url: 'https://www.mexico.gp/en/faq' }],
    searches: ['mexico city weather november', 'mexico city weather in october', 'mexico city altitude', 'altitude sickness mexico city', 'what to wear in mexico city', 'what to pack for mexico city', 'f1 bag policy', 'autodromo hermanos rodriguez weather'],
    sections: [
      {
        id: 'weather',
        q: 'What is the weather like for the Mexico City Grand Prix?',
        answer: 'Late October and early November are the start of the dry season: expect about 21–23 °C in the afternoon and 8–10 °C early in the morning and after dark. The rainy season is ending, so a passing afternoon shower is still possible, and the sun is strong at this altitude even when it feels mild.',
      },
      {
        id: 'altitude',
        q: 'How high is Mexico City, and will the altitude affect me?',
        answer: 'Mexico City is about 2,240 m (7,350 ft) above sea level, and the Autódromo Hermanos Rodríguez is the highest circuit on the F1 calendar. Most visitors only notice it on stairs, with a mild headache or a poor first night. Drink plenty of water, go easy on alcohol at first and pace your walking days.',
        more: ['If you have a heart or lung condition, ask your doctor before you travel.'],
      },
      {
        id: 'bag-policy',
        q: 'What can I bring into the Autódromo Hermanos Rodríguez?',
        answer: 'Bags must be no bigger than 10 × 15 × 30 cm, ideally clear plastic, and every bag is searched. Not allowed: glass, coolers, drones, tripods, professional and video cameras, folding chairs, camping gear, pets (except service animals), fireworks and anything sharp. Prohibited items are confiscated, so check the official rules before you go.',
      },
      {
        id: 'what-to-pack',
        q: 'What should I pack for race weekend?',
        answer: 'Layers for a cold morning and a warm afternoon, sunscreen, a hat and sunglasses, a light rain jacket or poncho, comfortable shoes for long walks between gates, ear protection, a small clear bag, a phone power bank, and pesos in small notes for food stalls and the Metro.',
        items: [
          { name: 'Clothes', detail: 'T-shirt plus a warm layer you can tie round your waist; trainers, not new shoes. Team gear is welcome: the grandstands are a sea of Mexico green, white and red.' },
          { name: 'Sun & rain', detail: 'High-factor sunscreen, hat, sunglasses; a poncho rather than an umbrella, which blocks views.' },
          { name: 'Money & phone', detail: 'Cards work at most stands, but carry small peso notes; a power bank for long days and maps.' },
          { name: 'For Day of the Dead', detail: 'Comfortable evening shoes for the parade and Coyoacán; a warmer layer if you go to Mixquic at night.' },
        ],
      },
    ],
  };
}

interface ClusterDef {
  links: ClusterLink[];
  /** The race page's title and description while the cluster runs. */
  hub: (race: Race) => { title: string; description: string };
  pages: Record<ClusterTopic, (ctx: ClusterContext) => ClusterPage>;
}

const CLUSTERS: Record<string, ClusterDef> = {
  mexico: {
    links: MEXICO_LINKS,
    hub: (race) => ({
      title: `F1 Mexico City ${race.season}: Schedule, Day of the Dead & Race Weekend Guide`,
      description: `The ${race.season} ${race.name} at ${race.circuitName}: session times, the Day of the Dead parade on qualifying day, where to stay, getting to the circuit and what to pack.`,
    }),
    pages: {
      'day-of-the-dead': mexicoDayOfTheDead,
      'where-to-stay': mexicoWhereToStay,
      'weather-what-to-pack': mexicoWeatherAndPacking,
    },
  },
};

export const isClusterTopic = (v: string): v is ClusterTopic => (CLUSTER_TOPICS as readonly string[]).includes(v);

/** The cluster's pages, in the order shown on the race page; null for races without one. */
export function clusterLinks(raceKey: string): ClusterLink[] | null {
  return CLUSTERS[raceKey]?.links ?? null;
}

/** The race page's title and description while its cluster runs. */
export function clusterHub(raceKey: string, race: Race): { title: string; description: string } | null {
  return CLUSTERS[raceKey]?.hub(race) ?? null;
}

/** One cluster page for a race, or null when the race doesn't have it. */
export function clusterPage(raceKey: string, topic: string, ctx: ClusterContext): ClusterPage | null {
  if (!isClusterTopic(topic)) return null;
  return CLUSTERS[raceKey]?.pages[topic]?.(ctx) ?? null;
}

/** Topics with their own page, for the sitemap and llms.txt. */
export function clusterTopics(raceKey: string): ClusterTopic[] {
  return Object.keys(CLUSTERS[raceKey]?.pages ?? {}) as ClusterTopic[];
}
