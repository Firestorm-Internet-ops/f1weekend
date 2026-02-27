import type { Metadata } from 'next';

export interface TipsContent {
  meta: {
    title: string;
    description: string;
    keywords: string[];
  };
  heroSubtitle: string;
  categories: Array<{
    title: string;
    color: string;         // hex, e.g. '#E67E22'
    description: string;
    linkHref: string;
    linkLabel: string;
  }>;
  travelTips: Array<{
    heading: string;
    body: string;
  }>;
  gettingThere: {
    heading: string;
    intro: string;
    options: Array<{ icon: string; title: string; desc: string }>;
    fullGuideHref: string;
  };
  faq: Array<{ q: string; a: string }>;
}

export interface RaceContent {
  meta: Metadata;                               // homepage metadata
  pageTitle: string;                            // race landing page <title>
  pageDescription: string;                      // race landing page description
  pageKeywords: string[];                       // race landing page keywords
  howItWorksText: string;                       // "How it works" paragraph for homepage
  whyCityText: string;                          // "Why X is the Perfect F1 City" paragraph
  circuitMapSrc?: string;                       // optional circuit map image (race landing page)
  tips: TipsContent | null;                     // tips & FAQ page content (null = 404)
  currency: string;                             // 'AUD' | 'CNY' | 'USD' etc.
  openF1: {
    countryName: string;
    year: number;
  } | null;
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
    tips: {
      meta: {
        title: 'Melbourne F1 Tips & FAQ 2026 — Weather, Budget & What to Do | F1 Weekend',
        description:
          'Melbourne F1 weekend tips: weather in March, budget breakdown, best areas to stay, experiences by category, and 10 frequently asked questions answered.',
        keywords: [
          'Melbourne F1 tips 2026',
          'Melbourne Grand Prix weather March',
          'Melbourne F1 budget guide',
          'things to do Melbourne F1 weekend',
          'Melbourne F1 FAQ',
          'Australian Grand Prix 2026 tips',
        ],
      },
      heroSubtitle:
        'Weather, budget, experiences by category, and 10 questions answered for the 2026 Australian Grand Prix.',
      categories: [
        {
          title: 'Food & Dining',
          color: '#E67E22',
          description:
            "Melbourne is arguably Australia's best food city. The Central Business District laneways pack more great coffee and street food per square kilometre than almost anywhere in the world. Highlights include the Melbourne Laneways Food Tour (A$99–A$130, 3 hrs, fits Friday morning before FP1), the South Melbourne Market (free entry, morning sessions), and dinner in South Yarra's Chapel Street precinct (A$50–A$100pp, evenings after qualifying).",
          linkHref: '/races/melbourne-2026/experiences?category=food',
          linkLabel: 'Browse food experiences →',
        },
        {
          title: 'Adventure & Day Trips',
          color: '#2ECC71',
          description:
            'The Great Ocean Road is the standout day trip — 12 Apostles, rainforest gorges, and coastal cliffs within a full-day tour from Melbourne Central Business District (A$115, 10 hrs, Thursday March 5). The Yarra Valley wine region offers a shorter alternative (A$95–A$140, 8 hrs) with cellar doors and gourmet platters. For shorter adventures: the Dandenong Ranges (1 hour from Melbourne) offer rainforest walks and the famous Puffing Billy steam railway.',
          linkHref: '/races/melbourne-2026/experiences?category=daytrip',
          linkLabel: 'Browse day trips →',
        },
        {
          title: 'Culture & Arts',
          color: '#3498DB',
          description:
            "NGV International (free permanent collection) on St Kilda Road is a 5-minute walk from the circuit — ideal for a 1.5-hour gap between sessions. Hosier Lane, Melbourne's most famous street art laneway in the Central Business District, is free and perpetually changing. The State Library of Victoria (free) near Flinders Street Station is worth the 15-minute tram ride. For live music: the Corner Hotel in Richmond and the Forum Melbourne both host race week shows.",
          linkHref: '/races/melbourne-2026/experiences?category=culture',
          linkLabel: 'Browse culture experiences →',
        },
        {
          title: 'Nightlife',
          color: '#9B59B6',
          description:
            "Melbourne's nightlife is centred around the Central Business District laneways and the Yarra precinct, both a 15-minute tram from Albert Park. Top rooftop bars include Naked in the Sky on St Kilda (sunset views over Port Phillip Bay, A$40+ minimum spend) and Rooftop Bar on Swanston Street in the Central Business District (casual, free entry on weekdays). The Melbourne race week party scene peaks on Friday and Saturday nights — book ahead.",
          linkHref: '/races/melbourne-2026/experiences?category=nightlife',
          linkLabel: 'Browse nightlife experiences →',
        },
      ],
      travelTips: [
        {
          heading: 'Weather in March',
          body: "Late summer / early autumn. Average highs of 22–26°C (72–79°F), with occasional showers — Melbourne's weather is famously changeable. Pack: sunscreen, a light packable jacket, and comfortable walking shoes. Temperatures drop to 15–18°C in the evening.",
        },
        {
          heading: 'Budget Breakdown',
          body: 'Daily budget (excluding circuit tickets): A$100–A$150 for food and transport (Melbourne coffee, casual lunch, tram pass, and one dinner). Add A$99–A$130 for a guided food tour or activity. A$200–A$350/day covers a guided day trip plus dining. Hotels near the circuit (St Kilda, South Yarra) typically run A$300–A$600/night during race week — book at least 3 months in advance.',
        },
        {
          heading: 'Best Areas to Stay',
          body: "St Kilda (1–2 km from circuit) is the most convenient — beach access, great restaurants, and a short tram ride to Albert Park. South Yarra (2–3 km) offers more hotel options and is the city's upscale dining hub. Central Business District hotels (3 km) put you near the fan village and give flexibility for non-circuit days. Avoid anything east of the Central Business District for easy circuit access.",
        },
      ],
      gettingThere: {
        heading: 'Getting to Albert Park Circuit',
        intro:
          "Albert Park Circuit is 3 km south of Melbourne's Central Business District — the closest major circuit to a world-class city centre on the F1 calendar. Public transport is strongly recommended; race-day parking within 1 km of the circuit is extremely limited.",
        options: [
          {
            icon: '🚃',
            title: 'Tram (recommended)',
            desc: 'Routes 1, 6, 16, 64, and 67 run along St Kilda Road. Alight at Albert Road or Fitzroy Street. Free during event hours with valid circuit ticket.',
          },
          {
            icon: '🚶',
            title: 'Walk from Central Business District',
            desc: '15–20 minutes via St Kilda Road — tree-lined, flat, and very walkable. Passes through the Domain parklands.',
          },
          {
            icon: '🚗',
            title: 'Rideshare / Taxi',
            desc: 'Drop-off at Aughtie Drive gates. Expect 2x surge pricing at session start and end. Book in advance for pick-up, or walk 5–10 minutes to a quieter street.',
          },
        ],
        fullGuideHref: '/races/melbourne-2026/getting-there',
      },
      faq: [
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
          a: "Gates open 2 hours before the first session each day. On Friday, that's ~09:30 AEDT for 11:30 FP1. Allow 30–45 extra minutes for security queues on qualifying and race day. Tram lines can run 20+ minutes long at peak entry and exit windows.",
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
          a: "South Yarra (15 min tram) is the closest upscale precinct — Chapel Street has modern Australian cuisine. St Kilda (10 min tram) has lively cafés and bars on Fitzroy and Acland Streets. Central Business District laneways (15–20 min tram) offer some of Australia's best coffee, Italian, and Southeast Asian dining in close proximity.",
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
      ],
    },
    currency: 'AUD',
    openF1: {
      countryName: 'Australia',
      year: 2025, // Year to fetch historical data from
    },
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
    tips: {
      meta: {
        title: 'Shanghai F1 Tips & FAQ 2026 — Weather, Budget & What to Do | F1 Weekend',
        description:
          'Shanghai F1 weekend tips: weather in March, budget breakdown, best areas to stay, experiences by category, and 10 frequently asked questions answered.',
        keywords: [
          'Shanghai F1 tips 2026',
          'Chinese Grand Prix weather March',
          'Shanghai F1 budget guide',
          'things to do Shanghai F1 weekend',
          'Shanghai F1 FAQ',
          'Chinese Grand Prix 2026 tips',
        ],
      },
      heroSubtitle:
        'Weather, budget, experiences by category, and 10 questions answered for the 2026 Chinese Grand Prix.',
      categories: [
        {
          title: 'Food & Dining',
          color: '#E67E22',
          description:
            "Shanghai is one of Asia's great food cities. The French Concession is the standout precinct — tree-lined streets packed with Shanghainese bistros, artisan coffee, and street-food stalls. Highlights include the 3-hour French Concession food tasting tour (¥800, fits the Friday morning gap before FP1), dim sum at a traditional teahouse in the Old City (¥150–¥300pp), and Xintiandi's upscale restaurant strip (¥300–¥600pp) for evening dining after qualifying.",
          linkHref: '/races/shanghai-2026/experiences?category=food',
          linkLabel: 'Browse food experiences →',
        },
        {
          title: 'Adventure & Day Trips',
          color: '#2ECC71',
          description:
            "Zhujiajiao ancient water town is the standout day trip — gondola rides through Song Dynasty canals, stone bridges, and street food stalls just 45 minutes from the city (¥1,400, 5 hrs, best on Friday morning). Suzhou's classical gardens and silk market make for a compelling bullet-train day trip (¥2,900, 8 hrs, best on Friday). For a half-day: the Bund riverfront walk plus a Huangpu River cruise packs two of Shanghai's defining experiences into a 3-hour session gap.",
          linkHref: '/races/shanghai-2026/experiences?category=daytrip',
          linkLabel: 'Browse day trips →',
        },
        {
          title: 'Culture & Arts',
          color: '#3498DB',
          description:
            'The Bund is Shanghai\'s architectural centrepiece — a mile of colonial-era facades facing the Pudong skyline across the river, free to walk at any hour. Yu Garden (¥40) in the Old City is a 400-year-old Ming Dynasty garden ideal for a 1.5-hour session gap. The Shanghai Museum (free) on People\'s Square holds one of China\'s finest collections of bronzes, ceramics, and calligraphy. For evening culture: ERA Intersection of Time acrobatics show at the Shanghai Circus World is one of the city\'s most spectacular live performances (¥550).',
          linkHref: '/races/shanghai-2026/experiences?category=culture',
          linkLabel: 'Browse culture experiences →',
        },
        {
          title: 'Nightlife',
          color: '#9B59B6',
          description:
            "Shanghai's nightlife is concentrated in three zones, all accessible from the circuit. The Bund and Lujiazui (Pudong) host Vue Bar at the Hyatt on the Bund and Flair Rooftop Bar at The Ritz-Carlton — both offering unmatched views of the skyline for a post-session sunset drink (¥100–¥200 minimum per cocktail). The French Concession's Yongkang Road and Julu Road strip has a dense concentration of bars and live music venues. The race week Saturday night peak is legendary — book tables ahead.",
          linkHref: '/races/shanghai-2026/experiences?category=nightlife',
          linkLabel: 'Browse nightlife experiences →',
        },
      ],
      travelTips: [
        {
          heading: 'Weather in March',
          body: "Mid-spring: average highs of 13–17°C (55–63°F), often overcast with frequent rain. Pack layers, a waterproof jacket, and comfortable walking shoes. Shanghai in March can be damp and cool — temperatures drop to 7–10°C in the evening. The circuit is exposed with limited shelter, so a poncho or compact umbrella is essential for race day.",
        },
        {
          heading: 'Budget Breakdown',
          body: 'Daily budget (excluding circuit tickets): ¥300–¥500 for food and transport (street food breakfast, metro day pass, lunch in the French Concession, dinner with drinks). Add ¥800–¥1,400 for a guided tour or activity. ¥2,000–¥3,500/day covers a full day trip plus fine dining. Hotels in Puxi (French Concession, Xintiandi) typically run ¥1,500–¥4,000/night during race week — book at least 3 months in advance. Pudong hotels near the airport cost more but are farther from city experiences.',
        },
        {
          heading: 'Best Areas to Stay',
          body: "The French Concession (Xuhui/Jing'an) is the most desirable base — walkable neighbourhood, best restaurants, and metro access to both the circuit and the Bund. Xintiandi and the Bund area offer high-end hotels (Four Seasons, The Peninsula) with Huangpu River views, a 45–60-minute metro ride to the circuit. Avoid Pudong (east side) unless you need airport proximity — it's further from all the best city experiences.",
        },
      ],
      gettingThere: {
        heading: 'Getting to Shanghai International Circuit',
        intro:
          'Shanghai International Circuit is 30 km northwest of the city centre in Jiading District. There is no single direct route — allow 60–75 minutes from central Shanghai and plan your exit before sessions end to avoid peak crowds.',
        options: [
          {
            icon: '🚇',
            title: 'Metro Line 11 + shuttle (recommended)',
            desc: 'Take Metro Line 11 to Anting Station (from People\'s Square ~55 min, ¥6). Official shuttle buses run from Anting Station to the circuit gates — allow 15 minutes. Buy metro tickets via the Alipay or WeChat app to avoid queues.',
          },
          {
            icon: '🚗',
            title: 'DiDi (Chinese rideshare)',
            desc: 'Download the DiDi app before arriving — it works in English. Expect ¥150–¥250 one-way from central Shanghai and 60+ minutes in race-day traffic. Drop-off is at the designated rideshare zone on the circuit perimeter. Surge pricing applies around session start and finish.',
          },
          {
            icon: '🚌',
            title: 'Official race shuttle',
            desc: 'Shuttle buses run from designated stops in Puxi and Pudong directly to circuit gates — purchase tickets via the official Chinese Grand Prix website. Recommended for race day: avoids metro crush and deposits you closer to the grandstands.',
          },
        ],
        fullGuideHref: '/races/shanghai-2026/getting-there',
      },
      faq: [
        {
          q: 'What is the best day to explore Shanghai without missing sessions?',
          a: "Friday morning before FP1 is the prime window — a 3.5-hour gap from hotel checkout to needing to leave for the circuit. Use it for a French Concession food tour or a Bund walk. There's no Thursday session in Shanghai's three-day format, so if you arrive on Thursday you have a full free day — ideal for Zhujiajiao or a Suzhou bullet-train day trip.",
        },
        {
          q: 'Are there free things to do during Shanghai F1 weekend?',
          a: 'Yes. The Bund waterfront promenade is free at all hours — especially spectacular at night. Yu Garden exterior courtyards and the Old City bazaar are free to walk. The Shanghai Museum on People\'s Square is free (registration required). The French Concession streets and markets are free to explore, and Lujiazui\'s riverside park in Pudong offers views of the Bund for no cost.',
        },
        {
          q: "What's the dress code at Shanghai International Circuit?",
          a: 'No formal dress code, but the March weather demands practical clothing — layers, waterproof outer layer, and comfortable shoes. The circuit is large and paddock areas can be muddy after rain. Grandstands are exposed, so bring a hat for sun breaks and a warm layer for evening qualifying. High heels are completely impractical.',
        },
        {
          q: 'How early should I arrive at Shanghai International Circuit?',
          a: 'Gates open approximately 2 hours before the first scheduled session. On Friday, gates open around 09:30 CST for an 11:30 FP1. Metro crowds build quickly — arriving at Anting Station 30–45 minutes before gates open is advisable. On race day, allow 90 minutes from the city centre and expect long shuttle queues.',
        },
        {
          q: 'Do I need to speak Chinese to get around Shanghai?',
          a: "No, but a few apps help enormously. Download DiDi (rideshare, works in English), Alipay or WeChat Pay (cashless payments — most street vendors don't accept cards), and Google Translate with Chinese offline download for menus and signs. Major hotels and tourist areas have English-speaking staff. Metro signs and announcements are bilingual.",
        },
        {
          q: 'Is the Zhujiajiao water town day trip possible during F1 weekend?',
          a: 'Yes — and it fits a Friday morning session gap well. Zhujiajiao is 45 minutes from central Shanghai by car or bus. A 5-hour tour (¥1,400) departing at 08:00 returns you to the city by 13:00–13:30, leaving enough time to reach the circuit for an afternoon FP2. Pre-book through a guided tour operator to avoid transport logistics.',
        },
        {
          q: 'What are the best areas to eat near Shanghai International Circuit?',
          a: "The circuit itself is in Jiading District — a suburban area with limited dining options outside the circuit. Plan to eat in the city before heading out, or use circuit hospitality. Post-session dining is best back in central Shanghai: the French Concession for international and Shanghainese cuisine (¥200–¥500pp), Xintiandi for upscale restaurants (¥400–¥800pp), or Yongkang Road bars for casual evening bites.",
        },
        {
          q: 'Which payment methods work in Shanghai?',
          a: "Cash (CNY) and mobile payment (Alipay or WeChat Pay) are the primary methods. International credit cards are accepted at hotels, major shopping malls, and some restaurants, but street food vendors, markets, and taxis typically require mobile payment or cash. Set up Alipay with an international card before arrival — it now works for foreign visitors without a Chinese bank account.",
        },
        {
          q: 'What F1 fan activations happen in Shanghai city during race week?',
          a: 'The official F1 Fan Zone is typically located on the Bund or at the People\'s Square area during race week — check the Chinese Grand Prix official website for 2026 confirmed locations and dates. Team merchandise pop-ups appear in major shopping malls. Several rooftop bars and hotel venues in the Bund area run F1 watch parties and race week specials.',
        },
        {
          q: "What's the best experience for a first-time F1 fan in Shanghai?",
          a: "The 3-hour French Concession food tasting tour is the standout pick — it fits the Friday morning gap before FP1, covers 8–10 tastings across the neighbourhood's best vendors, and leaves you back at a metro station with time to spare. Pair it with a Huangpu River cruise on Friday evening (¥200–¥400, 1 hour) for an iconic view of the Pudong skyline — two of Shanghai's defining experiences without missing a single session.",
        },
      ],
    },
    currency: 'CNY',
    openF1: {
      countryName: 'China',
      year: 2025,
    },
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
