'use client';

import { useRouter } from 'next/navigation';
import type { Race } from '@/types/race';
import { formatRaceDates } from '@/lib/utils';

interface Props {
  races: Race[];
  currentSlug: string;
  /** e.g. '/races/{slug}/tips'  or  '/?race={slug}' */
  pathTemplate: string;
  label?: string;
}

export default function RaceSwitcher({ races, currentSlug, pathTemplate, label = 'RACE' }: Props) {
  const router = useRouter();
  const available = races.filter((r) => r.available);
  if (available.length <= 1) return null;

  const btnClass = (active: boolean) =>
    `px-3 py-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-2 ${
      active
        ? 'border-[var(--accent-red)] bg-[#e1060012] text-white'
        : 'border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--border-medium)] hover:text-white'
    }`;

  return (
    <div className="mb-8">
      <p className="text-xs font-medium uppercase-label text-[var(--text-secondary)] mb-3">
        {label}
      </p>
      <div className="flex gap-2 flex-wrap">
        {available.map((race) => {
          return (
            <button
              key={race.slug}
              onClick={() => router.push(pathTemplate.replace('{slug}', race.slug))}
              className={btnClass(race.slug === currentSlug)}
            >
              {race.flag && <span>{race.flag}</span>}
              <span>{race.city}</span>
              <span className="text-xs text-[var(--text-secondary)]">{formatRaceDates(race.raceDate, race.hasThursdayFreeDay)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
