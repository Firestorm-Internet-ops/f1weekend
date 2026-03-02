import { redirect } from 'next/navigation';
import { getActiveRaceSlug } from '@/lib/activeRace';

export default async function GettingThereRedirect() {
  redirect(`/races/${await getActiveRaceSlug()}/getting-there`);
}
