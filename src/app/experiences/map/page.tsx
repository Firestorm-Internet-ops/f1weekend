import { redirect } from 'next/navigation';
import { getActiveRaceSlug } from '@/lib/activeRace';

export default function ExperiencesMapRedirect() {
  redirect(`/races/${getActiveRaceSlug()}/experiences/map`);
}
