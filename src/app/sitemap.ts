import type { MetadataRoute } from 'next';
import { getRaceBySlug } from '@/services/race.service';
import { getExperiencesByRace } from '@/services/experience.service';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const race = await getRaceBySlug('melbourne-2026');
  const exps = race ? await getExperiencesByRace(race.id) : [];

  return [
    {
      url: 'https://pitlane.app',
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: 'https://pitlane.app/experiences',
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: 'https://pitlane.app/schedule',
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...exps.map((e) => ({
      url: `https://pitlane.app/experiences/${e.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      lastModified: new Date(),
    })),
  ];
}
