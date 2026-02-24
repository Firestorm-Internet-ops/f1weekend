'use client';

import { useEffect, useState } from 'react';
import { sessionToUtcDate, formatInTimezone, getTimezoneAbbr } from '@/lib/utils';

interface SessionTimeProps {
  /** Race date: "2026-03-06" */
  raceDate: string;
  /** Session start or end time: "12:30" or "12:30:00" */
  time: string;
  /** IANA timezone of the race: "Australia/Melbourne" */
  raceTz: string;
  /** If true, only show the race-local time (no user conversion) */
  localOnly?: boolean;
}

/**
 * Displays a session time in the race's local timezone,
 * with the user's local time shown alongside if different.
 *
 * Server renders race-local time. After hydration, adds user-local time.
 *
 * Example output:
 *   12:30 PM AEDT  ·  1:30 AM GMT
 *   12:30 PM AEDT  ·  9:30 PM EST
 */
export function SessionTime({ raceDate, time, raceTz, localOnly = false }: SessionTimeProps) {
  const [userTz, setUserTz] = useState<string | null>(null);

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Only set if different from race timezone (no need to show twice)
    if (tz !== raceTz) setUserTz(tz);
  }, [raceTz]);

  const utcDate = sessionToUtcDate(raceDate, time, raceTz);
  const raceLocalTime = formatInTimezone(utcDate, raceTz);
  const raceAbbr = getTimezoneAbbr(raceTz, utcDate);

  return (
    <span className="font-mono tabular-nums">
      <span className="text-white">
        {raceLocalTime}
      </span>
      <span className="text-[var(--text-secondary)] text-xs ml-1">
        {raceAbbr}
      </span>

      {!localOnly && userTz && (
        <>
          <span className="text-[var(--text-secondary)] mx-1.5">·</span>
          <span className="text-[var(--text-secondary)]">
            {formatInTimezone(utcDate, userTz)}
          </span>
          <span className="text-[var(--text-secondary)] text-xs ml-1">
            {getTimezoneAbbr(userTz, utcDate)}
          </span>
        </>
      )}
    </span>
  );
}
