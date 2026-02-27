export interface RaceMeta {
  flag: string;
  short: string;
  city: string;
  country: string;
  dates: string;
  name: string;
  available: boolean;
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
  },
  'shanghai-2026': {
    flag: '🇨🇳',
    short: 'CHN',
    city: 'Shanghai',
    country: 'Chinese GP',
    dates: 'Mar 13–15',
    name: 'Chinese Grand Prix',
    available: true,
  },
};
