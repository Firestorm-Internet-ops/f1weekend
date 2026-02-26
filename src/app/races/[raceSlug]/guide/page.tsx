import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import { getRaceBySlug } from '@/services/race.service';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ raceSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { raceSlug } = await params;
  if (raceSlug !== 'melbourne-2026') return {};
  return {
    title: 'Melbourne F1 Weekend 2026 Guide — Things to Do, Schedule & Tips | F1 Weekend',
    description:
      'Complete guide to the 2026 Melbourne Grand Prix weekend. Discover the best experiences, session gap activities, transport tips, and what to do in Melbourne during race week.',
    alternates: { canonical: 'https://f1weekend.co/races/melbourne-2026/guide' },
    keywords: [
      'things to do Melbourne F1 weekend',
      'Melbourne Grand Prix 2026 guide',
      'Melbourne F1 experiences',
      'Australian Grand Prix 2026',
      'Melbourne race weekend activities',
      'Albert Park Circuit guide',
      'Melbourne F1 session gaps',
    ],
    openGraph: {
      title: 'Melbourne F1 Weekend 2026 Guide — Things to Do, Schedule & Tips',
      description:
        'Complete guide to the 2026 Melbourne Grand Prix weekend. Session gap activities, transport, tips, and 30+ curated experiences.',
      url: 'https://f1weekend.co/races/melbourne-2026/guide',
      type: 'website',
    },
  };
}

const guideFaqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is the best day to skip a session and explore Melbourne?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Thursday March 5 is the easiest day to skip — there are no FIA-sanctioned competitive sessions, making it ideal for a full Great Ocean Road trip or Yarra Valley wine tour. If you must skip a race day session, Friday morning before FP1 (gates open ~09:30 AEDT) offers a 3.5-hour window — enough for a laneway food tour and coffee in Degraves Street.',
      },
    },
    {
      '@type': 'Question',
      name: 'Are there free things to do during Melbourne F1 weekend?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Federation Square hosts a free F1 Fan Village with live screens, team displays, and activations. The Royal Botanic Gardens Melbourne (free entry) is a 10-minute walk from Albert Park. St Kilda Beach, the Southbank Promenade, Hosier Lane street art, and the Central Business District laneway coffee culture are all free. NGV International on St Kilda Road is free for permanent collections.',
      },
    },
    {
      '@type': 'Question',
      name: "What's the dress code at Albert Park Circuit?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Albert Park has no formal dress code, but smart casual is the norm in grandstand and hospitality areas. Comfortable walking shoes are essential — the circuit is large and grass areas can be uneven. High heels are strongly discouraged. Sun hats and sunscreen are recommended for afternoon sessions in early March, and bring a light jacket for evening sessions when temperatures drop.',
      },
    },
    {
      '@type': 'Question',
      name: 'How early should I arrive at Albert Park?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Gates at Albert Park open 2 hours before the first scheduled session each day. On Friday, gates open at approximately 09:30 AEDT for an 11:30 FP1. Allow an extra 30–45 minutes for security queues on qualifying and race days. If arriving by tram, note that lines can be 20+ minutes long during peak entry and exit windows.',
      },
    },
    {
      '@type': 'Question',
      name: 'Which Melbourne experiences have free cancellation?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The majority of experiences listed on F1 Weekend offer free cancellation up to 24 hours before the start time. Always check the individual booking page for exact policy — GetYourGuide and Viator listings show cancellation terms clearly. The Great Ocean Road tour, Melbourne Laneways Food Tour, and Yarra Valley wine experiences all offer 24-hour free cancellation on most departure dates.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is the Great Ocean Road day trip possible during F1 weekend?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. The Great Ocean Road tour departs Melbourne Central Business District at approximately 7:30 AM and returns around 7:30 PM — a 12-hour round trip that fits perfectly on Thursday March 5 before any sessions. It is also possible on Sunday morning if you choose the shorter half-day Torquay and Bells Beach option (returns by 13:00), in time for the 15:00 race start.',
      },
    },
    {
      '@type': 'Question',
      name: 'What are the best areas to eat near Albert Park?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'South Yarra (15 minutes by tram) is the closest upscale dining precinct, with Chapel Street restaurants serving modern Australian cuisine. St Kilda (10 minutes by tram) has a lively café and bar scene along Fitzroy and Acland Streets. The Central Business District laneways (15–20 min tram) offer some of Australia\'s best coffee, Italian, and Southeast Asian dining within walking distance of each other.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I walk to Albert Park Circuit from the Central Business District?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Albert Park Circuit is approximately 3 km (1.9 miles) from Melbourne\'s Central Business District, making it a 15–20 minute walk along St Kilda Road — a pleasant, tree-lined boulevard. The walk passes through the Domain parklands and is particularly enjoyable in Melbourne\'s late-summer weather. Most hotels between the Central Business District and St Kilda Road are within a 20-minute walk of the circuit.',
      },
    },
    {
      '@type': 'Question',
      name: 'What F1 fan activations happen in Melbourne Central Business District during race week?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Melbourne Central Business District typically hosts an F1 Fan Festival in Federation Square (free entry) during race week, featuring driver appearances, team displays, sponsor activations, and a live stage. The Yarra precinct and Flinders Lane also host F1 merchandise pop-ups and bar activations. Check the official F1 Melbourne GP website for confirmed 2026 event dates and times.',
      },
    },
    {
      '@type': 'Question',
      name: "What's the best experience for a first-time F1 fan in Melbourne?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: "The Melbourne Laneways Food Tour is the standout pick for first-timers — it fits the Friday morning 3.5-hour gap before FP1, introduces you to Melbourne's legendary food culture, and leaves you back at the Central Business District tram stop with 30 minutes to spare. Pair it with the free St Kilda sunset walk on Friday evening, and you'll have experienced two of Melbourne's defining highlights without missing a single session.",
      },
    },
  ],
};

