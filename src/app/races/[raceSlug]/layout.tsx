import { permanentRedirect } from 'next/navigation';
import { isOffCalendar } from '@/data/calendar-2026';
import { resolveRaceSlug } from '@/services/race.service';

/**
 * Races dropped from the 2026 calendar (Saudi) keep their URLs but send
 * visitors — and search engines — to the season page.
 */
export default async function RaceLayout({ children, params }: { children: React.ReactNode; params: Promise<{ raceSlug: string }> }) {
  const { raceSlug: raceParam } = await params;
  const raceSlug = (await resolveRaceSlug(raceParam)) ?? raceParam;
  if (isOffCalendar(raceSlug)) permanentRedirect('/f1-2026');
  return children;
}
