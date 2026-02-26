import type { Metadata } from 'next';

export interface RaceContent {
  meta: Metadata;                               // homepage metadata
  pageTitle: string;                            // race landing page <title>
  pageDescription: string;                      // race landing page description
  pageKeywords: string[];                       // race landing page keywords
  howItWorksText: string;                       // "How it works" paragraph for homepage
  whyCityText: string;                          // "Why X is the Perfect F1 City" paragraph
  circuitMapSrc?: string;                       // optional circuit map image (race landing page)
  hasGuide: boolean;                            // whether this race has a guide nav item
  currency: string;                             // 'AUD' | 'CNY' | 'USD' etc.
  faqItems: { q: string; a: string }[];         // homepage FAQ
  faqLd: object | null;                         // race landing page FAQ JSON-LD
  firstDayOffset: number;                       // -3 (Thu start) or -2 (Fri start)
}

export const RACE_CONTENT: Record<string, RaceContent> = {
  'melbourne-2026': {
    meta: {
      title: 'Melbourne F1 Weekend 2026 — Experiences, Schedule & Guide | F1 Weekend',
      description:
        'Discover the best Melbourne experiences for the 2026 Australian Grand Prix. Session-gap planning, curated tours, restaurants, and activities near Albert Park Circuit.',
      alternates: { canonical: 'https://f1weekend.co' },
      keywords: [
        'Australian Grand Prix 2026',
        'Melbourne F1 2026',
        'F1 race weekend Melbourne',
        'Albert Park Circuit activities',
        'things to do Melbourne Grand Prix',
        'F1 Melbourne experiences',
      ],
      openGraph: {
        title: 'F1 Weekend | Race Weekend Companion — Melbourne 2026',
        description:
          'Discover the best Melbourne experiences for the 2026 Australian Grand Prix. Session-gap planning, curated tours, and activities near Albert Park.',
        url: 'https://f1weekend.co',
        type: 'website',
      },
      twitter: {
        title: 'F1 Weekend | Race Weekend Companion — Melbourne 2026',
        description: 'Discover the best Melbourne experiences for the 2026 Australian Grand Prix.',
      },
    },
    pageTitle: 'Melbourne 2026 F1 Weekend | Guide, Schedule & Experiences | F1 Weekend',
    pageDescription:
      'Plan your 2026 Australian Grand Prix weekend in Melbourne. Session schedule, curated experiences, transport guide, and Melbourne tips for F1 race weekend March 5–8, 2026.',
    pageKeywords: [
      'Melbourne F1 2026',
      'Australian Grand Prix 2026',
      'Melbourne race weekend',
      'Albert Park Circuit 2026',
      'Melbourne F1 experiences',
      'Melbourne Grand Prix guide',
    ],
    howItWorksText:
      "The 2026 Australian Grand Prix at Albert Park Circuit runs four days — Thursday through Sunday, March 5–8. Between each session there are gaps ranging from 90 minutes to 4+ hours, and Melbourne's Central Business District is just 3 km from the circuit. F1 Weekend matches each gap to a curated list of activities: a laneway food tour before FP1, a beach walk between sessions, a winery dinner after qualifying. Over 30 experiences across 5 categories — Food & Dining, Adventure, Culture, Day Trips, and Nightlife — are listed with prices, duration, and the session gap they fit. Use the AI itinerary builder to get a personalised race weekend plan in 60 seconds, or browse by category and filter to your available time. Melbourne is one of the world's most liveable cities and deserves more than the grandstand — this is how you see it properly.",
    whyCityText:
      "Albert Park Circuit sits just 3 km from Melbourne's Central Business District — making the 2026 Australian Grand Prix one of the most uniquely explorable events on the F1 calendar. With 4+ hour evening gaps between sessions and a full day on Thursday before competitive action begins, race weekend becomes as much a city break as a motorsport event. Melbourne's laneways, beaches, bayside suburbs, and surrounding wine country are all within a 10–60 minute reach of the circuit. Over 30 curated experiences on F1 Weekend are specifically matched to your session gaps — so you never miss a lap, and you never miss Melbourne.",
    circuitMapSrc: '/Australia_Circuit.avif',
    hasGuide: true,
    currency: 'AUD',
    faqItems: [
      {
        q: 'What is F1 Weekend?',
        a: 'F1 Weekend is a Melbourne travel companion for the 2026 Australian Grand Prix (March 5–8). It curates 30+ activities — from 3-hour laneway food tours to full-day Great Ocean Road trips — matched to the gaps between F1 sessions, so you can explore Melbourne without missing a single lap.',
      },
      {
        q: 'What are the best things to do during Melbourne F1 weekend 2026?',
        a: 'Top picks: Melbourne Laneways Food Tour (3 hrs, A$99–A$130), St Kilda Beach & Pier Walk (free, 1–2 hrs), Great Ocean Road day trip (10 hrs, A$115), rooftop bar sunset at Naked in the Sky (A$40+), and Royal Botanic Gardens (free, 1.5 hrs). All fit into session gaps on Thursday, Friday, or Sunday morning.',
      },
      {
        q: 'What can I do between F1 practice sessions?',
        a: 'Melbourne gaps range from 1.5 hours (between afternoon sessions) to 4+ hours in the evening. A 1.5-hour gap fits a café crawl or St Kilda foreshore walk. The 3.5-hour Friday morning gap before FP1 suits a laneway food tour. Evening gaps of 4+ hours work perfectly for dinner in South Yarra or Southbank.',
      },
      {
        q: 'When is the Australian Grand Prix 2026?',
        a: 'The 2026 Formula 1 Australian Grand Prix takes place March 5–8, 2026, at Albert Park Circuit, Melbourne. Thursday is fan experience day, Friday hosts FP1 and FP2, Saturday features qualifying and the F1 Sprint, and Sunday is race day.',
      },
      {
        q: 'How do I get to Albert Park Circuit?',
        a: "Albert Park is 3 km from Melbourne's Central Business District. Take tram routes 1, 6, 16, 64, or 67 along St Kilda Road and alight at Albert Road or Fitzroy Street. Flinders Street Station is a 15-minute walk via St Kilda Road. Rideshare drops off at the Aughtie Drive gates. Driving is not recommended due to limited parking.",
      },
      {
        q: 'How much do Melbourne F1 experiences cost?',
        a: 'From free (St Kilda Beach, Botanic Gardens) to A$350+ for private tours. Most curated experiences cost A$59–A$130 per person. A typical Friday — coffee in the Central Business District (A$6), laneway food tour (A$99), dinner in South Yarra (A$60–A$90) — runs around A$165–A$200 per person all-in.',
      },
      {
        q: "What's the weather like in Melbourne in March?",
        a: "Late summer / early autumn: typically 18–26°C (64–79°F) with sunshine and occasional showers. Melbourne's weather is famously variable — pack a light layer and sunscreen. Evening temperatures drop to 15–18°C, so bring a jacket for late-night outings.",
      },
      {
        q: 'Can I enjoy F1 weekend without a circuit ticket?',
        a: "Yes. The free F1 Fan Village at Federation Square runs all race week with live screens, team displays, and sponsor activations. You can watch from Lakeside Park outside the circuit fence. And Melbourne's laneways, beaches, and dining scene give you a full weekend of experiences without setting foot in Albert Park.",
      },
    ],
    faqLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'When is the 2026 Australian Grand Prix?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The 2026 Australian Grand Prix runs March 5–8 at Albert Park Circuit, Melbourne. FP1 begins Friday March 6 at 11:30 AEDT, qualifying on Saturday March 7, and the race on Sunday March 8 at 15:00 AEDT.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do I get to Albert Park Circuit?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Take tram routes 1, 6, 16, 64, or 67 along St Kilda Road to Albert Road or Fitzroy Street. Flinders Street Station is a 15-minute walk via St Kilda Road. Rideshare drop-off is at the Aughtie Drive gates. Public transport is strongly recommended as race-day parking is limited.',
          },
        },
        {
          '@type': 'Question',
          name: 'What can I do between F1 sessions in Melbourne?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Session gaps at Melbourne range from 1.5 hours (afternoon) to 4+ hours in the evenings. Short gaps fit a St Kilda walk or South Yarra café stop. The 3.5-hour Thursday morning gap suits a laneway food tour. Evening gaps work for dinner along the Yarra or a rooftop bar, all within a 10-minute tram from the circuit.',
          },
        },
        {
          '@type': 'Question',
          name: 'What are the best Melbourne experiences during race weekend?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Top picks include the Melbourne Laneways Food Tour (A$99, 3 hrs), the Great Ocean Road day trip (A$115, best on Thursday), St Kilda beach and market walks (free), a sunset rooftop bar in the Central Business District (A$40+), and the Royal Botanic Gardens (free, 1.5 hrs). Browse all 30+ experiences filtered by session gap.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is Melbourne worth visiting beyond race days?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Melbourne is consistently ranked one of the world's most liveable cities. Beyond Albert Park, the Central Business District laneways offer world-class coffee and street art, the bayside suburbs have beach walks and seafood, and the surrounding region includes the Great Ocean Road and Yarra Valley wine country.",
          },
        },
      ],
    },
    firstDayOffset: -3,
  },

  'shanghai-2026': {
    meta: {
      title: 'Shanghai F1 Weekend 2026 — Experiences, Schedule & Guide | F1 Weekend',
      description:
        'Discover the best Shanghai experiences for the 2026 Chinese Grand Prix. Session-gap planning, curated tours, and activities near Shanghai International Circuit — Mar 13–15, 2026.',
      alternates: { canonical: 'https://f1weekend.co' },
      keywords: [
        'Chinese Grand Prix 2026',
        'Shanghai F1 2026',
        'Shanghai International Circuit activities',
        'things to do Shanghai Grand Prix',
        'F1 Shanghai experiences',
      ],
      openGraph: {
        title: 'F1 Weekend | Race Weekend Companion — Shanghai 2026',
        description:
          'Discover the best Shanghai experiences for the 2026 Chinese Grand Prix. Session-gap planning, curated tours, and activities near Shanghai International Circuit.',
        url: 'https://f1weekend.co',
        type: 'website',
      },
      twitter: {
        title: 'F1 Weekend | Race Weekend Companion — Shanghai 2026',
        description: 'Discover the best Shanghai experiences for the 2026 Chinese Grand Prix.',
      },
    },
    pageTitle: 'Shanghai 2026 F1 Weekend | Schedule & Experiences | F1 Weekend',
    pageDescription:
      'Plan your 2026 Chinese Grand Prix weekend in Shanghai. Session schedule, curated experiences, and activities near Shanghai International Circuit, March 13–15, 2026.',
    pageKeywords: [
      'Shanghai F1 2026',
      'Chinese Grand Prix 2026',
      'Shanghai F1 experiences',
      'Shanghai International Circuit 2026',
      'things to do Shanghai Grand Prix',
      'F1 Shanghai guide',
    ],
    howItWorksText:
      "The 2026 Chinese Grand Prix at Shanghai International Circuit runs three days — Friday through Sunday, March 13–15. Between each session there are gaps of 1.5 to 4+ hours. Shanghai's historic Bund waterfront is accessible from the circuit, and the French Concession, Zhujiajiao water town, and Suzhou are all within reach. Over 40 experiences across 5 categories — Food, Culture, Adventure, Day Trips, and Nightlife — are matched to your session gaps. Use the AI itinerary builder to plan in 60 seconds, or browse by category. Shanghai deserves more than the grandstand.",
    whyCityText:
      "Shanghai International Circuit sits 30 km from the Bund, but the city's metro and expressways make it reachable in 45–60 minutes. With no Thursday sessions and a three-day format (Friday–Sunday), fans get full mornings free before each practice session and extended evenings after. Shanghai's French Concession, river cruises, ancient water towns, and sky-high observation decks are all packaged into 40+ curated experiences matched to your session gaps — so you see one of the world's most extraordinary cities properly, lap by lap.",
    circuitMapSrc: '/Shanghai_Circuit.avif',
    hasGuide: false,
    currency: 'CNY',
    faqItems: [
      {
        q: 'What is F1 Weekend?',
        a: "F1 Weekend is a travel companion for the 2026 Chinese Grand Prix (March 13–15). It curates 40+ activities in Shanghai — from 3-hour French Concession food tours to full-day Zhujiajiao water town trips — matched to your session gaps so you can explore one of the world's most extraordinary cities without missing a lap.",
      },
      {
        q: 'What are the best things to do in Shanghai during F1 weekend?',
        a: 'Top picks: Zhujiajiao water town boat ride (5 hrs, ¥1,400), 3-hour food tasting tour in the French Concession (¥800), Shanghai Tower observation deck (¥480), ERA acrobatics show (¥550), Huangpu River night cruise (¥200–¥1,550).',
      },
      {
        q: 'What can I do between F1 sessions in Shanghai?',
        a: 'Shanghai gaps range from 1.5 hrs (between FP1/FP2) to 4+ hrs in the evenings. 1.5-hr gap: tea ceremony or quick Bund walk. 3.5-hr morning gap: French Concession food tour. Evening: Huangpu River cruise or bar hopping.',
      },
      {
        q: 'When is the Chinese Grand Prix 2026?',
        a: 'March 13–15, 2026 at Shanghai International Circuit. FP1 Friday 11:30 CST, qualifying Saturday 15:00 CST, race Sunday 15:00 CST.',
      },
      {
        q: 'How do I get to Shanghai International Circuit?',
        a: 'Metro Line 11 to Anting Station, then shuttle bus. Taxis and rideshare (DiDi) available. Circuit is 30 km west of city centre — allow 45–60 minutes from Puxi/Pudong.',
      },
      {
        q: 'How much do Shanghai F1 experiences cost?',
        a: '¥150 (Shanghai Zoo) to ¥4,000+ (Southern Great Wall day trip). Most popular guided tours ¥350–¥1,400. A typical Saturday — dim sum breakfast (¥200), French Concession food tour (¥800), river cruise (¥200–¥1,550) — runs around ¥1,200–¥2,550 all-in.',
      },
      {
        q: "What's the weather like in Shanghai in March?",
        a: "Mid-spring: 10–17°C (50–63°F), often overcast with occasional rain. Pack layers and a waterproof jacket. Shanghai's F1 weekend can be cool and damp — comfortable for circuit-going but bring a coat for evenings.",
      },
      {
        q: 'Can I enjoy F1 Shanghai without a circuit ticket?',
        a: "Yes. The Bund waterfront, Yu Garden, French Concession, and shopping districts are all open and atmospheric during race week. Pudong's skyline and the city's acrobatics shows are self-contained evening experiences that don't require circuit access.",
      },
    ],
    faqLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'When is the 2026 Chinese Grand Prix?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'March 13–15, 2026 at Shanghai International Circuit. FP1 Friday 11:30 CST, qualifying Saturday 15:00 CST, race Sunday 15:00 CST.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do I get to Shanghai International Circuit?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Metro Line 11 to Anting Station, then shuttle bus to the circuit. Taxis and DiDi also available. Allow 45–60 minutes from the city centre.',
          },
        },
        {
          '@type': 'Question',
          name: 'What can I do between F1 sessions in Shanghai?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Morning gaps (3.5 hrs before FP1) suit French Concession food tours or Bund walks. Afternoon gaps (1.5 hrs) fit a tea ceremony or dim sum stop. Evening gaps (4+ hrs) are ideal for Huangpu River cruises and bar hopping in the French Concession.',
          },
        },
        {
          '@type': 'Question',
          name: 'What are the best Shanghai experiences during race weekend?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Top picks: Zhujiajiao water town boat ride (¥1,400, 5 hrs), 3-hour food tasting tour (¥800), ERA acrobatics show (¥550), Huangpu River night cruise (¥200–¥1,550), and Suzhou bullet train day trip (¥2,900).',
          },
        },
        {
          '@type': 'Question',
          name: 'Is Shanghai worth visiting beyond race days?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Shanghai is one of the world's most dynamic cities. The Bund, French Concession, Pudong skyline, Yu Garden, and nearby water towns like Zhujiajiao give you a full city-break experience built around the race weekend.",
          },
        },
      ],
    },
    firstDayOffset: -2,
  },
};