const guideSportsEventLd = {
  '@context': 'https://schema.org',
  '@type': 'SportsEvent',
  name: '2026 Formula 1 Australian Grand Prix',
  startDate: '2026-03-05',
  endDate: '2026-03-08',
  eventStatus: 'https://schema.org/EventScheduled',
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  location: {
    '@type': 'Place',
    name: 'Albert Park Circuit',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Albert Park',
      addressLocality: 'Melbourne',
      addressRegion: 'Victoria',
      postalCode: '3004',
      addressCountry: 'AU',
    },
    geo: { '@type': 'GeoCoordinates', latitude: -37.8497, longitude: 144.9756 },
  },
  url: 'https://f1weekend.co/races/melbourne-2026/guide',
};

const guideBreadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://f1weekend.co' },
    { '@type': 'ListItem', position: 2, name: 'Melbourne 2026', item: 'https://f1weekend.co/races/melbourne-2026' },
    { '@type': 'ListItem', position: 3, name: 'Melbourne Guide', item: 'https://f1weekend.co/races/melbourne-2026/guide' },
  ],
};

const GUIDE_FAQ = [
  {
    q: 'What is the best day to skip a session and explore Melbourne?',
    a: 'Thursday March 5 is the easiest — no competitive sessions, making it ideal for a full Great Ocean Road trip or Yarra Valley wine tour. If skipping a race day session, Friday morning before FP1 (gates open ~09:30 AEDT) gives you a 3.5-hour window — enough for a laneway food tour and coffee in Degraves Street.',
  },
  {
    q: 'Are there free things to do during Melbourne F1 weekend?',
    a: 'Yes. Federation Square hosts a free F1 Fan Village (live screens, team displays, activations). Royal Botanic Gardens is a 10-minute walk from Albert Park. St Kilda Beach, Southbank Promenade, Hosier Lane street art, and the Central Business District laneways are all free. NGV International on St Kilda Road is free for permanent collections.',
  },
  {
    q: "What's the dress code at Albert Park Circuit?",
    a: 'No formal dress code — smart casual is the norm in grandstands and hospitality areas. Comfortable walking shoes are essential (large circuit, uneven grass). High heels strongly discouraged. Sun hat and sunscreen for afternoon sessions in early March; light jacket for evenings when temperatures drop.',
  },
  {
    q: 'How early should I arrive at Albert Park?',
    a: 'Gates open 2 hours before the first session each day. On Friday, that\'s ~09:30 AEDT for 11:30 FP1. Allow 30–45 extra minutes for security queues on qualifying and race day. Tram lines can run 20+ minutes long at peak entry and exit windows.',
  },
  {
    q: 'Which Melbourne experiences have free cancellation?',
    a: 'Most experiences on F1 Weekend offer free cancellation up to 24 hours before. Check the individual booking page — GetYourGuide and Viator show cancellation terms clearly. The Great Ocean Road tour, Melbourne Laneways Food Tour, and Yarra Valley wine experiences all offer 24-hour free cancellation on most departure dates.',
  },
  {
    q: 'Is the Great Ocean Road day trip possible during F1 weekend?',
    a: 'Yes. Full-day tour departs ~07:30 AM and returns ~07:30 PM — fits perfectly on Thursday March 5. Also possible Sunday morning via the shorter half-day Torquay/Bells Beach option (returns by 13:00), leaving time for the 15:00 race start.',
  },
  {
    q: 'What are the best areas to eat near Albert Park?',
    a: 'South Yarra (15 min tram) is the closest upscale precinct — Chapel Street has modern Australian cuisine. St Kilda (10 min tram) has lively cafés and bars on Fitzroy and Acland Streets. Central Business District laneways (15–20 min tram) offer some of Australia\'s best coffee, Italian, and Southeast Asian dining in close proximity.',
  },
  {
    q: 'Can I walk to Albert Park Circuit from the Central Business District?',
    a: 'Yes — Albert Park is ~3 km (1.9 miles) from Melbourne Central Business District, a pleasant 15–20 minute walk along tree-lined St Kilda Road through the Domain parklands. Most Central Business District and St Kilda Road hotels are within a 20-minute walk of the circuit.',
  },
  {
    q: 'What F1 fan activations happen in Melbourne Central Business District during race week?',
    a: 'Melbourne typically hosts a free F1 Fan Festival at Federation Square (driver appearances, team displays, live commentary stage). The Yarra precinct and Flinders Lane host merchandise pop-ups and bar activations. Check the official F1 Melbourne GP website for 2026 confirmed dates.',
  },
  {
    q: "What's the best experience for a first-time F1 fan in Melbourne?",
    a: "The Melbourne Laneways Food Tour is the standout pick — it fits the Friday morning 3.5-hour gap before FP1, introduces you to Melbourne's legendary food culture, and puts you back at the Central Business District tram stop with 30 minutes to spare. Pair with the free St Kilda sunset walk on Friday evening for two defining Melbourne highlights without missing a session.",
  },
];

