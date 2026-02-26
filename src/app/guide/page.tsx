import { redirect } from 'next/navigation';
import { getActiveRaceSlug } from '@/lib/activeRace';

export default function GuideRedirect() {
  redirect(`/races/${getActiveRaceSlug()}/guide`);
}
