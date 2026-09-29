/**
 * Full weekend timetables (local time) for races whose schedule isn't in the
 * database — currently the Bahrain GP at Sepang, whose stored sessions are
 * for Sakhir. Source: the official F1 event timetable.
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
