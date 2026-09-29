import { permanentRedirect } from 'next/navigation';

interface Props {
  params: Promise<{ raceSlug: string }>;
}

export default async function GuidePage({ params }: Props) {
  const { raceSlug } = await params;
  permanentRedirect(`/races/${raceSlug}`); // the guide is the race page
}
