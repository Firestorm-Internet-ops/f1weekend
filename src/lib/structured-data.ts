/**
 * Structured data (schema.org JSON-LD) shared by the race pages, so every
 * page describes a race the same way.
 */
import type { Race } from '@/types/race';
import { raceKey } from '@/lib/race-url';

const SITE = 'https://f1weekend.co';

function minusDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/** The race weekend as a SportsEvent (dates are the weekend's local days). */
export function raceEventLd(race: Race, subEvent?: object[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: `${race.season} ${race.name}`,
    sport: 'Formula 1',
    startDate: race.startDate ?? minusDays(race.raceDate, 2),
    endDate: race.raceDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    url: `${SITE}/races/${raceKey(race.slug)}`,
    location: {
      '@type': 'Place',
      name: race.circuitName,
      address: { '@type': 'PostalAddress', addressLocality: race.city, addressCountry: race.countryCode },
      ...(Number.isFinite(race.circuitLat) && Number.isFinite(race.circuitLng)
        ? { geo: { '@type': 'GeoCoordinates', latitude: race.circuitLat, longitude: race.circuitLng } }
        : {}),
    },
    organizer: { '@type': 'Organization', name: 'Formula 1', url: 'https://www.formula1.com' },
    ...(subEvent && subEvent.length > 0 ? { subEvent } : {}),
  };
}

/** The page itself: who wrote it and when its data was last refreshed (only when we know). */
export function webPageLd(path: string, name: string, dateModified?: string | null) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    url: `${SITE}${path}`,
    author: { '@type': 'Organization', name: 'F1 Weekend', url: `${SITE}/about` },
    publisher: { '@type': 'Organization', name: 'Firestorm Internet', url: SITE },
    ...(dateModified ? { dateModified } : {}),
  };
}
