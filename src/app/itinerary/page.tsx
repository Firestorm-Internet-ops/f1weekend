import ItineraryForm from '@/components/itinerary/ItineraryForm';

export const metadata = {
  title: 'Build Itinerary | Pitlane',
  description: 'Create a personalised AI race weekend itinerary for Melbourne 2026.',
};

export default function ItineraryPage() {
  return (
    <div className="min-h-screen pt-24 pb-24 px-4">
      <div className="max-w-xl mx-auto">
        <div className="mb-10">
          <p className="text-xs font-medium uppercase-label text-[var(--accent-teal)] mb-2">
            AI-Powered
          </p>
          <h1 className="font-display font-black text-4xl text-white uppercase-heading leading-tight">
            Build Your<br />Itinerary
          </h1>
          <p className="text-[var(--text-secondary)] mt-3">
            Tell us when you arrive and what you love. We&apos;ll plan your perfect Melbourne race weekend.
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6 md:p-8">
          <ItineraryForm />
        </div>
      </div>
    </div>
  );
}
