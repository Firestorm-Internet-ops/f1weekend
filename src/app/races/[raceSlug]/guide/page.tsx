import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ raceSlug: string }>;
}

export default async function GuidePage({ params }: Props) {
  const { raceSlug } = await params;
  redirect(`/races/${raceSlug}`);
}
