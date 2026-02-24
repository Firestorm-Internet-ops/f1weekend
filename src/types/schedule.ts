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
