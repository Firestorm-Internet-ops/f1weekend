import { redirect } from 'next/navigation';
import { getActiveRaceSlug } from '@/lib/activeRace';
import { raceKey } from '@/lib/race-url';

export default async function ScheduleRedirect() {
  redirect(`/races/${raceKey(await getActiveRaceSlug())}/schedule`);
}
