import { redirect } from 'next/navigation';
import { getActiveRaceSlug } from '@/lib/activeRace';

export default async function ScheduleRedirect() {
  redirect(`/races/${await getActiveRaceSlug()}/schedule`);
}
