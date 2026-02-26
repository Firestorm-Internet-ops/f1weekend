import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CircuitMap from '@/components/race/CircuitMap';
import Breadcrumb from '@/components/Breadcrumb';
import { getRaceBySlug, getSessionsByRace } from '@/services/race.service';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ raceSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { raceSlug } = await params;
  const race = await getRaceBySlug(raceSlug);
  if (!race) return {};

  const title = `Getting to ${race.circuitName} — ${race.name} | F1 Weekend`;
  const description = `Transport options, parking tips, and gate times for the ${race.name} at ${race.circuitName}, ${race.city}.`;
  const canonical = `https://f1weekend.co/races/${raceSlug}/getting-there`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'website' },
  };
}

const MELBOURNE_TRANSPORT = [
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
    desc: '15-minute walk from Flinders Street Station via St Kilda Road. Pleasant route through the Central Business District and along the lake.',
  },
  {
    icon: '🚗',
    title: 'Rideshare / Taxi',
    desc: 'Drop-off at Aughtie Drive gates. Expect surge pricing during session start/end. Book in advance or walk a few minutes from nearby drop zones.',
  },
  {
    icon: '🅿️',
    title: 'Drive',
    desc: 'Limited race-day parking. We strongly recommend public transport. If driving, book park-and-ride at Royal Botanic Gardens or nearby Central Business District lots.',
    badge: 'Limited',
    badgeColor: 'var(--accent-red)',
  },
];

const MELBOURNE_MAPS_URL = 'https://www.google.com/maps/dir/?api=1&destination=-37.8497,144.968&travelmode=transit';
const SHANGHAI_MAPS_URL = 'https://www.google.com/maps/dir/?api=1&destination=31.3385,121.2200&travelmode=transit';

const SHANGHAI_TRANSPORT = [
  {
    icon: '🚇',
    title: 'Metro Line 11',
    desc: 'Take Metro Line 11 from Jiading North or Jiading Town stations. Shuttle buses run from Anting Station to the circuit on race days. Fastest option from the city centre.',
    badge: 'Recommended',
    badgeColor: 'var(--accent-teal)',
  },
  {
    icon: '🚕',
    title: 'DiDi / Taxi',
    desc: "DiDi (China's Uber) is widely available. Drop-off near the circuit entrances. Expect surge pricing during session start and end times. Allow extra time on race day.",
  },
  {
    icon: '🚌',
    title: 'Official Shuttle Bus',
    desc: 'F1 official shuttle buses operate from People\'s Square and other city-centre hubs on event days. Check the official Chinese GP site for pickup locations and timetables.',
  },
  {
    icon: '🅿️',
    title: 'Drive',
    desc: 'Parking is available at the circuit but limited on race day. Expressway G2 and G15 serve the area. Strong traffic delays expected — public transport strongly recommended.',
    badge: 'Limited',
    badgeColor: 'var(--accent-red)',
  },
];

function formatGateTime(time: string, h: number, tzLabel: string): string {
  const [hh, mm] = time.split(':').map(Number);
  const totalMins = hh * 60 + mm - h * 60;
  return `${String(Math.floor(totalMins / 60)).padStart(2, '0')}:${String(totalMins % 60).padStart(2, '0')} ${tzLabel}`;
}

