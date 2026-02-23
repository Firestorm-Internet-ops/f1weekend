import type { Metadata } from 'next';
import CircuitMap from '@/components/race/CircuitMap';

export const metadata: Metadata = {
  title: 'Getting There | Pitlane',
  description:
    'How to get to Albert Park Circuit for the 2026 Australian Grand Prix — trams, rideshare, walking, and parking.',
};

const TRANSPORT = [
  {
    icon: '🚃',
    title: 'Tram',
    desc: 'Routes 1, 6, 16, 64, and 67 all stop near Albert Park. Take tram 96 to St Kilda Road / Albert Road or Route 1/16 to Fitzroy St.',
    badge: 'Recommended',
    badgeColor: 'var(--accent-teal)',
  },
  {
    icon: '🚶',
    title: 'Walk',
    desc: '15-minute walk from Flinders Street Station via St Kilda Road. Pleasant route through the CBD and along the lake.',
  },
  {
    icon: '🚗',
    title: 'Rideshare / Taxi',
    desc: 'Drop-off at Aughtie Drive gates. Expect surge pricing during session start/end. Book in advance or walk a few minutes from nearby drop zones.',
  },
  {
    icon: '🅿️',
    title: 'Drive',
    desc: 'Limited race-day parking. We strongly recommend public transport. If driving, book park-and-ride at Royal Botanic Gardens or nearby CBD lots.',
    badge: 'Limited',
    badgeColor: 'var(--accent-red)',
  },
];

const GATE_TIMES = [
  { day: 'Thursday', session: 'Practice 1', gates: '10:00 AEDT' },
  { day: 'Friday', session: 'Practice 2 & 3', gates: '08:30 AEDT' },
  { day: 'Saturday', session: 'Qualifying', gates: '08:30 AEDT' },
  { day: 'Sunday', session: 'Race Day', gates: '07:30 AEDT' },
];

export default function GettingTherePage() {
  return (
    <div className="min-h-screen pt-24 pb-24 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-medium uppercase-label text-[var(--accent-teal)] tracking-widest mb-3">
            VENUE GUIDE
          </p>
          <h1 className="font-display font-black text-4xl sm:text-5xl text-white uppercase-heading leading-none mb-4">
            GETTING<br />THERE
          </h1>
          <p className="text-[var(--text-secondary)] text-lg leading-relaxed">
            Albert Park Circuit, Melbourne VIC 3004. Race weekend: 5–8 March 2026.
          </p>
        </div>

        {/* Circuit map */}
        <div className="mb-12">
          <CircuitMap className="rounded-xl overflow-hidden border border-[var(--border-subtle)]" />
        </div>

        {/* Transport options */}
        <section className="mb-12">
          <h2 className="font-display font-bold text-xl text-white uppercase-heading mb-6">
            HOW TO GET THERE
          </h2>
          <div className="space-y-4">
            {TRANSPORT.map((t) => (
              <div
                key={t.title}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5"
              >
                <div className="flex items-start gap-4">
                  <span className="text-2xl mt-0.5 shrink-0">{t.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display font-bold text-white">{t.title}</h3>
                      {t.badge && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            color: t.badgeColor,
                            backgroundColor: `${t.badgeColor}20`,
                            border: `1px solid ${t.badgeColor}40`,
                          }}
                        >
                          {t.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{t.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Google Maps CTA */}
        <section className="mb-12">
          <a
            href="https://www.google.com/maps/dir/?api=1&destination=-37.8497,144.968&travelmode=transit"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full py-4 rounded-xl border border-[var(--accent-teal)] bg-[var(--accent-teal-muted)] text-[var(--accent-teal)] font-display font-bold text-lg hover:bg-[var(--accent-teal)]/20 transition-colors"
          >
            <span>📍</span>
            Get Directions in Google Maps
            <span className="text-sm font-normal opacity-70">↗</span>
          </a>
        </section>

        {/* Gate times */}
        <section>
          <h2 className="font-display font-bold text-xl text-white uppercase-heading mb-6">
            GATE OPENING TIMES
          </h2>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Gates open 2 hours before the first session each day.
          </p>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] overflow-hidden">
            {GATE_TIMES.map((g, i) => (
              <div
                key={g.day}
                className={`flex items-center justify-between px-5 py-4 ${
                  i < GATE_TIMES.length - 1 ? 'border-b border-[var(--border-subtle)]' : ''
                }`}
              >
                <div>
                  <p className="font-medium text-white">{g.day}</p>
                  <p className="text-xs text-[var(--text-muted)]">{g.session}</p>
                </div>
                <span className="mono-data text-sm text-[var(--accent-teal)] font-medium">
                  {g.gates}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