export default async function GuidePage({ params }: Props) {
  const { raceSlug } = await params;
  if (raceSlug !== 'melbourne-2026') notFound();

  const race = await getRaceBySlug(raceSlug);
  if (!race) notFound();

  return (
    <div className="min-h-screen pt-24 pb-24 px-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(guideFaqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(guideSportsEventLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(guideBreadcrumbLd) }} />

      <div className="max-w-3xl mx-auto">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Melbourne 2026', href: '/races/melbourne-2026' },
          { label: 'Guide' },
        ]} />

        {/* Hero */}
        <p className="text-xs font-medium uppercase-label text-[var(--accent-red)] mb-2 tracking-widest">
          Round 1 · 2026 Season
        </p>
        <h1 className="font-display font-black text-4xl sm:text-5xl text-white uppercase-heading leading-none mb-3">
          Melbourne F1 2026<br />
          <span className="text-[var(--accent-teal)]">Weekend Guide</span>
        </h1>
        <p className="text-[var(--text-secondary)] text-lg mb-8">
          Everything you need to experience the 2026 Australian Grand Prix and Melbourne in the same weekend.
        </p>

        {/* Quick facts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
          {[
            { label: 'Round', value: '1 of 24' },
            { label: 'Dates', value: 'Mar 5–8, 2026' },
            { label: 'Circuit', value: 'Albert Park' },
            { label: 'Timezone', value: 'AEDT (UTC+11)' },
          ].map(({ label, value }) => (
            <div key={label} className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
              <p className="text-xs font-medium uppercase-label text-[var(--text-secondary)] mb-1">{label}</p>
              <p className="font-display font-bold text-white text-sm">{value}</p>
            </div>
          ))}
        </div>

        {/* Introduction */}
        <section className="mb-12">
          <h2 className="font-display font-bold text-2xl text-white uppercase-heading mb-4">
            Why Melbourne Is the Perfect F1 City
          </h2>
          <p className="text-[var(--text-secondary)] text-base leading-relaxed mb-4">
            Albert Park Circuit sits just 3 km south of Melbourne&apos;s Central Business District — making it the most
            city-integrated circuit on the F1 calendar. While Silverstone is surrounded by
            Northamptonshire countryside and Monza is an hour from Milan, Melbourne puts you steps
            from world-class laneways, beaches, restaurants, and culture. You can watch
            qualifying on Saturday afternoon and be eating ramen in the Central Business District by 8 PM.
          </p>
          <p className="text-[var(--text-secondary)] text-base leading-relaxed">
            The session gap opportunity is real: the 2026 race weekend runs four days, with
            competitive sessions separated by windows of 90 minutes to 4+ hours. Thursday has no
            competitive sessions at all — it&apos;s a full free day if you have a multi-day ticket.
            Friday and Saturday offer large morning and evening gaps. Sunday gives you a 7+ hour
            window before the 15:00 AEDT race start. Total explorable time across the four days:
            over 20 hours. Melbourne has earned all of it.
          </p>
        </section>

        {/* Race Weekend Format */}
        <section className="mb-12 border-t border-[var(--border-subtle)] pt-10">
          <h2 className="font-display font-bold text-2xl text-white uppercase-heading mb-4">
            Race Weekend Format
          </h2>
          <p className="text-[var(--text-secondary)] text-base leading-relaxed mb-6">
            The 2026 Australian Grand Prix follows the Sprint weekend format, compressing
            qualifying, a Sprint shootout, and a Sprint race into Saturday alongside the main
            qualifying session. Here is how the four days break down, and where the gaps fall.
          </p>
          <div className="space-y-4">
            {[
              {
                day: 'Thursday, March 5',
                badge: 'FREE DAY',
                badgeColor: 'var(--accent-teal)',
                desc: 'Fan activations at the circuit and Central Business District. No competitive sessions. Best day for a full Great Ocean Road trip or Yarra Valley wine tour. Gates open but no timing pressure.',
                gap: 'All day — 10+ hours available',
              },
              {
                day: 'Friday, March 6',
                badge: 'FP1 + FP2',
                badgeColor: 'var(--accent-red)',
                desc: 'FP1 at 11:30 AEDT (gates open ~09:30). FP2 in the afternoon. Morning gap of 3.5 hours before gates open — ideal for a laneway food tour. Evening gap of 4+ hours after FP2 for dinner.',
                gap: 'Morning: 3.5 hrs · Evening: 4+ hrs',
              },
              {
                day: 'Saturday, March 7',
                badge: 'SPRINT + QUALI',
                badgeColor: 'var(--accent-red)',
                desc: 'Sprint Shootout in the morning, F1 Sprint in the afternoon, main Qualifying in the evening. Gaps are shorter — ideal for quick St Kilda foreshore walks or nearby café visits.',
                gap: 'Morning: 2.5 hrs · Between sessions: 1.5 hrs',
              },
              {
                day: 'Sunday, March 8',
                badge: 'RACE DAY',
                badgeColor: 'var(--accent-red)',
                desc: 'Race start at 15:00 AEDT. Morning free until ~11:00 when gates open — 3+ hours for the South Melbourne Market, St Kilda beach, or a relaxed Central Business District brunch before the main event.',
                gap: 'Morning: 3+ hrs before gates open',
              },
            ].map(({ day, badge, badgeColor, desc, gap }) => (
              <div key={day} className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-display font-bold text-white">{day}</p>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ color: badgeColor, backgroundColor: `${badgeColor}20`, border: `1px solid ${badgeColor}40` }}
                  >
                    {badge}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-2">{desc}</p>
                <p className="text-xs font-medium text-[var(--accent-teal)] mono-data">{gap}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Session Gap Planner */}
        <section className="mb-12 border-t border-[var(--border-subtle)] pt-10">
          <h2 className="font-display font-bold text-2xl text-white uppercase-heading mb-4">
            Session Gap Planner
          </h2>
          <p className="text-[var(--text-secondary)] text-base leading-relaxed mb-6">
            Each session gap has been mapped to experiences that actually fit the available time.
            Here is what to do in each window, with links to the relevant experiences.
          </p>
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
              <p className="text-xs font-medium uppercase-label text-[var(--accent-teal)] mb-2">BEFORE FP1 · 3.5 HRS</p>
              <h3 className="font-display font-bold text-white text-lg mb-2">Thursday & Friday Morning</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                The 3.5-hour window before gates open on Friday is the most versatile gap of the
                weekend. A guided Melbourne Laneways Food Tour (10 tastings, 3 hours, A$99–A$130)
                fits perfectly — you&apos;re back at the tram stop with 30 minutes to spare. On
                Thursday, this gap extends all day, making it the right time for the Great Ocean
                Road or Yarra Valley. Self-guided options: Degraves Street espresso walk (free),
                Fitzroy street art tour (free), Royal Botanic Gardens (free, 1.5 hrs).
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/races/melbourne-2026/experiences?category=food" className="text-xs font-medium text-[var(--accent-teal)] hover:text-white transition-colors">
                  Food experiences →
                </Link>
                <Link href="/races/melbourne-2026/experiences?category=daytrip" className="text-xs font-medium text-[var(--accent-teal)] hover:text-white transition-colors">
                  Day trips →
                </Link>
              </div>
            </div>

            <div className="p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
              <p className="text-xs font-medium uppercase-label text-[var(--accent-red)] mb-2">BETWEEN SESSIONS · 1.5 HRS</p>
              <h3 className="font-display font-bold text-white text-lg mb-2">Afternoon Session Gaps</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                Shorter 1–2 hour gaps between sessions suit walking and eating rather than guided
                tours. The Royal Botanic Gardens (free entry, 10-minute walk from the circuit)
                is the best use of a tight gap. St Kilda Pier walk (free, 20 minutes by tram) is
                good on Friday afternoons. For food: South Yarra&apos;s Commercial Road has
                excellent cafés within a 15-minute tram from the circuit.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/races/melbourne-2026/experiences?category=culture" className="text-xs font-medium text-[var(--accent-teal)] hover:text-white transition-colors">
                  Culture & walks →
                </Link>
              </div>
            </div>

            <div className="p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
              <p className="text-xs font-medium uppercase-label mb-2" style={{ color: '#9B59B6' }}>EVENING · 4+ HRS</p>
              <h3 className="font-display font-bold text-white text-lg mb-2">Post-Session Evenings (Thu–Sat)</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                Friday and Saturday evenings after sessions end at ~17:00–19:00 AEDT give you
                4–6 hours. Melbourne&apos;s dining scene is at its best after 7 PM. Top areas:
                South Yarra and Toorak Road for modern Australian (15 min tram), Lygon Street
                Carlton for Italian (30 min tram), Flinders Lane Central Business District laneways for everything from
                Japanese to Lebanese. Book ahead — Melbourne restaurants fill up during race week.
                For nightlife: the Yarra River precinct has rooftop bars open until 3 AM.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/races/melbourne-2026/experiences?category=nightlife" className="text-xs font-medium text-[var(--accent-teal)] hover:text-white transition-colors">
                  Nightlife & dining →
                </Link>
              </div>
            </div>

            <div className="p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
              <p className="text-xs font-medium uppercase-label mb-2" style={{ color: '#F39C12' }}>SUNDAY MORNING · 3+ HRS</p>
              <h3 className="font-display font-bold text-white text-lg mb-2">Race Day Morning (before 11:00 AEDT)</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                Gates open around 11:00 AEDT on race day — leaving 3+ hours for a relaxed
                morning. South Melbourne Market (open from 08:00, 10 min tram) is ideal: fresh
                produce, Melbourne&apos;s best coffee, and dim sum all under one roof. St Kilda
                Beach is a 15-minute walk from the market — do both. Alternatively, a short
                half-day Torquay coast drive (returns by 13:00) squeezes in the Great Ocean Road
                start if you missed Thursday.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/races/melbourne-2026/experiences" className="text-xs font-medium text-[var(--accent-teal)] hover:text-white transition-colors">
                  All Sunday morning options →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Experiences by Category */}
        <section className="mb-12 border-t border-[var(--border-subtle)] pt-10">
          <h2 className="font-display font-bold text-2xl text-white uppercase-heading mb-4">
            Experiences by Category
          </h2>
          <p className="text-[var(--text-secondary)] text-base leading-relaxed mb-6">
            Over 30 Melbourne experiences across five categories — each with pricing, duration,
            and the session gap they fit. Here are the highlights.
          </p>
          <div className="space-y-8">
            <div>
              <h3 className="font-display font-bold text-lg text-white mb-3" style={{ color: '#E67E22' }}>
                Food &amp; Dining
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
                Melbourne is arguably Australia&apos;s best food city. The Central Business District laneways pack
                more great coffee and street food per square kilometre than almost anywhere in
                the world. Highlights include the Melbourne Laneways Food Tour (A$99–A$130,
                3 hrs, fits Friday morning before FP1), the South Melbourne Market (free entry,
                morning sessions), and dinner in South Yarra&apos;s Chapel Street precinct
                (A$50–A$100pp, evenings after qualifying).
              </p>
              <Link href="/races/melbourne-2026/experiences?category=food" className="text-sm font-medium text-[var(--accent-teal)] hover:text-white transition-colors">
                Browse food experiences →
              </Link>
            </div>

            <div>
              <h3 className="font-display font-bold text-lg text-white mb-3" style={{ color: '#2ECC71' }}>
                Adventure &amp; Day Trips
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
                The Great Ocean Road is the standout day trip — 12 Apostles, rainforest gorges,
                and coastal cliffs within a full-day tour from Melbourne Central Business District (A$115, 10 hrs,
                Thursday March 5). The Yarra Valley wine region offers a shorter alternative
                (A$95–A$140, 8 hrs) with cellar doors and gourmet platters. For shorter adventures:
                the Dandenong Ranges (1 hour from Melbourne) offer rainforest walks and the
                famous Puffing Billy steam railway.
              </p>
              <Link href="/races/melbourne-2026/experiences?category=daytrip" className="text-sm font-medium text-[var(--accent-teal)] hover:text-white transition-colors">
                Browse day trips →
              </Link>
            </div>

            <div>
              <h3 className="font-display font-bold text-lg text-white mb-3" style={{ color: '#3498DB' }}>
                Culture &amp; Arts
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
                NGV International (free permanent collection) on St Kilda Road is a 5-minute
                walk from the circuit — ideal for a 1.5-hour gap between sessions. Hosier Lane,
                Melbourne&apos;s most famous street art laneway in the Central Business District, is free and
                perpetually changing. The State Library of Victoria (free) near Flinders Street
                Station is worth the 15-minute tram ride. For live music: the Corner Hotel in
                Richmond and the Forum Melbourne both host race week shows.
              </p>
              <Link href="/races/melbourne-2026/experiences?category=culture" className="text-sm font-medium text-[var(--accent-teal)] hover:text-white transition-colors">
                Browse culture experiences →
              </Link>
            </div>

            <div>
              <h3 className="font-display font-bold text-lg text-white mb-3" style={{ color: '#9B59B6' }}>
                Nightlife
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
                Melbourne&apos;s nightlife is centred around the Central Business District laneways and the Yarra
                precinct, both a 15-minute tram from Albert Park. Top rooftop bars include
                Naked in the Sky on St Kilda (sunset views over Port Phillip Bay, A$40+
                minimum spend) and Rooftop Bar on Swanston Street in the Central Business District (casual, free
                entry on weekdays). The Melbourne race week party scene peaks on Friday and
                Saturday nights — book ahead, as capacity is limited during the Grand Prix.
              </p>
              <Link href="/races/melbourne-2026/experiences?category=nightlife" className="text-sm font-medium text-[var(--accent-teal)] hover:text-white transition-colors">
                Browse nightlife experiences →
              </Link>
            </div>
          </div>
        </section>

        {/* Getting to Albert Park */}
        <section className="mb-12 border-t border-[var(--border-subtle)] pt-10">
          <h2 className="font-display font-bold text-2xl text-white uppercase-heading mb-4">
            Getting to Albert Park Circuit
          </h2>
          <p className="text-[var(--text-secondary)] text-base leading-relaxed mb-4">
            Albert Park Circuit is 3 km south of Melbourne&apos;s Central Business District — the closest major circuit
            to a world-class city centre on the F1 calendar. Public transport is strongly
            recommended; race-day parking within 1 km of the circuit is extremely limited.
          </p>
          <div className="space-y-3 mb-6">
            {[
              { icon: '🚃', title: 'Tram (recommended)', desc: 'Routes 1, 6, 16, 64, and 67 run along St Kilda Road. Alight at Albert Road or Fitzroy Street. Free during event hours with valid circuit ticket.' },
              { icon: '🚶', title: 'Walk from Central Business District', desc: '15–20 minutes via St Kilda Road — tree-lined, flat, and very walkable. Passes through the Domain parklands.' },
              { icon: '🚗', title: 'Rideshare / Taxi', desc: 'Drop-off at Aughtie Drive gates. Expect 2x surge pricing at session start and end. Book in advance for pick-up, or walk 5–10 minutes to a quieter street.' },
              { icon: '🅿️', title: 'Drive', desc: 'Not recommended. Limited race-day parking — book park-and-ride at Royal Botanic Gardens or nearby Central Business District lots in advance.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4 p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
                <span className="text-xl mt-0.5 shrink-0">{icon}</span>
                <div>
                  <p className="font-medium text-white mb-1">{title}</p>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/races/melbourne-2026/getting-there"
            className="text-sm font-medium text-[var(--accent-teal)] hover:text-white transition-colors"
          >
            Full transport guide →
          </Link>
        </section>

        {/* Melbourne Tips */}
        <section className="mb-12 border-t border-[var(--border-subtle)] pt-10">
          <h2 className="font-display font-bold text-2xl text-white uppercase-heading mb-4">
            Melbourne Travel Tips
          </h2>
          <div className="space-y-4">
            <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
              <p className="font-medium text-white mb-2">Weather in March</p>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Late summer / early autumn. Average highs of 22–26°C (72–79°F), with occasional
                showers — Melbourne&apos;s weather is famously changeable. Pack: sunscreen, a
                light packable jacket, and comfortable walking shoes. Temperatures drop to
                15–18°C in the evening.
              </p>
            </div>
            <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
              <p className="font-medium text-white mb-2">Budget Breakdown</p>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Daily budget (excluding circuit tickets): A$100–A$150 for food and transport
                (Melbourne coffee, casual lunch, tram pass, and one dinner). Add A$99–A$130
                for a guided food tour or activity. A$200–A$350/day covers a guided day trip
                plus dining. Hotels near the circuit (St Kilda, South Yarra) typically run
                A$300–A$600/night during race week — book at least 3 months in advance.
              </p>
            </div>
            <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
              <p className="font-medium text-white mb-2">Best Areas to Stay</p>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                St Kilda (1–2 km from circuit) is the most convenient — beach access, great
                restaurants, and a short tram ride to Albert Park. South Yarra (2–3 km) offers
                more hotel options and is the city&apos;s upscale dining hub. Central Business District hotels (3 km)
                put you near the fan village and give flexibility for non-circuit days. Avoid
                anything east of the Central Business District for easy circuit access.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-[var(--border-subtle)] pt-10">
          <h2 className="font-display font-bold text-2xl text-white uppercase-heading mb-6">
            Frequently Asked Questions
          </h2>
          {GUIDE_FAQ.map(({ q, a }) => (
            <details key={q} className="border-b border-[var(--border-subtle)] py-4">
              <summary className="font-display font-bold text-white cursor-pointer list-none flex items-center justify-between gap-2">
                {q}
                <span className="text-[var(--text-secondary)] text-sm shrink-0">+</span>
              </summary>
              <p className="text-[var(--text-secondary)] text-sm mt-3 leading-relaxed">{a}</p>
            </details>
          ))}
        </section>

        {/* CTA */}
        <div className="mt-12 pt-8 border-t border-[var(--border-subtle)] flex flex-wrap gap-4">
          <Link
            href="/races/melbourne-2026/experiences"
            className="px-5 py-2.5 bg-[var(--accent-teal)] hover:bg-[var(--accent-teal-hover)] text-[var(--bg-primary)] font-semibold text-sm rounded-full transition-colors"
          >
            Browse All Experiences
          </Link>
          <Link
            href="/races/melbourne-2026/schedule"
            className="px-5 py-2.5 border border-white/20 hover:border-white/40 text-white hover:bg-white/5 font-semibold text-sm rounded-full transition-colors"
          >
            View Full Schedule
          </Link>
        </div>
      </div>
    </div>
  );
}
