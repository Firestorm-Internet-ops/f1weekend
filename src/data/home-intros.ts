/**
 * Homepage intro for each race, written by hand to replace the machine-written
 * race_content.homepage_intro. Keyed by race key ("usa", not "usa-2026") so the
 * text carries over when the homepage rolls on to next season: years and
 * weekend dates are tokens filled from live race data, never literals. Every
 * fact about the place has a source in `sources`.
 */

export interface HomeIntro {
  heading: string;
  body: string;
  sources: { label: string; url: string }[];
  /** The facts describe this circuit only: no intro if the race is held elsewhere. */
  circuitName?: string;
}

export interface HomeIntroVars {
  season: number;
  dates: string;
  circuit: string;
  city: string;
}

const WHAT_WE_HAVE =
  'This page lists every session of the weekend, with tours and tickets from GetYourGuide, Viator and Tiqets that fit the gaps between them, and a guide to getting to the track.';

export const HOME_INTROS: Record<string, HomeIntro> = {
  melbourne: {
    heading: 'Plan your Melbourne Grand Prix weekend around the sessions',
    body: `The {season} Australian Grand Prix runs {dates} at {circuit}. The track loops around Albert Park Lake, just south of Melbourne's city centre, so you can stay in town and ride a tram to the gates. In recent years a race ticket has also covered tram travel between the city and the park. ${WHAT_WE_HAVE}`,
    sources: [
      { label: 'Albert Park Circuit (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Albert_Park_Circuit' },
      { label: 'Australian Grand Prix: getting here', url: 'https://grandprix.com.au/event/getting-here' },
      { label: 'Victorian Government: extra Grand Prix trams', url: 'https://www.premier.vic.gov.au/extra-grand-prix-tram-services-get-fans-trackside' },
    ],
  },
  shanghai: {
    heading: 'Chinese Grand Prix weekend in Shanghai, session by session',
    body: `The {season} Chinese Grand Prix runs {dates} at {circuit}. The circuit is in Jiading District, in the north-west of Shanghai. Metro Line 11 has a station called Shanghai Circuit right beside the track, and the city's own guide calls it the easiest way to get there. ${WHAT_WE_HAVE}`,
    sources: [
      { label: 'Shanghai International Circuit (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Shanghai_International_Circuit' },
      { label: 'Shanghai government: F1 transport guide', url: 'https://english.shanghai.gov.cn/en-SportsEvents/20260309/cf82210fa8ba432dae1b4ba52c0d1eaf.html' },
    ],
  },
  japan: {
    heading: 'Plan your Suzuka weekend around the sessions',
    body: `The {season} Japanese Grand Prix runs {dates} at {circuit}, in Suzuka City in Mie Prefecture. The track is a figure of eight: the back straight crosses over the front section on a bridge. On race weekend, shuttle buses run to the circuit from Kintetsu Shiroko Station, the stop the circuit recommends for its frequent trains. ${WHAT_WE_HAVE}`,
    sources: [
      { label: 'Suzuka International Racing Course (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Suzuka_International_Racing_Course' },
      { label: 'Suzuka Circuit: Kintetsu Shiroko shuttle bus', url: 'https://www.suzukacircuit.jp/eng/f1/access/other/shiroko-shuttle.html' },
      { label: 'Suzuka Circuit: train and bus access', url: 'https://www.suzukacircuit.jp/eng/access_s/train_bus/' },
    ],
  },
  miami: {
    heading: 'Plan your Miami Grand Prix weekend around the sessions',
    body: `The {season} Miami Grand Prix runs {dates} at {circuit}. The track is laid out around Hard Rock Stadium and its grounds in Miami Gardens. In past years, Brightline train riders could take a free shuttle from Aventura station to the stadium, which avoids parking on race day. ${WHAT_WE_HAVE}`,
    sources: [
      { label: 'Miami International Autodrome (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Miami_International_Autodrome' },
      { label: 'Brightline: trains to race weekend at Hard Rock Stadium', url: 'https://gobrightline.com/press-room/2025/brightline-fast-tracks-fans-to-the-big-race-at-hard-rock-stadium' },
    ],
  },
  canada: {
    heading: 'Plan your Montreal Grand Prix weekend around the sessions',
    body: `The {season} Canadian Grand Prix runs {dates} at {circuit}. The track is on Notre Dame Island, a man-made island in the St. Lawrence River, inside Parc Jean-Drapeau. The organisers say the metro is the best way there: take Line 4 (Yellow) to Jean-Drapeau station, then walk to your grandstand. ${WHAT_WE_HAVE}`,
    sources: [
      { label: 'Circuit Gilles Villeneuve (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Circuit_Gilles_Villeneuve' },
      { label: 'Grand Prix du Canada: getting there', url: 'https://gpcanada.ca/en/event/getting-there/' },
    ],
  },
  monaco: {
    heading: 'Plan your Monaco Grand Prix weekend around the sessions',
    body: `The {season} Monaco Grand Prix runs {dates} at {circuit}. The 3.3 km track uses the public streets of Monte Carlo and La Condamine, around the harbour. Many fans stay along the coast and come in by train: Monaco-Monte-Carlo station is a 10 to 15 minute walk from the circuit, with regular trains from Nice. ${WHAT_WE_HAVE}`,
    sources: [
      { label: 'Circuit de Monaco (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Circuit_de_Monaco' },
      { label: 'Formula 1: Monaco, travelling by train', url: 'https://www.formula1.com/en/latest/article/monaco-travelling-by-train.44riWp4Iu4i0isCOGGSswA' },
    ],
  },
  barcelona: {
    heading: 'Barcelona-Catalunya weekend: sessions, tours and getting there',
    body: `The {season} Barcelona-Catalunya Grand Prix runs {dates} at {circuit}. The circuit is in Montmeló, outside Barcelona, so most fans stay in the city and travel out each day. The circuit's own advice is to take an R2 train from Barcelona to Montmeló station, then walk or take a local bus to the gates. ${WHAT_WE_HAVE}`,
    sources: [
      { label: 'Circuit de Barcelona-Catalunya (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Circuit_de_Barcelona-Catalunya' },
      { label: 'Circuit de Barcelona-Catalunya: how to get to Montmeló', url: 'https://www.circuitcat.com/en/arrive-montmelo-2' },
    ],
  },
  austria: {
    heading: 'Plan your Red Bull Ring weekend around the sessions',
    body: `The {season} Austrian Grand Prix runs {dates} at {circuit}, in Spielberg in the Styria region of Austria. The track is in the countryside, so plan how you will get there. For recent races the circuit has sent fans arriving by train to Knittelfeld station, with shuttle buses from there to the track. ${WHAT_WE_HAVE}`,
    sources: [
      { label: 'Red Bull Ring (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Red_Bull_Ring' },
      { label: 'Red Bull Ring: F1 arrival information', url: 'https://redbullring.com/de/wp-content/uploads/sites/5/2024/06/240619-F1-GP-AUT-2024-Arrival_EN.pdf' },
    ],
  },
  britain: {
    heading: 'Plan your Silverstone weekend around the sessions',
    body: `The {season} British Grand Prix runs {dates} at {circuit}. Silverstone sits on the border of Northamptonshire and Buckinghamshire, on the site of a wartime RAF bomber airfield. There is no station at the track, but on race weekend official shuttle buses run from Milton Keynes and Northampton train stations. ${WHAT_WE_HAVE}`,
    sources: [
      { label: 'Silverstone Circuit (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Silverstone_Circuit' },
      { label: 'Silverstone: getting to the British Grand Prix', url: 'https://www.silverstone.co.uk/events/formula-1-british-grand-prix/getting-here' },
    ],
  },
  belgium: {
    heading: 'Plan your Spa-Francorchamps weekend around the sessions',
    body: `The {season} Belgian Grand Prix runs {dates} at {circuit}. The track is about 7 km long and runs through the Ardennes countryside, about 8 km south-east of the town of Spa. Fans coming by train usually go to Verviers-Central station, where race-weekend shuttle buses run to the circuit. ${WHAT_WE_HAVE}`,
    sources: [
      { label: 'Circuit de Spa-Francorchamps (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Circuit_de_Spa-Francorchamps' },
      { label: 'Belgian Grand Prix: coming by train and bus', url: 'https://www.spagrandprix.com/en/comment-venir-trains-et-tec' },
    ],
  },
  hungary: {
    heading: 'Hungarian Grand Prix weekend from Budapest, session by session',
    body: `The {season} Hungarian Grand Prix runs {dates} at {circuit}. The track is about 20 km north-east of central Budapest, so most fans stay in the city. The usual public transport route is the M2 metro to Örs vezér tere, then the H8 suburban train, with a shuttle bus for the last part of the trip. ${WHAT_WE_HAVE}`,
    sources: [
      { label: 'Visit Hungary: visitor guide', url: 'https://visithungary.com/visitor-guide--and--useful-information' },
      { label: 'MÁV-HÉV: getting to the Hungaroring by public transport', url: 'https://mav-hev.hu/f1-2024-en' },
    ],
  },
  netherlands: {
    heading: 'Plan your Zandvoort weekend around the sessions',
    body: `The {season} Dutch Grand Prix runs {dates} at {circuit}. The track lies in the dunes just north of Zandvoort, near the North Sea and about 35 km west of Amsterdam. You can't park at the circuit on race weekend, so the organisers ask fans to come by train, shuttle bus, bike or on foot. ${WHAT_WE_HAVE}`,
    sources: [
      { label: 'Circuit Zandvoort (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Circuit_Zandvoort' },
      { label: 'Dutch Grand Prix: your race to Zandvoort', url: 'https://dutchgp.com/en/your-race-to-zandvoort/' },
    ],
  },
  italy: {
    heading: 'Plan your Monza weekend around the sessions',
    body: `The {season} Italian Grand Prix runs {dates} at {circuit}. The track is set in the woods of the Royal Villa of Monza park, north of Milan. Most fans stay in Milan and take a train to Monza station, where the Black Shuttle bus runs to the circuit; one Trenord ticket can cover both. ${WHAT_WE_HAVE}`,
    sources: [
      { label: 'Monza Circuit (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Monza_Circuit' },
      { label: 'Autodromo Nazionale Monza: how to reach us', url: 'https://monzanet.it/en/?p=4184' },
      { label: 'Formula 1: how to get to Monza', url: 'https://www.formula1.com/en/latest/article/how-to-get-to-the-autodromo-nazionale-monza-for-the-italian-grand-prix.5vQqnqNCTImAAr9YJwb233' },
    ],
  },
  madrid: {
    heading: 'Plan your Madrid Grand Prix weekend around the sessions',
    body: `The {season} Spanish Grand Prix runs {dates} at {circuit}, a mix of street and purpose-built track. It is at the IFEMA Madrid exhibition grounds in Valdebebas, in the north-east of the city. Metro Line 8 stops at Feria de Madrid station, right next to the circuit, about 25 minutes from the city centre. ${WHAT_WE_HAVE}`,
    sources: [
      { label: 'Formula 1: Madrid tickets and venue', url: 'https://ticketing.formula1.com/madrid-spain/' },
    ],
  },
  azerbaijan: {
    heading: 'Plan your Baku Grand Prix weekend around the sessions',
    body: `The {season} Azerbaijan Grand Prix runs {dates} at {circuit}. The 6 km street track runs near Baku Boulevard and around the walls of the Old City. Several metro stations, including Icheri Sheher in the Old City, are within walking distance of the track, so you can leave the car at the hotel. ${WHAT_WE_HAVE}`,
    sources: [
      { label: 'Baku City Circuit (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Baku_City_Circuit' },
      { label: 'Baku City Circuit: public transport during the Grand Prix', url: 'https://www.bakucitycircuit.com/news/60' },
    ],
  },
  // Held at Sepang (Malaysia) in 2026: see the venue in CALENDAR_2026.
  bahrain: {
    heading: 'Bahrain Grand Prix at Sepang: sessions, tours and getting there',
    body: `The {season} Bahrain Grand Prix runs {dates} at {circuit} in Malaysia, not at its usual home in Bahrain. The track is about 45 km south of Kuala Lumpur and right beside Kuala Lumpur International Airport. That means you can stay in the city and travel out for each session, or fly in and be at the track soon after landing. ${WHAT_WE_HAVE}`,
    sources: [
      { label: 'Sepang International Circuit (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Sepang_International_Circuit' },
    ],
    circuitName: 'Sepang International Circuit',
  },
  singapore: {
    heading: 'Singapore Grand Prix weekend: night sessions, tours and transport',
    body: `The {season} Singapore Grand Prix runs {dates} at {circuit}. It is a street track around Marina Bay, through the Downtown Core and Kallang areas, lit by about 1,600 floodlights for the night race. Most entry gates are a short walk from an MRT station, so the train is the easiest way in and out. ${WHAT_WE_HAVE}`,
    sources: [
      { label: 'Marina Bay Street Circuit (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Marina_Bay_Street_Circuit' },
      { label: 'Formula 1: how to get to and from the Singapore Grand Prix', url: 'https://www.formula1.com/en/latest/article/how-to-get-to-and-from-the-singapore-grand-prix.3BzuwRKcJbQIpFjqsNTXke' },
    ],
  },
  usa: {
    heading: 'United States Grand Prix weekend in Austin, session by session',
    body: `The {season} United States Grand Prix runs {dates} at {circuit}. The track is in south-eastern Travis County, outside downtown Austin, so most fans stay in the city and travel out each day. The circuit sells shuttle passes for round trips from downtown Austin on race weekend, and parking passes if you drive. ${WHAT_WE_HAVE}`,
    sources: [
      { label: 'Circuit of the Americas (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Circuit_of_the_Americas' },
      { label: 'Circuit of the Americas: F1 shuttle passes', url: 'https://circuitoftheamericas.com/ticket/shuttles/' },
      { label: 'Circuit of the Americas: F1 parking', url: 'https://circuitoftheamericas.com/ticket/f1-parking/' },
    ],
  },
  mexico: {
    heading: 'Mexico City Grand Prix weekend, session by session',
    body: `The {season} Mexico City Grand Prix runs {dates} at {circuit}. The track is inside the Magdalena Mixhuca Sports City park in south-east Mexico City. Metro Line 9 has three stations next to the circuit, Velódromo, Ciudad Deportiva and Puebla, so pick the one closest to the gate on your ticket. ${WHAT_WE_HAVE}`,
    sources: [
      { label: 'Autódromo Hermanos Rodríguez (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Aut%C3%B3dromo_Hermanos_Rodr%C3%ADguez' },
      { label: 'Formula 1: how to get to and from the Mexico City Grand Prix', url: 'https://www.formula1.com/en/latest/article/how-to-get-to-and-from-the-mexico-city-grand-prix.33bYRJE3Nz2dCw3VXYjSiC' },
    ],
  },
  brazil: {
    heading: 'São Paulo Grand Prix weekend at Interlagos, session by session',
    body: `The {season} São Paulo Grand Prix runs {dates} at {circuit}, better known as Interlagos. The area takes its name from its place between two large lakes, Guarapiranga and Billings. Autódromo station on train Line 9 (Emerald) is about 500 metres from the circuit, and the walk from there to the gates takes about 15 to 35 minutes. ${WHAT_WE_HAVE}`,
    sources: [
      { label: 'Interlagos Circuit (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Interlagos_Circuit' },
      { label: 'Formula 1: how to get to and from the São Paulo Grand Prix', url: 'https://www.formula1.com/en/latest/article/how-to-get-to-and-from-the-sao-paulo-grand-prix.76Vx8HFsPy7oUZmk4xcTS9' },
      { label: 'São Paulo Grand Prix: directions', url: 'https://f1saopaulo.com.br/en/directions' },
    ],
  },
  'las-vegas': {
    heading: 'Las Vegas Grand Prix weekend on the Strip, session by session',
    body: `The {season} Las Vegas Grand Prix runs {dates} at {circuit}. The track uses public roads around the Las Vegas Strip, including the stretch of Las Vegas Boulevard lined with the big hotels and casinos, and passes the Sphere. The Las Vegas Monorail has three stops inside the race area and has run around the clock during race week. ${WHAT_WE_HAVE}`,
    sources: [
      { label: 'Las Vegas Strip Circuit (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Las_Vegas_Strip_Circuit' },
      { label: 'Las Vegas Monorail: F1 Grand Prix', url: 'https://www.lvmonorail.com/events/f1-grand-prix-las-vegas/' },
    ],
  },
  qatar: {
    heading: 'Qatar Grand Prix weekend at Lusail, session by session',
    body: `The {season} Qatar Grand Prix runs {dates} at {circuit}. The track is just outside the city of Lusail, north of Doha. The Doha Metro Red Line runs from the airport and central Doha to Lusail station, and free shuttle buses take fans from there to the circuit gates, since you can't walk from the station. ${WHAT_WE_HAVE}`,
    sources: [
      { label: 'Lusail International Circuit (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Lusail_International_Circuit' },
      { label: 'Formula 1: fan guide to the Qatar Grand Prix', url: 'https://www.formula1.com/en/latest/article/speed-desert-and-doha-the-ultimate-fan-guide-to-the-qatar-grand-prix.7pVRowHi0gVBHEROf7d9B0' },
    ],
  },
  'abu-dhabi': {
    heading: 'Abu Dhabi Grand Prix weekend on Yas Island, session by session',
    body: `The {season} Abu Dhabi Grand Prix runs {dates} at {circuit}. The track is on Yas Island, a headland cut off from the Abu Dhabi mainland by a canal. On race weekend, free shuttle buses link points around Yas Island with the circuit for ticket holders, so you can stay on the island and leave the car behind. ${WHAT_WE_HAVE}`,
    sources: [
      { label: 'Yas Marina Circuit (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Yas_Marina_Circuit' },
      { label: 'Formula 1: how to get to and from the Abu Dhabi Grand Prix', url: 'https://www.formula1.com/en/latest/article/how-to-get-to-and-from-the-abu-dhabi-grand-prix.7Me4KTHzf8We5rqFXZ1qOP' },
    ],
  },
};

const fill = (text: string, vars: HomeIntroVars) =>
  text.replace(/\{(season|dates|circuit|city)\}/g, (_, k: keyof HomeIntroVars) => String(vars[k]));

/** The race's intro with season, dates, circuit and city filled in; null if there isn't one. */
export function homeIntro(raceKey: string, vars: HomeIntroVars): { heading: string; body: string } | null {
  const intro = HOME_INTROS[raceKey];
  if (!intro || (intro.circuitName && intro.circuitName !== vars.circuit)) return null;
  return { heading: fill(intro.heading, vars), body: fill(intro.body, vars) };
}
