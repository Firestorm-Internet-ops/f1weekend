import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getItinerary } from '@/services/itinerary.service';
import { getRaceBySlug } from '@/services/race.service';
import { getExperiencesByRace } from '@/services/experience.service';
import ItineraryView from '@/components/itinerary/ItineraryView';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const itinerary = await getItinerary(id);
  if (!itinerary) return { title: 'Itinerary | F1 Weekend' };

  const description = itinerary.summary
    ?? `Custom F1 race weekend itinerary for the 2026 Australian Grand Prix — ${itinerary.title}.`;

  return {
    title: itinerary.title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title: itinerary.title,
      description,
      url: `https://f1weekend.co/itinerary/${id}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: itinerary.title,
      description,
    },
  };
}

export default async function ItineraryDetailPage({ params }: Props) {
  const { id } = await params;
  const itinerary = await getItinerary(id);

  if (!itinerary) notFound();

  const race = await getRaceBySlug('melbourne-2026');
  const experiences = race ? await getExperiencesByRace(race.id) : [];

  return (
    <div className="min-h-screen pt-24 pb-24 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/itinerary"
            className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors"
          >
            ← Build another
          </Link>
        </div>

        <ItineraryView itinerary={itinerary} experiences={experiences} />
      </div>
    </div>
  );
}
