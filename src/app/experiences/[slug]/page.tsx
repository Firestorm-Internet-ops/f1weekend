import { notFound, permanentRedirect } from 'next/navigation';
import { getExperienceBySlug } from '@/services/experience.service';
import { getRaceById } from '@/services/race.service';

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * Old flat URL (/experiences/<slug>). The experience's page lives under its
 * own race; this used to render a copy labelled with whichever race was
 * current. Permanent redirect keeps old links and rankings.
 */
export default async function LegacyExperienceRedirect({ params }: Props) {
  const { slug } = await params;
  const exp = await getExperienceBySlug(slug);
  if (!exp) notFound();
  const race = await getRaceById(exp.raceId);
  if (!race) notFound();
  permanentRedirect(`/races/${race.slug}/experiences/${exp.slug}`);
}
