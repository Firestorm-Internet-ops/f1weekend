import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact | Pitlane',
  description: 'Get in touch with the Pitlane team at Firestorm Internet.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen pt-24 pb-24 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Section 1 — Hero */}
        <div className="mb-16">
          <p className="text-xs font-medium uppercase-label text-[var(--accent-teal)] tracking-widest mb-3">
            GET IN TOUCH
          </p>
          <h1 className="font-display font-black text-4xl sm:text-5xl text-white uppercase-heading leading-none mb-6">
            Contact Us
          </h1>
          <p className="text-[var(--text-secondary)] text-lg leading-relaxed">
            Have a question about Pitlane, a partnership idea, or just want to say hello? We&apos;d
            love to hear from you.
          </p>
        </div>

        {/* Section 2 — We're Here to Help */}
        <div className="mb-16">
          <h2 className="font-display font-bold text-xl sm:text-2xl text-white uppercase-heading mb-4">
            We&apos;re Here to Help
          </h2>
          <div className="space-y-4 text-[var(--text-secondary)] text-base leading-relaxed mb-8">
            <p>
              Pitlane is built out of a passion for helping people travel smarter and enjoy stress-free experiences. Whether you’re a traveler, a local explorer, or part of the travel industry, we’d love to connect with you.
            </p>
            <p>
              For support, feedback, or partnership enquiries, email us at
              hello@firestorm-internet.com. We typically reply within one business day.
            </p>
          </div>
          <a
            href="mailto:hello@firestorm-internet.com"
            className="inline-flex items-center gap-3 px-6 py-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-medium)] transition-colors text-lg font-medium"
          >
            <span className="text-[var(--accent-teal)]">✉</span>
            hello@firestorm-internet.com
          </a>
        </div>

        {/* Section 3 — Contact Information 2×2 grid */}
        <div>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-white uppercase-heading mb-6">
            Contact Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: '✉',
                label: 'Email',
                content: 'hello@firestorm-internet.com',
                href: 'mailto:hello@firestorm-internet.com',
              },
              {
                icon: '📞',
                label: 'Phone',
                content: '+91 73588-08488',
                href: 'tel:+917358808488',
              },
              {
                icon: '📍',
                label: 'Address',
                content:
                  'Firestorm Internet, 203 30C Bollineni Hillside, Perumbakkam Main Rd, Nookampalayam, Chennai – 600126',
                href: null,
              },
              {
                icon: '🕐',
                label: 'Hours',
                content: 'Mon–Fri: 10 AM – 6 PM IST\nSat: 10 AM – 1 PM IST',
                href: null,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl text-[var(--accent-teal)] mt-0.5 shrink-0">
                    {item.icon}
                  </span>
                  <div>
                    <div className="text-xs font-medium uppercase tracking-widest text-[var(--text-muted)] mb-1">
                      {item.label}
                    </div>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="text-[var(--text-secondary)] hover:text-white transition-colors leading-relaxed"
                      >
                        {item.content}
                      </a>
                    ) : (
                      <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">{item.content}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
