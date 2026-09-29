import type { Metadata } from "next";
import { Titillium_Web, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import { getActiveRaceSlug } from "@/lib/activeRace";
import { getRacesWithExperiences } from "@/services/race.service";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";

const titilliumWeb = Titillium_Web({
  variable: "--font-titillium-web",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const dynamic = 'force-dynamic';

// Staging and local visits must not show up in production analytics.
const isProduction = process.env.VERCEL_ENV === 'production';
const gaId = isProduction ? process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID : undefined;

export const metadata: Metadata = {
  metadataBase: new URL('https://f1weekend.co'),
  title: {
    default: 'F1 Weekend | Your Race Weekend Companion',
    template: '%s | F1 Weekend',
  },
  description:
    'Plan your F1 race weekend: session times, how to get to the circuit, and things to do in the race city between sessions.',
  openGraph: {
    siteName: 'F1 Weekend',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Firestorm Internet',
  url: 'https://f1weekend.co',
  logo: 'https://f1weekend.co/logo.png',
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'help@firestorm-internet.com',
    contactType: 'customer service',
  },
  sameAs: [],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const activeRaceSlug = await getActiveRaceSlug();
  const races = await getRacesWithExperiences();
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.getyourguide.com" />
        {/* Ahrefs Web Analytics (project "F1weekend"); the data key is public by design */}
        {isProduction && (
          <Script
            src="https://analytics.ahrefs.com/analytics.js"
            data-key={process.env.NEXT_PUBLIC_AHREFS_ANALYTICS_KEY ?? 'D7ZeRUINVlprh/1l3P26ow'}
            strategy="afterInteractive"
          />
        )}
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
      </head>
      <body
        className={`${titilliumWeb.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <Nav defaultRaceSlug={activeRaceSlug} races={races} />
        <main>{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
