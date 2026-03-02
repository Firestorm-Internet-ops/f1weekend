import { redirect } from 'next/navigation';
import { getActiveRaceSlug } from '@/lib/activeRace';

export default async function ExperiencesRedirect() {
  redirect(`/races/${await getActiveRaceSlug()}/experiences`);
}
