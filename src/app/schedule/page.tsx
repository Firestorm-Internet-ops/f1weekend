import { redirect } from 'next/navigation';
import { getActiveRaceSlug } from '@/lib/activeRace';
import { raceKey } from '@/lib/race-url';

export const dynamic = 'force-dynamic'; // see app/layout.tsx

export default async function ScheduleRedirect() {
  redirect(`/races/${raceKey(await getActiveRaceSlug())}/schedule`);
}
