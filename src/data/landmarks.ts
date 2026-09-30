/**
 * Where a tour really is, from the place its title names. GetYourGuide and
 * Viator send a city centre, not the activity's location, so without this a
 * Sentosa ticket and a zoo tour would both sit "5 min from the circuit" in
 * central Singapore. A title naming one of these places is moved there.
 * Coordinates: the venue itself (or the heart of a district), to ~0.5 km.
 */
export interface LandmarkPlace {
  name: string;
  /** Matched anywhere in the title. */
  re: RegExp;
  lat: number;
  lng: number;
}

/** By race key (URL /races/<key>). */
export const LANDMARK_PLACES: Record<string, LandmarkPlace[]> = {
  // 2026: the Bahrain GP is held at Sepang, Malaysia.
  bahrain: [
    { name: 'Batu Caves', re: /\bbatu caves?\b/i, lat: 3.2379, lng: 101.684 },
    { name: 'Petronas Twin Towers', re: /\b(petronas|twin towers|klcc)\b/i, lat: 3.1579, lng: 101.7116 },
    { name: 'KL Tower', re: /\b(kl tower|menara)\b/i, lat: 3.1528, lng: 101.7038 },
    { name: 'Thean Hou Temple', re: /\bthean hou\b/i, lat: 3.1216, lng: 101.6875 },
    { name: 'Aquaria KLCC', re: /\baquaria\b/i, lat: 3.1535, lng: 101.7133 },
    { name: 'Sunway Lagoon', re: /\bsunway lagoon\b/i, lat: 3.0694, lng: 101.6076 },
    { name: 'Kuala Selangor', re: /\bkuala selangor\b|\bfireflies\b/i, lat: 3.3386, lng: 101.2544 },
    { name: 'Genting Highlands', re: /\bgenting\b/i, lat: 3.4237, lng: 101.7932 },
    { name: 'Malacca', re: /\b(malacca|melaka)\b/i, lat: 2.1896, lng: 102.2501 },
  ],
  singapore: [
    { name: 'Universal Studios Singapore', re: /\buniversal studios\b/i, lat: 1.254, lng: 103.8238 },
    { name: 'S.E.A. Aquarium', re: /\bs\.?e\.?a\.? aquarium\b/i, lat: 1.2583, lng: 103.8205 },
    { name: 'Sentosa', re: /\bsentosa\b/i, lat: 1.2494, lng: 103.8303 },
    { name: 'Gardens by the Bay', re: /\bgardens by the bay\b|\bcloud forest\b|\bflower dome\b|\bsupertree/i, lat: 1.2816, lng: 103.8636 },
    { name: 'Marina Bay Sands', re: /\bmarina bay sands\b|\bskypark\b/i, lat: 1.2834, lng: 103.8607 },
    { name: 'Singapore Flyer', re: /\bsingapore flyer\b/i, lat: 1.2893, lng: 103.8631 },
    { name: 'ArtScience Museum', re: /\bartscience\b/i, lat: 1.2863, lng: 103.8593 },
    { name: 'Mandai (Zoo, Night Safari, Bird Paradise)', re: /\b(singapore zoo|night safari|river wonders|bird paradise|mandai)\b/i, lat: 1.4043, lng: 103.793 },
    { name: 'Chinatown', re: /\bchinatown\b/i, lat: 1.2838, lng: 103.8436 },
    { name: 'Little India', re: /\blittle india\b/i, lat: 1.3066, lng: 103.8518 },
    { name: 'Kampong Glam', re: /\bkampong glam\b|\barab street\b/i, lat: 1.3025, lng: 103.859 },
    { name: 'Clarke Quay', re: /\bclarke quay\b/i, lat: 1.2906, lng: 103.8465 },
    { name: 'Botanic Gardens', re: /\bbotanic gardens?\b/i, lat: 1.3138, lng: 103.8159 },
    { name: 'Jewel Changi', re: /\bjewel\b|\bchangi\b/i, lat: 1.3602, lng: 103.9898 },
    { name: 'Pulau Ubin', re: /\bpulau ubin\b/i, lat: 1.4044, lng: 103.9625 },
  ],
  usa: [
    { name: 'Texas State Capitol', re: /\b(state )?capitol\b/i, lat: 30.2747, lng: -97.7404 },
    { name: 'Barton Springs', re: /\bbarton springs\b/i, lat: 30.264, lng: -97.7713 },
    { name: 'Zilker Park', re: /\bzilker\b/i, lat: 30.2669, lng: -97.7729 },
    { name: 'Lady Bird Lake', re: /\blady bird lake\b/i, lat: 30.262, lng: -97.75 },
    { name: 'Congress Avenue Bridge', re: /\bbats?\b.*\bbridge\b|\bcongress (avenue )?bridge\b/i, lat: 30.2615, lng: -97.7453 },
    { name: 'South Congress', re: /\bsouth congress\b|\bsoco\b/i, lat: 30.25, lng: -97.7494 },
    { name: 'Sixth Street', re: /\b(6th|sixth) street\b/i, lat: 30.2672, lng: -97.739 },
    { name: 'Mount Bonnell', re: /\bmount bonnell\b/i, lat: 30.3207, lng: -97.7735 },
    { name: 'Lake Travis', re: /\blake travis\b/i, lat: 30.4219, lng: -97.9036 },
  ],
  mexico: [
    { name: 'Teotihuacán', re: /\bteotihuac[aá]n\b|\bpyramids\b/i, lat: 19.6925, lng: -98.8438 },
    { name: 'Xochimilco', re: /\bxochimilco\b/i, lat: 19.257, lng: -99.103 },
    { name: 'Frida Kahlo Museum', re: /\bfrida\b|\bcasa azul\b/i, lat: 19.3551, lng: -99.1624 },
    { name: 'Coyoacán', re: /\bcoyoac[aá]n\b/i, lat: 19.35, lng: -99.162 },
    { name: 'National Museum of Anthropology', re: /\banthropolog/i, lat: 19.426, lng: -99.1863 },
    { name: 'Chapultepec', re: /\bchapultepec\b/i, lat: 19.4204, lng: -99.1819 },
    { name: 'Basilica of Guadalupe', re: /\bguadalupe\b/i, lat: 19.4847, lng: -99.1175 },
    { name: 'Arena México', re: /\blucha libre\b/i, lat: 19.4247, lng: -99.1523 },
    { name: 'Roma & Condesa', re: /\broma\b|\bcondesa\b/i, lat: 19.416, lng: -99.167 },
    { name: 'Polanco', re: /\bpolanco\b/i, lat: 19.433, lng: -99.195 },
    { name: 'Centro Histórico', re: /\bz[oó]calo\b|\bcentro hist[oó]rico\b|\bhistoric (center|centre|downtown)\b/i, lat: 19.4326, lng: -99.1332 },
  ],
  brazil: [
    { name: 'Ibirapuera Park', re: /\bibirapuera\b/i, lat: -23.5874, lng: -46.6576 },
    { name: 'Avenida Paulista', re: /\bpaulista\b|\bmasp\b/i, lat: -23.5614, lng: -46.6559 },
    { name: 'Liberdade', re: /\bliberdade\b/i, lat: -23.558, lng: -46.635 },
    { name: 'Vila Madalena', re: /\bvila madalena\b|\bbeco do batman\b/i, lat: -23.5566, lng: -46.686 },
    { name: 'Mercado Municipal', re: /\bmercad(o|ão) municipal\b|\bmercad[aã]o\b/i, lat: -23.5418, lng: -46.6293 },
    { name: 'Pinacoteca', re: /\bpinacoteca\b/i, lat: -23.5343, lng: -46.6339 },
    { name: 'Santos', re: /\bsantos\b/i, lat: -23.9608, lng: -46.3336 },
  ],
  'las-vegas': [
    { name: 'Sphere', re: /\bsphere\b/i, lat: 36.1207, lng: -115.1622 },
    { name: 'High Roller', re: /\bhigh roller\b/i, lat: 36.1176, lng: -115.1683 },
    { name: 'Bellagio', re: /\bbellagio\b/i, lat: 36.1126, lng: -115.1767 },
    { name: 'The STRAT', re: /\bstrat(osphere)?\b/i, lat: 36.1475, lng: -115.1566 },
    { name: 'Fremont Street', re: /\bfremont\b|\bdowntown las vegas\b/i, lat: 36.1706, lng: -115.144 },
    { name: 'Neon Museum', re: /\bneon museum\b/i, lat: 36.1771, lng: -115.1356 },
    { name: 'Red Rock Canyon', re: /\bred rock\b/i, lat: 36.135, lng: -115.427 },
    { name: 'Hoover Dam', re: /\bhoover dam\b/i, lat: 36.0161, lng: -114.7377 },
    { name: 'Valley of Fire', re: /\bvalley of fire\b/i, lat: 36.43, lng: -114.513 },
  ],
  qatar: [
    { name: 'Souq Waqif', re: /\bsouq waqif\b/i, lat: 25.2867, lng: 51.5333 },
    { name: 'Museum of Islamic Art', re: /\bmuseum of islamic art\b/i, lat: 25.2955, lng: 51.5391 },
    { name: 'National Museum of Qatar', re: /\bnational museum\b/i, lat: 25.2887, lng: 51.5484 },
    { name: 'The Pearl', re: /\bthe pearl\b/i, lat: 25.37, lng: 51.551 },
    { name: 'Katara', re: /\bkatara\b/i, lat: 25.36, lng: 51.526 },
    { name: 'Inland Sea', re: /\binland sea\b|\bkhor al adaid\b/i, lat: 24.6333, lng: 51.3333 },
  ],
  'abu-dhabi': [
    { name: 'Ferrari World', re: /\bferrari world\b/i, lat: 24.4838, lng: 54.6072 },
    { name: 'Yas Waterworld', re: /\bwaterworld\b/i, lat: 24.488, lng: 54.6 },
    { name: 'Warner Bros. World', re: /\bwarner bros\.?\b/i, lat: 24.491, lng: 54.596 },
    { name: 'SeaWorld Abu Dhabi', re: /\bseaworld\b/i, lat: 24.488, lng: 54.587 },
    { name: 'Sheikh Zayed Grand Mosque', re: /\bgrand mosque\b|\bsheikh zayed\b/i, lat: 24.4128, lng: 54.475 },
    { name: 'Louvre Abu Dhabi', re: /\blouvre\b/i, lat: 24.5337, lng: 54.3984 },
    { name: 'Qasr Al Watan', re: /\bqasr al watan\b/i, lat: 24.4617, lng: 54.3056 },
    { name: 'Dubai', re: /\bdubai\b/i, lat: 25.2048, lng: 55.2708 },
  ],
};

/** The landmark a title names first (by position in the title), or null. */
export function landmarkIn(title: string, raceKey: string): LandmarkPlace | null {
  let best: { place: LandmarkPlace; at: number } | null = null;
  for (const place of LANDMARK_PLACES[raceKey] ?? []) {
    const m = place.re.exec(title);
    if (m && (best == null || m.index < best.at)) best = { place, at: m.index };
  }
  return best?.place ?? null;
}
