import { permanentRedirect } from 'next/navigation';
import { isOffCalendar } from '@/data/calendar-2026';

/**
 * Races dropped from the 2026 calendar (Saudi) keep their URLs but send
 * visitors — and search engines — to the season page.
 */
export default async function RaceLayout({ children, params }: { children: React.ReactNode; params: Promise<{ raceSlug: string }> }) {
  const { raceSlug } = await params;
  if (isOffCalendar(raceSlug)) permanentRedirect('/f1-2026');
  return children;
}
