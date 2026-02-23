/**
 * Melbourne 2026 Race Weekend Schedule
 * Formula 1 Qatar Airways Australian Grand Prix 2026
 * Albert Park Circuit, Melbourne · March 5–8, 2026 · AEDT (UTC+11)
 *
 * F1 session times are official.
 * Thursday on-circuit programme from official FOM release.
 * F2/F3/Supercars times based on typical Melbourne support programme.
 */

export type SeriesKey =
  | 'f1'
  | 'f2'
  | 'f3'
  | 'supercars'
  | 'porsche'
  | 'press'
  | 'promoter'
  | 'experiences';

export interface ScheduleEntry {
  series: string;
  seriesKey: SeriesKey;
  name: string;
  startTime: string; // "HH:MM" 24-hr AEDT
  endTime: string;   // "HH:MM" 24-hr AEDT
}

export interface ScheduleDay {
  day: 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  date: string; // "05 March"
  entries: ScheduleEntry[];
}

export const MELBOURNE_2026_SCHEDULE: ScheduleDay[] = [
  {
    day: 'Thursday',
    date: '05 March',
    entries: [
      {
        series: 'Porsche Carrera Cup',
        seriesKey: 'porsche',
        name: 'Practice Session',
        startTime: '09:45',
        endTime: '10:15',
      },
      {
        series: 'Supercars Championship',
        seriesKey: 'supercars',
        name: 'Practice 1',
        startTime: '10:35',
        endTime: '11:05',
      },
      {
        series: 'Porsche Carrera Cup',
        seriesKey: 'porsche',
        name: 'Qualifying',
        startTime: '11:35',
        endTime: '12:05',
      },
      {
        series: 'Supercars Championship',
        seriesKey: 'supercars',
        name: 'Practice 2',
        startTime: '12:25',
        endTime: '12:55',
      },
      {
        series: 'Press Conference',
        seriesKey: 'press',
        name: "F1 Drivers' Press Conference",
        startTime: '13:30',
        endTime: '14:30',
      },
      {
        series: 'Supercars Championship',
        seriesKey: 'supercars',
        name: 'Qualifying',
        startTime: '14:20',
        endTime: '14:50',
      },
      {
        series: 'Porsche Carrera Cup',
        seriesKey: 'porsche',
        name: 'Race 1',
        startTime: '15:35',
        endTime: '16:10',
      },
      {
        series: 'Promoter Activity',
        seriesKey: 'promoter',
        name: 'F1 Car Demonstration',
        startTime: '16:20',
        endTime: '16:35',
      },
      {
        series: 'Supercars Championship',
        seriesKey: 'supercars',
        name: 'Race 1',
        startTime: '16:55',
        endTime: '17:40',
      },
      {
        series: 'Promoter Activity',
        seriesKey: 'promoter',
        name: 'Driver Autograph Session',
        startTime: '18:00',
        endTime: '18:45',
      },
      {
        series: 'F1 Experiences',
        seriesKey: 'experiences',
        name: 'Track Tour & Pit Lane Walk',
        startTime: '18:50',
        endTime: '20:15',
      },
      {
        series: 'F1 Experiences',
        seriesKey: 'experiences',
        name: 'Track Tour & Pit Lane Walk',
        startTime: '20:30',
        endTime: '21:45',
      },
    ],
  },
  {
    day: 'Friday',
    date: '06 March',
    entries: [
      {
        series: 'F1 Experiences',
        seriesKey: 'experiences',
        name: 'Circuit Walk',
        startTime: '08:30',
        endTime: '10:00',
      },
      {
        series: 'FIA Formula 3',
        seriesKey: 'f3',
        name: 'Practice',
        startTime: '09:35',
        endTime: '10:25',
      },
      {
        series: 'FIA Formula 2',
        seriesKey: 'f2',
        name: 'Practice',
        startTime: '10:40',
        endTime: '11:30',
      },
      {
        series: 'Porsche Carrera Cup',
        seriesKey: 'porsche',
        name: 'Race 2',
        startTime: '11:45',
        endTime: '12:15',
      },
      {
        series: 'Formula 1',
        seriesKey: 'f1',
        name: 'Free Practice 1',
        startTime: '12:30',
        endTime: '13:30',
      },
      {
        series: 'FIA Formula 3',
        seriesKey: 'f3',
        name: 'Qualifying',
        startTime: '13:45',
        endTime: '14:15',
      },
      {
        series: 'FIA Formula 2',
        seriesKey: 'f2',
        name: 'Qualifying',
        startTime: '14:30',
        endTime: '15:00',
      },
      {
        series: 'Supercars Championship',
        seriesKey: 'supercars',
        name: 'Race 2',
        startTime: '15:10',
        endTime: '15:50',
      },
      {
        series: 'Formula 1',
        seriesKey: 'f1',
        name: 'Free Practice 2',
        startTime: '16:00',
        endTime: '17:00',
      },
      {
        series: 'Supercars Championship',
        seriesKey: 'supercars',
        name: 'Race 3',
        startTime: '17:15',
        endTime: '17:55',
      },
      {
        series: 'Promoter Activity',
        seriesKey: 'promoter',
        name: 'Driver Autograph Session',
        startTime: '18:00',
        endTime: '18:45',
      },
      {
        series: 'Press Conference',
        seriesKey: 'press',
        name: "F1 Team Principals' Press Conference",
        startTime: '18:30',
        endTime: '19:30',
      },
      {
        series: 'Promoter Activity',
        seriesKey: 'promoter',
        name: 'Fan Stage Entertainment',
        startTime: '19:30',
        endTime: '21:00',
      },
      {
        series: 'F1 Experiences',
        seriesKey: 'experiences',
        name: 'Pit Lane Walk',
        startTime: '19:00',
        endTime: '20:30',
      },
      {
        series: 'F1 Experiences',
        seriesKey: 'experiences',
        name: 'Pit Lane Walk',
        startTime: '20:30',
        endTime: '22:00',
      },
    ],
  },
  {
    day: 'Saturday',
    date: '07 March',
    entries: [
      {
        series: 'F1 Experiences',
        seriesKey: 'experiences',
        name: 'Track Tour',
        startTime: '08:30',
        endTime: '10:00',
      },
      {
        series: 'FIA Formula 3',
        seriesKey: 'f3',
        name: 'Race 1',
        startTime: '09:35',
        endTime: '10:10',
      },
      {
        series: 'FIA Formula 2',
        seriesKey: 'f2',
        name: 'Sprint Race',
        startTime: '10:25',
        endTime: '11:20',
      },
      {
        series: 'Porsche Carrera Cup',
        seriesKey: 'porsche',
        name: 'Race 3',
        startTime: '11:35',
        endTime: '12:05',
      },
      {
        series: 'Formula 1',
        seriesKey: 'f1',
        name: 'Free Practice 3',
        startTime: '12:30',
        endTime: '13:30',
      },
      {
        series: 'Supercars Championship',
        seriesKey: 'supercars',
        name: 'Race 4',
        startTime: '13:45',
        endTime: '14:25',
      },
      {
        series: 'FIA Formula 3',
        seriesKey: 'f3',
        name: 'Race 2',
        startTime: '14:40',
        endTime: '15:15',
      },
      {
        series: 'Promoter Activity',
        seriesKey: 'promoter',
        name: 'Driver Autograph Session',
        startTime: '15:20',
        endTime: '15:55',
      },
      {
        series: 'Formula 1',
        seriesKey: 'f1',
        name: 'Qualifying',
        startTime: '16:00',
        endTime: '17:00',
      },
      {
        series: 'Press Conference',
        seriesKey: 'press',
        name: 'F1 Post-Qualifying Press Conference',
        startTime: '17:15',
        endTime: '18:15',
      },
      {
        series: 'Promoter Activity',
        seriesKey: 'promoter',
        name: 'Fan Stage Live Music',
        startTime: '18:30',
        endTime: '20:00',
      },
      {
        series: 'F1 Experiences',
        seriesKey: 'experiences',
        name: 'Pit Lane Walk',
        startTime: '19:00',
        endTime: '20:30',
      },
      {
        series: 'Promoter Activity',
        seriesKey: 'promoter',
        name: 'Headline Concert',
        startTime: '20:30',
        endTime: '22:30',
      },
      {
        series: 'F1 Experiences',
        seriesKey: 'experiences',
        name: 'Pit Lane Walk',
        startTime: '20:45',
        endTime: '22:15',
      },
    ],
  },
  {
    day: 'Sunday',
    date: '08 March',
    entries: [
      {
        series: 'FIA Formula 3',
        seriesKey: 'f3',
        name: 'Feature Race',
        startTime: '09:30',
        endTime: '10:15',
      },
      {
        series: 'FIA Formula 2',
        seriesKey: 'f2',
        name: 'Feature Race',
        startTime: '10:30',
        endTime: '11:25',
      },
      {
        series: 'Porsche Carrera Cup',
        seriesKey: 'porsche',
        name: 'Race 4',
        startTime: '11:40',
        endTime: '12:15',
      },
      {
        series: 'F1 Experiences',
        seriesKey: 'experiences',
        name: 'Pre-Race Pit Lane Walk',
        startTime: '12:00',
        endTime: '13:30',
      },
      {
        series: 'Promoter Activity',
        seriesKey: 'promoter',
        name: 'Driver Autograph Session',
        startTime: '12:30',
        endTime: '13:15',
      },
      {
        series: 'Promoter Activity',
        seriesKey: 'promoter',
        name: 'Driver Parade',
        startTime: '13:30',
        endTime: '14:00',
      },
      {
        series: 'Promoter Activity',
        seriesKey: 'promoter',
        name: 'Pre-Race Entertainment',
        startTime: '14:00',
        endTime: '14:50',
      },
      {
        series: 'Promoter Activity',
        seriesKey: 'promoter',
        name: 'Grid Walk',
        startTime: '14:05',
        endTime: '14:50',
      },
      {
        series: 'Formula 1',
        seriesKey: 'f1',
        name: 'Race',
        startTime: '15:00',
        endTime: '17:00',
      },
      {
        series: 'Promoter Activity',
        seriesKey: 'promoter',
        name: 'Podium Ceremony',
        startTime: '17:15',
        endTime: '17:50',
      },
      {
        series: 'F1 Experiences',
        seriesKey: 'experiences',
        name: 'Victory Lane Celebrations',
        startTime: '17:50',
        endTime: '19:30',
      },
      {
        series: 'Promoter Activity',
        seriesKey: 'promoter',
        name: 'Post-Race Concert',
        startTime: '18:30',
        endTime: '21:30',
      },
    ],
  },
];
