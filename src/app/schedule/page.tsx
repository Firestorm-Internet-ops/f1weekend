import type { Metadata } from 'next';
import ScheduleView from '@/components/schedule/ScheduleView';
import Breadcrumb from '@/components/Breadcrumb';
import { getRaceBySlug } from '@/services/race.service';
import { getScheduleByRace } from '@/services/schedule.service';

export const metadata: Metadata = {
  title: 'Schedule | F1 Weekend',
  description:
    'Full 2026 Australian Grand Prix weekend schedule — all sessions, support races, press conferences and F1 Experiences across Thursday to Sunday at Albert Park.',
  alternates: { canonical: 'https://f1weekend.co/schedule' },
  keywords: [
    '2026 Australian Grand Prix schedule',
    'F1 Melbourne 2026 timetable',
    'Albert Park schedule',
    'Australian GP sessions',
    'F1 practice qualifying race times Melbourne',
  ],
  openGraph: {
    title: '2026 Australian Grand Prix Schedule | F1 Weekend',
    description: 'Full F1 weekend schedule at Albert Park — all sessions Thursday to Sunday.',
    url: 'https://f1weekend.co/schedule',
    type: 'website',
    images: [{ url: '/og/schedule.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '2026 Australian Grand Prix Schedule | F1 Weekend',
    description: 'Full F1 weekend schedule at Albert Park — all sessions Thursday to Sunday.',
  },
};

const scheduleLd = {
  '@context': 'https://schema.org',
  '@type': 'SportsEvent',
  name: '2026 Formula 1 Australian Grand Prix',
  startDate: '2026-03-05T10:30:00+11:00',
  endDate: '2026-03-08T16:00:00+11:00',
  location: {
    '@type': 'Place',
    name: 'Albert Park Circuit',
    address: { '@type': 'PostalAddress', addressLocality: 'Melbourne', addressCountry: 'AU' },
  },
  subEvent: [
    { '@type': 'SportsEvent', name: 'Practice 1', startDate: '2026-03-06T11:30:00+11:00', endDate: '2026-03-06T12:30:00+11:00' },
    { '@type': 'SportsEvent', name: 'Practice 2', startDate: '2026-03-06T15:00:00+11:00', endDate: '2026-03-06T16:00:00+11:00' },
    { '@type': 'SportsEvent', name: 'Practice 3', startDate: '2026-03-07T12:30:00+11:00', endDate: '2026-03-07T13:30:00+11:00' },
    { '@type': 'SportsEvent', name: 'Qualifying', startDate: '2026-03-07T16:00:00+11:00', endDate: '2026-03-07T17:00:00+11:00' },
    { '@type': 'SportsEvent', name: 'Australian Grand Prix Race', startDate: '2026-03-08T15:00:00+11:00', endDate: '2026-03-08T17:00:00+11:00' },
  ],
};

export default async function SchedulePage() {
  const race = await getRaceBySlug('melbourne-2026');
  const schedule = race ? await getScheduleByRace(race.id) : [];

  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(scheduleLd) }} />
      <section className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Schedule' },
        ]} />
        <p className="text-xs uppercase-label text-[var(--accent-red)] mb-3 tracking-widest">
          Melbourne · Mar 5–8, 2026
        </p>
        <h1 className="font-display font-black text-4xl md:text-5xl text-white uppercase-heading mb-2">
          Weekend Schedule
        </h1>
        <p className="text-[var(--text-secondary)] text-sm mb-8">
          All times AEDT (UTC+11) · Subject to change
        </p>
        <ScheduleView schedule={schedule} />
      </section>
    </div>
  );
}