export default async function GettingTherePage({ params }: Props) {
  const { raceSlug } = await params;
  const race = await getRaceBySlug(raceSlug);
  if (!race) notFound();

  const isMelbourne = raceSlug === 'melbourne-2026';
  const isShanghai = raceSlug === 'shanghai-2026';
  const transport = isMelbourne ? MELBOURNE_TRANSPORT : isShanghai ? SHANGHAI_TRANSPORT : [];
  const mapsUrl = isShanghai ? SHANGHAI_MAPS_URL : isMelbourne ? MELBOURNE_MAPS_URL : null;
  const tzLabel = isShanghai ? 'CST' : 'AEDT';

  const howToSchema = isMelbourne ? {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to get to Albert Park Circuit for Australian GP 2026',
    description: 'Transport options for getting to Albert Park Circuit, Melbourne for the 2026 Formula 1 Australian Grand Prix.',
    step: [
      { '@type': 'HowToStep', name: 'Take the tram', text: 'Board tram routes 1, 6, 16, 64, or 67 toward St Kilda Road.' },
      { '@type': 'HowToStep', name: 'Walk from the Central Business District', text: 'A 15-minute walk from Flinders Street Station along St Kilda Road.' },
      { '@type': 'HowToStep', name: 'Rideshare or taxi', text: 'Drop-off at the Aughtie Drive gates. Expect surge pricing at session start and end times.' },
      { '@type': 'HowToStep', name: 'Drive and park', text: 'Limited race-day parking is available. Public transport is strongly recommended.' },
    ],
  } : isShanghai ? {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to get to Shanghai International Circuit for Chinese GP 2026',
    step: [
      { '@type': 'HowToStep', name: 'Take Metro Line 11', text: 'Board Metro Line 11 toward Jiading North or Anting.' },
      { '@type': 'HowToStep', name: 'Shuttle bus from Anting', text: 'Shuttle buses run from Anting Station to the circuit on event days.' },
      { '@type': 'HowToStep', name: 'DiDi or taxi', text: 'DiDi drop-off near circuit entrances. Expect surge pricing at session times.' },
      { '@type': 'HowToStep', name: 'Drive', text: 'Limited race-day parking. Metro is strongly recommended.' },
    ],
  } : null;

  const allSessions = await getSessionsByRace(race.id);
  const gateTimes = ['Thursday', 'Friday', 'Saturday', 'Sunday']
    .map(day => {
      const daySessions = allSessions.filter(s => s.dayOfWeek === day);
      const first = daySessions.sort((a, b) => a.startTime.localeCompare(b.startTime))[0];
      return first ? { day, session: first.name, gates: formatGateTime(first.startTime, 2, tzLabel) } : null;
    })
    .filter((g): g is { day: string; session: string; gates: string } => g !== null);

  return (
    <>
      {howToSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />}
      <div className="min-h-screen pt-24 pb-24 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10">
            <Breadcrumb items={[
              { label: 'Home', href: '/' },
              { label: race.city, href: `/races/${raceSlug}` },
              { label: 'Getting There' },
            ]} />
            <p className="text-xs font-medium uppercase-label text-[var(--accent-teal)] tracking-widest mb-3">
              VENUE GUIDE
            </p>
            <h1 className="font-display font-black text-4xl sm:text-5xl text-white uppercase-heading leading-none mb-4">
              GETTING<br />THERE
            </h1>
            <p className="text-[var(--text-secondary)] text-lg leading-relaxed">
              {race.circuitName}, {race.city}
            </p>
            {isMelbourne && (
              <p className="text-[var(--text-secondary)] text-base leading-relaxed max-w-2xl mt-4">
                Albert Park Circuit sits just 3 km south of Melbourne&apos;s Central Business District — one of the most
                accessible circuits on the F1 calendar. Take tram routes 1, 6, 16, 64, or 67 along
                St Kilda Road and alight at Albert Road or Fitzroy Street. The walk from Flinders
                Street Station takes 15 minutes via St Kilda Road. Rideshare drop-off is available
                at the Aughtie Drive gates.
              </p>
            )}
            {isShanghai && (
              <p className="text-[var(--text-secondary)] text-base leading-relaxed max-w-2xl mt-4">
                Shanghai International Circuit is located 30 km west of the city centre in Jiading district.
                The fastest route is Metro Line 11 to Anting Station, then the F1 shuttle bus. Allow
                45–60 minutes from Puxi or Pudong. DiDi is widely available for direct circuit drop-off.
              </p>
            )}
          </div>
        </div>

        {isMelbourne && (
          <div className="mb-12 max-w-5xl mx-auto">
            <CircuitMap className="rounded-xl overflow-hidden border border-[var(--border-subtle)]" />
          </div>
        )}
        {isShanghai && (
          <div className="mb-12 max-w-5xl mx-auto">
            <CircuitMap
              src="/Shanghai_Circuit.avif"
              alt="Shanghai International Circuit — Track Map"
              width={1252}
              height={704}
              className="rounded-xl overflow-hidden border border-[var(--border-subtle)]"
            />
          </div>
        )}

        <div className="max-w-3xl mx-auto">
          {transport.length > 0 && (
            <section className="mb-12">
              <h2 className="font-display font-bold text-xl text-white uppercase-heading mb-6">
                HOW TO GET THERE
              </h2>
              <div className="space-y-4">
                {transport.map((t) => (
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
          )}

          {mapsUrl && (
            <section className="mb-12">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full py-4 rounded-xl border border-[var(--accent-teal)] bg-[var(--accent-teal-muted)] text-[var(--accent-teal)] font-display font-bold text-lg hover:bg-[var(--accent-teal)]/20 transition-colors"
              >
                <span>📍</span>
                Get Directions in Google Maps
                <span className="text-sm font-normal opacity-70">↗</span>
              </a>
            </section>
          )}

          <section>
            <h2 className="font-display font-bold text-xl text-white uppercase-heading mb-6">
              GATE OPENING TIMES
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Gates open 2 hours before the first session each day.
            </p>
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] overflow-hidden">
              {gateTimes.map((g, i) => (
                <div
                  key={g.day}
                  className={`flex items-center justify-between px-5 py-4 ${
                    i < gateTimes.length - 1 ? 'border-b border-[var(--border-subtle)]' : ''
                  }`}
                >
                  <div>
                    <p className="font-medium text-white">{g.day}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{g.session}</p>
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
    </>
  );
}
