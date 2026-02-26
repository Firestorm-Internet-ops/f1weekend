import { redirect } from 'next/navigation';
import { getActiveRaceSlug } from '@/lib/activeRace';

export default function ExperiencesRedirect() {
  redirect(`/races/${getActiveRaceSlug()}/experiences`);
}
