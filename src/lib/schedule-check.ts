/**
 * Compares what the site shows with Jolpica: race dates in the 2026 calendar
 * and hand-entered timetables (src/data/timetables-2026.ts). Anything listed
 * needs a person: F1 moved a session, or Jolpica hasn't caught up yet.
 * Races without a hand-entered timetable already use Jolpica's times directly.
 */
import { timetableSessions } from '@/data/timetables-2026';
import { findJolpicaRace, sessionsOf, toSessionRows, type JolpicaRace } from '@/lib/jolpica';
import type { Race } from '@/types/race';

export interface ScheduleIssue {
  race: string;
  kind: 'not-in-jolpica' | 'date' | 'session-time' | 'session-missing';
  detail: string;
}

export function checkSchedules(races: Race[], season: JolpicaRace[], today: string): ScheduleIssue[] {
  const issues: ScheduleIssue[] = [];
  for (const race of races) {
    if (race.raceDate < today) continue; // finished: nothing to fix
    const j = findJolpicaRace(season, race);
    if (!j) {
      issues.push({ race: race.slug, kind: 'not-in-jolpica', detail: `No Jolpica race within a day of ${race.raceDate} near ${race.circuitName}` });
      continue;
    }
    const raceSession = sessionsOf(j).find((s) => s.key === 'RACE');
    if (raceSession) {
      const localDate = new Intl.DateTimeFormat('en-CA', { timeZone: race.timezone }).format(new Date(raceSession.startUtc));
      if (localDate !== race.raceDate) {
        issues.push({ race: race.slug, kind: 'date', detail: `Calendar says ${race.raceDate}, Jolpica says ${localDate} (${j.raceName})` });
      }
    }
    const coded = timetableSessions(race.slug, race.id);
    if (coded.length === 0) continue;
    const official = toSessionRows(sessionsOf(j), race.id, race.timezone);
    for (const o of official) {
      const c = coded.find((x) => x.shortName === o.shortName || (x.sessionType === o.sessionType && x.dayOfWeek === o.dayOfWeek && x.sessionType !== 'practice'));
      if (!c) {
        issues.push({ race: race.slug, kind: 'session-missing', detail: `${o.name} (${o.dayOfWeek} ${o.startTime}) is in Jolpica but not in timetables-2026.ts` });
      } else if (c.dayOfWeek !== o.dayOfWeek || c.startTime.slice(0, 5) !== o.startTime) {
        issues.push({ race: race.slug, kind: 'session-time', detail: `${o.name}: timetable ${c.dayOfWeek} ${c.startTime}, Jolpica ${o.dayOfWeek} ${o.startTime}` });
      }
    }
  }
  return issues;
}
