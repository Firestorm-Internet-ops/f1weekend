import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About | Pitlane',
  description:
    'Pitlane is an F1 travel companion for the 2026 Australian Grand Prix, built by Firestorm Internet.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-24 pb-24 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Section 1 — Hero / Intro */}
        <div className="mb-16">
          <p className="text-xs font-medium uppercase-label text-[var(--accent-teal)] tracking-widest mb-3">
            ABOUT US
          </p>
          <h1 className="font-display font-black text-4xl sm:text-5xl text-white uppercase-heading leading-none mb-6">
            About Pitlane
          </h1>
          <div className="space-y-4 text-[var(--text-secondary)] text-lg leading-relaxed">
            <p>
              Pitlane is built for F1 fans travelling to Melbourne for the 2026 Australian Grand
              Prix. We handle the logistics — race schedule, gap time, and what to do in each
              window — so you can focus on the weekend itself.
            </p>
            <p>
              Every session is mapped alongside curated Melbourne experiences: restaurants near
              Albert Park, tours timed to Practice 1 gaps, rooftop bars open after qualifying. The
              schedule and the city, shown together.
            </p>
            <p>
              Whether you&apos;re staying in the CBD or making day trips, Pitlane gives you a clear
              picture of the weekend so you spend less time planning and more time at the track —
              or exploring the city that surrounds it.
            </p>
          </div>
        </div>

        {/* Section 2 — Feature Cards */}
        <div className="mb-16">
          <h2 className="font-display font-bold text-xl sm:text-2xl text-white uppercase-heading mb-2">
            What Pitlane Does
          </h2>
          <p className="text-[var(--text-muted)] mb-8">
            Hand-picked experiences and the full race schedule, in one place.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              {
                icon: '🕐',
                title: 'Session Schedule',
                desc: 'Full timing for Practice, Qualifying, Sprint, and Race — plus gate openings and what to expect each day.',
              },
              {
                icon: '🌏',
                title: 'Melbourne Experiences',
                desc: 'Curated spots across the CBD, St Kilda, Fitzroy, and Albert Park — each tagged to the session gaps they fit.',
              },
              {
                icon: '📋',
                title: 'Gap Planner',
                desc: 'See what fits between each session — filtered by duration, distance, and what you haven\'t done yet.',
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5"
              >
                <div className="text-2xl mb-3">{card.icon}</div>
                <h3 className="font-display font-bold text-white mb-1">{card.title}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3 — Stats */}
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { number: '2026', label: 'Australian GP', sub: 'Melbourne, Mar 5–8' },
              { number: '4', label: 'Race Days', sub: 'Thursday through Sunday' },
              { number: '35', label: 'Experiences', sub: 'Hand-picked for race fans' },
              { number: '4', label: 'Session Categories', sub: 'Practice, Quali, Sprint, Race' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5 text-center"
              >
                <div className="font-display font-black text-3xl text-[var(--accent-teal)] leading-none mb-2">
                  {stat.number}
                </div>
                <div className="font-display font-bold text-white text-sm mb-1">{stat.label}</div>
                <div className="text-xs text-[var(--text-muted)]">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
