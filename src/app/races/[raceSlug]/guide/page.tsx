import { permanentRedirect } from 'next/navigation';
import { raceKey } from '@/lib/race-url';
import { resolveRaceSlug } from '@/services/race.service';

interface Props {
  params: Promise<{ raceSlug: string }>;
}

export default async function GuidePage({ params }: Props) {
  const { raceSlug: raceParam } = await params;
  const raceSlug = (await resolveRaceSlug(raceParam)) ?? raceParam;
  permanentRedirect(`/races/${raceKey(raceSlug)}`); // the guide is the race page
}
