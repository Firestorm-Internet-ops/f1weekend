import type { Metadata } from "next";
import { Titillium_Web, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";

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

export const metadata: Metadata = {
  title: "Pitlane | Your Race Weekend Companion",
  description:
    "Plan your F1 race weekend with curated local experiences, AI-powered itineraries, and bookable activities. Starting with the 2026 Australian Grand Prix in Melbourne.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${titilliumWeb.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
