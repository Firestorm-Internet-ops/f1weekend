import { redirect } from 'next/navigation';
import { getActiveRaceSlug } from '@/lib/activeRace';

export default async function GuideRedirect() {
  redirect(`/races/${await getActiveRaceSlug()}/guide`);
}
