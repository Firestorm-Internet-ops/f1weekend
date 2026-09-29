import { redirect } from 'next/navigation';
import { getActiveRaceSlug } from '@/lib/activeRace';
import { raceKey } from '@/lib/race-url';

export default async function GettingThereRedirect() {
  redirect(`/races/${raceKey(await getActiveRaceSlug())}/getting-there`);
}
