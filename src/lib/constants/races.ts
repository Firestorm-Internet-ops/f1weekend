export interface RaceMeta {
  flag: string;
  short: string;
  city: string;
  country: string;
  dates: string;
  name: string;
  available: boolean;
  endDate: string; // ISO date (YYYY-MM-DD) — race day end, used for "upcoming" calculation
}

export const RACES: Record<string, RaceMeta> = {
  'melbourne-2026': {
    flag: '🇦🇺',
    short: 'AUS',
    city: 'Melbourne',
    country: 'Australian GP',
    dates: 'Mar 5–8',
    name: 'Australian Grand Prix',
    available: true,
    endDate: '2026-03-08',
  },
  'shanghai-2026': {
    flag: '🇨🇳',
    short: 'CHN',
    city: 'Shanghai',
    country: 'Chinese GP',
    dates: 'Mar 13–15',
    name: 'Chinese Grand Prix',
    available: true,
    endDate: '2026-03-15',
  },
  'japan-2026': {
    flag: '🇯🇵',
    short: 'JPN',
    city: 'Suzuka',
    country: 'Japanese GP',
    dates: 'Mar 27–29',
    name: 'Japanese Grand Prix',
    available: true,
    endDate: '2026-03-29',
  },
  'bahrain-2026': {
    flag: '🇧🇭',
    short: 'BHR',
    city: 'Sakhir',
    country: 'Bahrain GP',
    dates: 'Apr 10–12',
    name: 'Bahrain Grand Prix',
    available: true,
    endDate: '2026-04-12',
  },
};
