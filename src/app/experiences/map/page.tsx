import { redirect } from 'next/navigation';
import { getActiveRaceSlug } from '@/lib/activeRace';

export default async function ExperiencesMapRedirect() {
  redirect(`/races/${await getActiveRaceSlug()}/experiences/map`);
}
