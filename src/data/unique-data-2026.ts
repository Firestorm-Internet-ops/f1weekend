/**
 * Per-race settings for "unique data" pages (SEO experiment, see
 * src/data/seo-experiments.ts and src/lib/unique-data.ts). Travel times are
 * our door-to-door estimates from the cited timetables; check before you go.
 */
import type { BylineSource } from '@/components/race/PageByline';

export interface TravelRow {
  from: string;
  /** e.g. "Line 4 to Pinheiros, then CPTM Line 9 to Autódromo". */
  byTrain: string;
  trainMins: string;
  /** Car or rideshare on race day (traffic and closures). */
  carMins: string;
  note?: string;
}

export interface UniqueDataRace {
  /** Jolpica circuitId (past winners, race dates for the weather history). */
  circuitId: string;
  circuitShort: string;
  /** <title> while the experiment runs (without the site name). */
  title: (season: number) => string;
  description: (season: number) => string;
  travel: TravelRow[];
  travelNote: string;
  /** One quotable line for the at-a-glance box. */
  fastestWay: string;
  sources: BylineSource[];
}

export const UNIQUE_DATA: Record<string, UniqueDataRace> = {
  brazil: {
    circuitId: 'interlagos',
    circuitShort: 'Interlagos',
    title: (season) => `São Paulo Grand Prix ${season}: Interlagos Weather, Form Guide & Getting There`,
    description: (season) => `Race-day rain at Interlagos over the last 10 Grands Prix, the ${season} standings and Interlagos winners, travel times to the circuit by train and car, and what tours cost in São Paulo on race weekend.`,
    travel: [
      { from: 'Pinheiros', byTrain: 'CPTM Line 9 (Esmeralda) to Autódromo, no change', trainMins: '30–40', carMins: '40–75' },
      { from: 'Brooklin / Berrini', byTrain: 'CPTM Line 9 from Berrini to Autódromo', trainMins: '25–35', carMins: '30–60' },
      { from: 'Avenida Paulista', byTrain: 'Metro Line 4 (Yellow) to Pinheiros, then CPTM Line 9', trainMins: '45–55', carMins: '50–90' },
      { from: 'Jardins', byTrain: 'Metro Line 4 from Oscar Freire to Pinheiros, then CPTM Line 9', trainMins: '45–55', carMins: '45–80' },
      { from: 'Vila Madalena', byTrain: 'Metro Line 2 to Consolação, Line 4 to Pinheiros, then CPTM Line 9', trainMins: '55–70', carMins: '50–90' },
      { from: 'Congonhas airport (CGH)', byTrain: 'No direct train; bus or car', trainMins: '—', carMins: '30–45', note: '14 km; domestic flights' },
      { from: 'Guarulhos airport (GRU)', byTrain: 'Airport train to the city, then Metro and Line 9', trainMins: '120+', carMins: '60–150', note: '48 km; international flights' },
    ],
    fastestWay: 'CPTM Line 9 from Pinheiros straight to Autódromo station, about 30–40 minutes',
    travelNote: 'Autódromo station is about 600 m from the circuit entrance. Trains on Line 9 run every few minutes; on race weekend organisers have also run express trains from Pinheiros (about 25 minutes, booked ahead). Cars and rideshares get stuck in closures near the circuit, so the train is usually faster on Saturday and Sunday.',
    sources: [
      { label: 'Official São Paulo GP mobility guide', url: 'https://www.f1saopaulomobilidade.com.br/' },
      { label: 'CPTM Line 9 (Esmeralda)', url: 'https://en.wikipedia.org/wiki/Line_9_(CPTM)' },
      { label: 'Results and standings: Jolpica F1 API', url: 'https://api.jolpi.ca/ergast/f1/' },
      { label: 'Weather: Open-Meteo historical archive', url: 'https://open-meteo.com/' },
      { label: 'Tour prices: GetYourGuide, Viator and Tiqets listings' },
    ],
  },
};

export function uniqueDataFor(raceKey: string): UniqueDataRace | null {
  return UNIQUE_DATA[raceKey] ?? null;
}
