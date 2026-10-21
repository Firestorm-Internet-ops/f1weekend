/**
 * Full weekend timetables (local time) for races whose schedule isn't in the
 * database: the Bahrain GP at Sepang (stored sessions are for Sakhir) and the
 * United States GP (Jolpica only has the F1 sessions). Sources per race below.
 * race.service turns the F1 sessions into Session rows; schedule.service
 * shows every entry on the schedule page.
 */
import type { SeriesKey } from '@/types/schedule';
import type { Session } from '@/types/race';

export interface TimetableEntry {
  day: Session['dayOfWeek'];
  start: string; // HH:MM local
  end: string;
  series: string;
  seriesKey: SeriesKey;
  name: string;
  /** Set for the Formula 1 track sessions (these become Session rows). */
  session?: { type: Session['sessionType']; shortName: string };
}

export const TIMETABLES_2026: Record<string, TimetableEntry[]> = {
  // Bahrain GP in Malaysia, Sepang. Kuala Lumpur is UTC+8.
  'bahrain-2026': [
    { day: 'Friday', start: '10:15', end: '10:45', series: 'Formula Trophy Malaysia', seriesKey: 'support', name: 'Formula Trophy Malaysia · Practice 1' },
    { day: 'Friday', start: '11:00', end: '12:00', series: 'FIA', seriesKey: 'promoter', name: 'F1 Car Presentation' },
    { day: 'Friday', start: '12:30', end: '13:30', series: 'Formula 1', seriesKey: 'f1', name: 'Practice 1', session: { type: 'practice', shortName: 'FP1' } },
    { day: 'Friday', start: '14:00', end: '14:30', series: 'Formula Trophy Malaysia', seriesKey: 'support', name: 'Formula Trophy Malaysia · Practice 2' },
    { day: 'Friday', start: '14:30', end: '15:30', series: 'Formula 1', seriesKey: 'press', name: "Teams' Press Conference" },
    { day: 'Friday', start: '16:00', end: '17:00', series: 'Formula 1', seriesKey: 'f1', name: 'Practice 2', session: { type: 'practice', shortName: 'FP2' } },
    { day: 'Saturday', start: '10:30', end: '11:00', series: 'Formula Trophy Malaysia', seriesKey: 'support', name: 'Formula Trophy Malaysia · Qualifying' },
    { day: 'Saturday', start: '12:30', end: '13:30', series: 'Formula 1', seriesKey: 'f1', name: 'Practice 3', session: { type: 'practice', shortName: 'FP3' } },
    { day: 'Saturday', start: '14:15', end: '14:47', series: 'Formula Trophy Malaysia', seriesKey: 'support', name: 'Formula Trophy Malaysia · Race 1' },
    { day: 'Saturday', start: '16:00', end: '17:00', series: 'Formula 1', seriesKey: 'f1', name: 'Qualifying', session: { type: 'qualifying', shortName: 'Q' } },
    { day: 'Saturday', start: '17:00', end: '18:00', series: 'Formula 1', seriesKey: 'press', name: 'Press Conference' },
    { day: 'Sunday', start: '11:45', end: '12:17', series: 'Formula Trophy Malaysia', seriesKey: 'support', name: 'Formula Trophy Malaysia · Race 2' },
    { day: 'Sunday', start: '13:00', end: '13:30', series: 'Formula 1', seriesKey: 'promoter', name: "Drivers' Parade" },
    { day: 'Sunday', start: '14:44', end: '14:46', series: 'Formula 1', seriesKey: 'promoter', name: 'National Anthem' },
    { day: 'Sunday', start: '15:00', end: '17:00', series: 'Formula 1', seriesKey: 'f1', name: 'Grand Prix (56 laps)', session: { type: 'race', shortName: 'RACE' } },
  ],
  // United States GP, Circuit of the Americas, Austin (CDT, UTC−5).
  // Source: https://circuitoftheamericas.com/event/f1/schedule/ (checked 21 Oct 2026).
  // Track action and timed events only: fan-zone interviews are left out, and so are
  // the concerts, which COTA lists without times (Maroon 5 Fri, Post Malone Sat, Alesso Sun 17:30).
  'usa-2026': [
    { day: 'Thursday', start: '12:25', end: '13:05', series: 'F1 Academy', seriesKey: 'f1-academy', name: 'F1 Academy · Practice' },
    { day: 'Thursday', start: '13:20', end: '13:50', series: 'Formula 1', seriesKey: 'promoter', name: 'Pirelli Hot Laps' },
    { day: 'Thursday', start: '14:00', end: '16:00', series: 'Formula 1', seriesKey: 'promoter', name: 'Pit Lane Walk' },
    { day: 'Thursday', start: '16:30', end: '17:00', series: 'F1 Academy', seriesKey: 'f1-academy', name: 'F1 Academy · Qualifying' },
    { day: 'Friday', start: '09:45', end: '10:10', series: 'Masters Historic Racing', seriesKey: 'support', name: 'Masters Historic · Practice' },
    { day: 'Friday', start: '10:20', end: '10:55', series: 'Formula 1', seriesKey: 'promoter', name: 'Pirelli Hot Laps' },
    { day: 'Friday', start: '11:50', end: '12:00', series: 'MotoGP', seriesKey: 'promoter', name: 'MotoGP Takes the Track' },
    { day: 'Friday', start: '12:30', end: '13:30', series: 'Formula 1', seriesKey: 'f1', name: 'Practice 1', session: { type: 'practice', shortName: 'FP1' } },
    { day: 'Friday', start: '14:00', end: '14:30', series: 'Porsche Carrera Cup North America', seriesKey: 'porsche-cup', name: 'Porsche Carrera Cup · Practice' },
    { day: 'Friday', start: '14:55', end: '15:20', series: 'Masters Historic Racing', seriesKey: 'support', name: 'Masters Historic · Qualifying' },
    { day: 'Friday', start: '16:00', end: '17:00', series: 'Formula 1', seriesKey: 'f1', name: 'Practice 2', session: { type: 'practice', shortName: 'FP2' } },
    { day: 'Friday', start: '17:50', end: '18:25', series: 'F1 Academy', seriesKey: 'f1-academy', name: 'F1 Academy · Race 1 (13 laps)' },
    { day: 'Saturday', start: '09:10', end: '09:40', series: 'Porsche Carrera Cup North America', seriesKey: 'porsche-cup', name: 'Porsche Carrera Cup · Qualifying' },
    { day: 'Saturday', start: '10:10', end: '10:40', series: 'Masters Historic Racing', seriesKey: 'support', name: 'Masters Historic · Race 1' },
    { day: 'Saturday', start: '11:40', end: '12:00', series: 'MotoGP', seriesKey: 'promoter', name: 'MotoGP Takes the Track' },
    { day: 'Saturday', start: '12:30', end: '13:30', series: 'Formula 1', seriesKey: 'f1', name: 'Practice 3', session: { type: 'practice', shortName: 'FP3' } },
    { day: 'Saturday', start: '13:45', end: '14:10', series: 'Formula 1', seriesKey: 'promoter', name: 'Pirelli Hot Laps' },
    { day: 'Saturday', start: '14:35', end: '15:15', series: 'Porsche Carrera Cup North America', seriesKey: 'porsche-cup', name: 'Porsche Carrera Cup · Race 1' },
    { day: 'Saturday', start: '16:00', end: '17:00', series: 'Formula 1', seriesKey: 'f1', name: 'Qualifying', session: { type: 'qualifying', shortName: 'Q' } },
    { day: 'Saturday', start: '18:00', end: '18:35', series: 'F1 Academy', seriesKey: 'f1-academy', name: 'F1 Academy · Race 2, reverse grid (13 laps)' },
    { day: 'Sunday', start: '09:25', end: '09:55', series: 'Masters Historic Racing', seriesKey: 'support', name: 'Masters Historic · Race 2' },
    { day: 'Sunday', start: '10:40', end: '11:10', series: 'F1 Academy', seriesKey: 'f1-academy', name: 'F1 Academy · Race 3 (13 laps)' },
    { day: 'Sunday', start: '11:50', end: '12:30', series: 'Porsche Carrera Cup North America', seriesKey: 'porsche-cup', name: 'Porsche Carrera Cup · Race 2' },
    { day: 'Sunday', start: '13:00', end: '13:30', series: 'Formula 1', seriesKey: 'promoter', name: "Drivers' Parade" },
    { day: 'Sunday', start: '13:30', end: '13:55', series: 'Formula 1', seriesKey: 'promoter', name: 'Pirelli Hot Laps' },
    { day: 'Sunday', start: '14:44', end: '14:46', series: 'Formula 1', seriesKey: 'promoter', name: 'National Anthem' },
    { day: 'Sunday', start: '15:00', end: '17:00', series: 'Formula 1', seriesKey: 'f1', name: 'Grand Prix (56 laps)', session: { type: 'race', shortName: 'RACE' } },
  ],
};

export function timetableFor(slug: string): TimetableEntry[] | undefined {
  return TIMETABLES_2026[slug];
}

/** The Formula 1 track sessions of a timetable, as Session rows (ids are negative: not database rows). */
export function timetableSessions(slug: string, raceId: number): Session[] {
  return (TIMETABLES_2026[slug] ?? [])
    .filter((e) => e.session)
    .map((e, i) => ({
      id: -(i + 1),
      raceId,
      name: e.name,
      shortName: e.session!.shortName,
      dayOfWeek: e.day,
      startTime: e.start,
      endTime: e.end,
      sessionType: e.session!.type,
    }));
}
