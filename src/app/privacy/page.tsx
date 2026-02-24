import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | F1 Weekend',
  description: 'Privacy policy for the F1 Weekend app by Firestorm Internet.',
  alternates: { canonical: 'https://f1weekend.co/privacy' },
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Privacy Policy | F1 Weekend',
    description: 'Privacy policy for the F1 Weekend app by Firestorm Internet.',
    url: 'https://f1weekend.co/privacy',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'F1 Weekend — Race Weekend Companion' }],
  },
};

const SECTIONS = [
  {
    title: 'What We Collect',
    content: [
      'A session ID stored in your browser\'s localStorage to remember your itinerary across visits.',
      'Anonymous affiliate click events (no personal information is attached — we record only that a link category was clicked).',
    ],
  },
  {
    title: 'How We Use It',
    content: [
      'Aggregate analytics to understand which experiences and sessions are most popular.',
      'Improving our experience recommendations and gap planning suggestions.',
      'We do not sell, rent, or share your data with third parties for marketing purposes.',
    ],
  },
  {
    title: 'Third-Party Services',
    content: [
      'GetYourGuide — affiliate partner for bookable experiences. Clicking affiliate links may set cookies on GetYourGuide\'s domain. See getYourGuide.com for their privacy policy.',
      'Qdrant — vector search service used to find relevant experiences. No personal data is stored in Qdrant.',
      'Vercel — hosting platform. Access logs may include IP addresses per Vercel\'s standard infrastructure logging. See vercel.com/legal/privacy-policy.',
    ],
  },
  {
    title: 'Cookies & Storage',
    content: [
      'Pitlane uses localStorage (not cookies) to store your session ID on your device.',
      'No tracking cookies are set by Pitlane itself.',
      'Third-party services linked from Pitlane may set their own cookies on their domains.',
    ],
  },
  {
    title: 'Your Rights',
    content: [
      'You can clear your session data at any time by clearing your browser\'s site data for f1weekend.co.',
      'To request deletion of any data we may hold, contact us via the details on our Contact page.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pt-24 pb-24 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Hero */}
        <div className="mb-10">
          <p className="text-xs font-medium uppercase-label text-[var(--accent-teal)] tracking-widest mb-3">
            LEGAL
          </p>
          <h1 className="font-display font-black text-4xl sm:text-5xl text-white uppercase-heading leading-none mb-4">
            Privacy Policy
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mb-6">Last updated: February 2026</p>
          <p className="text-[var(--text-secondary)] text-lg leading-relaxed">
            Pitlane is operated by Firestorm Internet. We take your privacy seriously and keep data
            collection to the minimum needed to provide a useful service.
          </p>
        </div>

        {/* Sections — staggered card entrance */}
        <div className="space-y-4">
          {SECTIONS.map((section, i) => (
            <section
              key={section.title}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5 sm:p-6 animate-[card-enter_250ms_cubic-bezier(0.16,1,0.3,1)_both]"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <h2 className="font-display font-bold text-xl text-white uppercase-heading mb-4">
                {i + 1}. {section.title.toUpperCase()}
              </h2>
              <ul className="space-y-3">
                {section.content.map((item, j) => (
                  <li key={j} className="flex gap-3 text-[var(--text-secondary)] leading-relaxed">
                    <span className="text-[var(--accent-teal)] mt-1 shrink-0">—</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {/* Contact section */}
          <section
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5 sm:p-6 animate-[card-enter_250ms_cubic-bezier(0.16,1,0.3,1)_both]"
            style={{ animationDelay: `${SECTIONS.length * 80}ms` }}
          >
            <h2 className="font-display font-bold text-xl text-white uppercase-heading mb-4">
              {SECTIONS.length + 1}. CONTACT
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Privacy questions or data deletion requests:{' '}
              <a
                href="mailto:help@firestorm-internet.com"
                className="text-white hover:text-[var(--accent-teal)] transition-colors underline underline-offset-2"
              >
                help@firestorm-internet.com
              </a>
              {' '}or visit our{' '}
              <Link
                href="/contact"
                className="text-white hover:text-[var(--accent-teal)] transition-colors underline underline-offset-2"
              >
                Contact page
              </Link>.
            </p>
          </section>
        </div>

      </div>
    </div>
  );
}
