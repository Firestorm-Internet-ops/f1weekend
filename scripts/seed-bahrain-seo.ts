/**
 * Seeds F1-focused SEO content for all 32 Bahrain 2026 experiences.
 * Generated via Claude Code — no external API calls required.
 * Run: npx tsx --env-file=.env scripts/seed-bahrain-seo.ts
 */
import mysql from 'mysql2/promise';

interface SeoRow {
  id: number;
  abstract: string;       // 140–160 char F1-focused meta desc
  f1_context: string;     // 80–120 word F1 editorial para
  seo_keywords: string[]; // 6–8 long-tail keywords
  f1_windows_label: string;
}

const SEO_DATA: SeoRow[] = [
  {
    id: 142,
    abstract: "Top-rated 5-hour Bahrain tour hitting the UNESCO Fort, Al Fateh Grand Mosque, Royal Camel Farm, and Manama Souq — perfect for a Friday or Saturday morning.",
    f1_context: "Bahrain's top-rated city-and-desert combo slides perfectly into the Bahrain GP's generous morning windows. Before Friday Practice 1 you've got a full 6 hours to take in Bahrain Fort's ancient Dilmun walls, step inside one of the world's largest mosques at Al Fateh, and meet the royal family's camels. The 5-hour duration means you're back at the circuit with time to spare. A licensed guide handles all logistics — no rental car stress in Sakhir's heat. At $95 this is the single best all-round Bahrain experience for F1 fans wanting context beyond the pit lane.",
    seo_keywords: ["bahrain city tour f1 weekend", "manama half day tour bahrain grand prix", "bahrain fort tour 2026", "al fateh mosque guided tour bahrain", "bahrain GP activities friday morning", "things to do bahrain f1 weekend", "royal camel farm bahrain tour"],
    f1_windows_label: "Friday Morning (before FP1) · Saturday Morning (before FP3) · Sunday Morning (Race Day)",
  },
  {
    id: 143,
    abstract: "6-hour south-to-north Bahrain tour: Al Fateh Mosque, F1 Circuit, Tree of Life, camels, and the UNESCO fort — 4.9 stars from 157 travellers.",
    f1_context: "This is the one for the Formula 1 faithful: your guide literally drives you past the Bahrain International Circuit on race week, stops for photos at the Welcome Centre, then continues to the 400-year-old Tree of Life rising improbably from the desert. At 6 hours it fits neatly into the Friday or Saturday morning windows. You get the Grand Mosque's cavernous interior, the UNESCO Bahrain Fort's sea views, and camel encounters — all in one loop. Rated 4.9 by 157 travellers. The must-book for fans arriving early to the Bahrain GP.",
    seo_keywords: ["f1 circuit bahrain tour", "bahrain international circuit visit", "south to north bahrain tour", "tree of life bahrain tour f1", "bahrain grand prix sightseeing", "things to do bahrain grand prix weekend", "manama city tour f1 race"],
    f1_windows_label: "Friday Morning (before FP1) · Saturday Morning (before FP3) · Sunday Morning (Race Day)",
  },
  {
    id: 144,
    abstract: "Bahrain's only dedicated food tour — taste iconic Bahraini dishes with a local guide through Manama Souq's spice-filled alleyways. 3 hours, any window.",
    f1_context: "Between sessions at the Bahrain GP, food is the real pit stop. This 3-hour walking tour is the only dedicated food experience in Bahrain, run by local guides who've deep-dived the island's culinary heritage. Expect machboos rice, fresh Gulf seafood, sweet halwa, and cardamom-spiked coffee in the souq's atmospheric labyrinth. The format fits every F1 session window — whether it's a Friday evening after Practice 2 or a quick Saturday afternoon gap. At 4.9 stars from 55 reviewers it's the most trusted food experience in the kingdom.",
    seo_keywords: ["bahrain food tour manama souq", "bahraini food experience f1 weekend", "manama street food tour", "what to eat bahrain grand prix", "bahrain traditional food tasting", "bahrain souq food tour 2026", "machboos food tour bahrain"],
    f1_windows_label: "Any Morning or Evening — 6 session windows",
  },
  {
    id: 145,
    abstract: "5-star full-day Bahrain loop — Manama's mosques and markets, then deep into the desert for the Tree of Life, camel encounters, and dune landscapes.",
    f1_context: "Rated a perfect 5 stars by every traveller so far, this 7-hour south-to-north loop is designed for visitors who want to see everything without cutting corners. Free local snacks are included — a thoughtful touch on a hot April day in Sakhir. It fits the Saturday morning window (7 hours before FP3) and the Sunday race-day morning (9 hours free). Modern conveniences like washrooms at each stop and a relaxed pace make it popular with first-time Bahrain visitors. At $80 it's exceptional value for the coverage it delivers.",
    seo_keywords: ["bahrain full day tour f1 weekend", "tree of life bahrain grand prix", "best bahrain tour race weekend", "bahrain desert and city tour", "bahrain highlights tour 2026", "saturday morning activities bahrain gp", "bahrain sightseeing from manama"],
    f1_windows_label: "Saturday Morning (before FP3) · Sunday Morning (Race Day)",
  },
  {
    id: 146,
    abstract: "Sample 10 traditional Bahraini dishes in 2 hours with hotel pickup — the fastest way to taste authentic Gulf flavours during F1 race week.",
    f1_context: "At just 2 hours, this food tasting tour is built for the Bahrain GP's tighter session gaps. Ten traditional dishes — from slow-cooked machboos to muhallabia dessert and Gulf shrimp — arrive in quick succession, guided by a local who grew up eating them. The format fits into the Friday or Saturday afternoon gap (2 hours between FP1 and FP2, or between FP3 and Qualifying), or any evening post-session window. Perfect for the F1 fan who wants to eat well but needs to be back for night qualifying at the Bahrain International Circuit.",
    seo_keywords: ["bahrain food tasting tour 2 hours", "traditional bahraini food experience", "quick food tour bahrain f1", "machboos tasting bahrain", "bahrain culinary tour race weekend", "short food experience bahrain gp", "gulf food tour manama"],
    f1_windows_label: "Any Session Window — fits all 8 gaps from 2 hours",
  },
  {
    id: 147,
    abstract: "Walk Bahrain's UNESCO Pearling Path in Muharraq, open oysters on the beach with a local diver, then visit Bahrain Fort and Manama Market. 6 hours.",
    f1_context: "Bahrain built its pearl trading empire long before oil — and this tour brings that chapter alive. You spend two hours on the UNESCO Pearling Path in Muharraq's old town, then move to the coast for an oyster-opening session led by a local diver who explains the harvesting craft. Any pearl you find is yours to keep. The afternoon takes in Bahrain Fort's Dilmun-era ruins and the bustling Manama market. At 6 hours it fits any morning window perfectly. An experience you simply cannot replicate at any other Formula 1 race on the calendar.",
    seo_keywords: ["bahrain pearling path tour", "oyster opening bahrain experience", "muharraq UNESCO pearling tour", "bahrain pearl diving f1 weekend", "unique bahrain tour grand prix", "bahrain fort muharraq tour", "dilmun heritage tour bahrain"],
    f1_windows_label: "Friday Morning (before FP1) · Saturday Morning (before FP3) · Sunday Morning (Race Day)",
  },
  {
    id: 148,
    abstract: "Bahrain's most-reviewed tour: 385 ratings averaging 4.9★ — AC bus with Wi-Fi, snacks, Al Fateh Mosque, Fort, Souq, and all major sights in 7 hours.",
    f1_context: "The sheer volume of reviews — 385 and still climbing — signals this is Bahrain's most dependable guided experience. The operator has spent years perfecting timing and pacing, which is why the on-time return guarantee is a core selling point. Originally marketed for cruise passengers, the itinerary covers identical ground to independent tours but at $78, undercutting many rivals. For F1 fans it's a perfect Saturday or Sunday morning full-day excursion. The AC bus with Wi-Fi lets you catch up on session analysis en route between the mosque, fort, and souq.",
    seo_keywords: ["best bahrain tour 5 stars", "bahrain top sights guided tour", "bahrain 7 hour city tour f1", "manama sightseeing tour 2026", "most reviewed bahrain tour", "saturday bahrain GP activity", "bahrain fort mosque souq tour"],
    f1_windows_label: "Saturday Morning (before FP3) · Sunday Morning (Race Day)",
  },
  {
    id: 149,
    abstract: "4-hour Bahrain adventure: photo stop at the F1 Circuit, camel encounter in the desert, UNESCO Dilmun ruins, and Manama Souq market — all in one morning.",
    f1_context: "This 4-hour tour was built for visitors with limited time — a format tailor-made for the Bahrain GP's shorter session gaps. The Formula 1 Circuit photo stop is a genuine highlight: you pull up at the Welcome Centre for a desert circuit panorama, camel selfie included. The tour also fits the Friday evening window (4 hours post-FP2) or the Saturday morning slot. Small group size keeps costs down and the vibe social — you'll likely be sharing the experience with other fans who've flown in just for the Bahrain race.",
    seo_keywords: ["bahrain half day city desert tour", "f1 circuit photo stop bahrain", "bahrain adventure tour race weekend", "camel desert bahrain f1", "short bahrain tour 4 hours", "bahrain gp afternoon activity", "manama desert tour 2026"],
    f1_windows_label: "Friday Morning (before FP1) · Friday Evening (after FP2) · Saturday Morning (before FP3) · Sunday Morning (Race Day)",
  },
  {
    id: 150,
    abstract: "7-hour Bahrain loop with 279 reviews and a local Bahraini guide — National Museum, mosques, camel farm, desert, and Manama Souq on one comfortable circuit.",
    f1_context: "Two hundred and seventy-nine reviews don't lie: this is one of the most reliable Bahrain tours you can book. Operated by Bahrain Fun Tours — a nationally-licensed operator — the 7-hour format visits the National Museum, the Royal Camel Farm, the iconic Grand Mosque, and Manama's bustling souq. Generous time at each stop means no rushing. At $79 this is the most cost-effective full-day experience for F1 travellers hitting the Saturday morning window before FP3 at the Bahrain International Circuit.",
    seo_keywords: ["around bahrain 7 hour tour", "bahrain national museum guided tour", "full day bahrain tour f1 2026", "bahrain fun tours f1 weekend", "bahrain souq tour race weekend", "affordable bahrain city tour", "saturday morning activity bahrain gp"],
    f1_windows_label: "Saturday Morning (before FP3) · Sunday Morning (Race Day)",
  },
  {
    id: 151,
    abstract: "5-hour shared Bahrain circuit covering north and south — mosques, fort, desert, camel farm, and Manama Souq. 99 reviews confirm consistent delivery.",
    f1_context: "With 99 reviews the AIDAprima circuit tour has established a reliable track record across international visitors. The 5-hour loop covers north and south Bahrain efficiently — Grand Mosque, UNESCO Fort, Royal Camel Farm, desert landscape, and Manama market — arriving back in time for afternoon sessions. The 4.3 rating reflects some pacing variability, but the volume of reviews suggests the experience consistently delivers. At $93 it fits the Friday or Saturday morning window. A practical choice if the higher-rated alternatives are fully booked for the Bahrain GP.",
    seo_keywords: ["5 hour bahrain tour f1 weekend", "bahrain north south circuit tour", "bahrain friday morning activity", "shared bahrain tour 2026", "manama camel farm mosque tour", "bahrain gp touring experience", "bahrain trip from manama"],
    f1_windows_label: "Friday Morning (before FP1) · Saturday Morning (before FP3) · Sunday Morning (Race Day)",
  },
  {
    id: 152,
    abstract: "Top-rated 7-hour Bahrain guided trip: 11 attractions including the F1 Circuit, National Museum, Camel Farm, Bahrain Fort, and Manama Souq — 4.9 stars.",
    f1_context: "Eleven top attractions in one 7-hour tour — including a drive past the Bahrain International Circuit and a stop at Manama's aromatic traditional restaurants. Operated by Bahrain Fun Tours with 24/7 WhatsApp support, this is one of the most comprehensive circuits on GYG. The National Museum sets the historical context before you visit the Fort, then the Camel Farm lightens the mood before the souq. Rated 4.9 stars from 37 travellers. Fits the Saturday morning (7h) or race day Sunday morning (9h) window.",
    seo_keywords: ["bahrain guided trip 11 attractions", "from manama bahrain day tour", "comprehensive bahrain tour f1 weekend", "bahrain fun tours f1 2026", "7 hour bahrain sightseeing trip", "manama souq camel farm tour", "bahrain top attractions tour"],
    f1_windows_label: "Saturday Morning (before FP3) · Sunday Morning (Race Day)",
  },
  {
    id: 153,
    abstract: "Visit the F1 Circuit, Royal Camel Farm, Tree of Life, First Oil Well, and Al'Ali burial mounds on a focused 4-hour desert tour from Manama.",
    f1_context: "Purpose-built for F1 visitors who want to see the circuit and the desert in a single efficient hit. The stop at the Bahrain International Circuit's Welcome Centre delivers exactly the photo moment you came for — the sweeping desert track backdrop that makes Bahrain one of the most dramatic rounds on the calendar. From there you continue to the 400-year-old Tree of Life and the First Oil Well that made modern Bahrain possible. At 4 hours and $77 it fits the Friday evening window cleanly. Strong 4.9 rating from 19 reviews.",
    seo_keywords: ["bahrain half day desert tour f1", "bahrain f1 circuit tour sakhir", "tree of life camel farm bahrain", "bahrain desert adventure race weekend", "formula 1 bahrain circuit visit", "4 hour bahrain tour race week", "bahrain friday evening activity"],
    f1_windows_label: "Friday Morning (before FP1) · Friday Evening (after FP2) · Saturday Morning (before FP3) · Sunday Morning (Race Day)",
  },
  {
    id: 154,
    abstract: "7-hour Bahrain full-day tour covering all major sights — open to any visitor arriving by sea or air. 4.5 stars from 32 reviews at $99.",
    f1_context: "Despite the cruise-passenger branding, this 7-hour Al Hidd-based tour operates on standard guided-tour logistics and is equally suitable for F1 visitors staying in Manama. The operator provides 24/7 WhatsApp support and covers the full Bahrain circuit — mosque, fort, souq, desert, and skyline photo stops. At $99 it sits slightly above the budget options but offers comprehensive coverage across Saturday or Sunday morning windows. For F1 fans who book late or find cheaper alternatives sold out, it's a reliable backup with 32 verified reviews.",
    seo_keywords: ["bahrain full day 7 hour tour", "bahrain in a day tour gp weekend", "all bahrain attractions one tour", "manama to bahrain sightseeing", "bahrain saturday morning activity f1", "guided bahrain tour 2026", "bahrain tour booking race week"],
    f1_windows_label: "Saturday Morning (before FP3) · Sunday Morning (Race Day)",
  },
  {
    id: 155,
    abstract: "Stress-free 5-hour Manama city tour: Al Fateh Mosque, UNESCO Fort, vibrant souq, Bahrain Bay boat ride, and World Trade Centre photo stop. 4.8 stars.",
    f1_context: "Bahrain Travellers' 5-hour Manama circuit earns its 4.8-star rating through attention to logistics — comfortable transport, generous stop times, and a Bahrain Bay boat ride that most city tours skip. The souq immersion is genuinely atmospheric: narrow lanes lined with spices, gold, and Arabic perfume that contrast vividly with the modern F1 paddock. The 5-hour duration slots neatly into any of the three morning windows available across the race weekend. A consistent performer with 19 verified reviews from international visitors.",
    seo_keywords: ["manama city tour 5 hours bahrain", "bahrain bay boat ride tour", "al fateh mosque bahrain fort tour", "manama souq culture tour f1", "bahrain city tour morning activity", "5 hour manama sightseeing tour", "bahrain gp city exploration"],
    f1_windows_label: "Friday Morning (before FP1) · Saturday Morning (before FP3) · Sunday Morning (Race Day)",
  },
  {
    id: 156,
    abstract: "Bahrain's best-value city tour at $46 — Al Fateh Mosque, UNESCO Fort, Manama Souq, and WTC photo stop on a comfortable bus. 4 hours, self-guided.",
    f1_context: "At $46 this self-guided bus tour is Bahrain's most affordable way to tick off all the major sights. The format gives you flexibility — linger at the Al Fateh Mosque's vast marble interior or sprint through Manama Souq at your own pace. Port pickup makes logistics easy from Manama hotels. The 4-hour duration fits Friday morning (before FP1) or Friday evening (after FP2) windows equally well. Four-point-eight stars from 14 reviews suggests the operator keeps quality consistent. A practical choice for F1 fans who prefer to explore independently.",
    seo_keywords: ["cheap bahrain city tour", "self guided bus tour manama", "budget bahrain sightseeing tour f1", "al fateh mosque bahrain fort bus tour", "affordable bahrain experience race weekend", "4 hour manama city bus tour", "bahrain WTC mosque fort souq tour"],
    f1_windows_label: "Friday Morning (before FP1) · Friday Evening (after FP2) · Saturday Morning (before FP3) · Sunday Morning (Race Day)",
  },
  {
    id: 157,
    abstract: "Choose your Bahrain experience — 4+ private tour options including heritage, culture, and desert routes. Flexible, private, and F1-timing-friendly. 5 hours.",
    f1_context: "Four-plus customisable tour options from Bahrain Fun Tours — the officially licensed national operator — means you can fine-tune the experience to what excites you most: deep Dilmun history, Grand Mosque architecture, desert landscapes, or a blend of all three. Private means you control the pace, the stops, and the photography time. At $79 per person this undercuts most private-tour alternatives. The 5-hour duration is ideal for the Friday or Saturday morning windows before Bahrain GP practice sessions begin. Rated 4.6 from 13 international reviews.",
    seo_keywords: ["private bahrain day tour f1 weekend", "customizable bahrain tour 2026", "bahrain fun tours private experience", "choose your bahrain tour race week", "flexible bahrain sightseeing private", "bahrain gp private cultural tour", "5 hour private manama tour"],
    f1_windows_label: "Friday Morning (before FP1) · Saturday Morning (before FP3) · Sunday Morning (Race Day)",
  },
  {
    id: 158,
    abstract: "Perfect 5-star score, 10 reviews, and $44 — the most affordable full-day Bahrain tour covering Al Fateh Mosque, Bahrain Fort, F1 Circuit, and the Tree of Life.",
    f1_context: "The numbers are hard to argue with: 5.0 stars across 10 reviews and a $44 price point make this the strongest value on the Bahrain GYG list. The 7-hour itinerary drives past the Bahrain International Circuit on the way to the Tree of Life and First Oil Well — a genuine F1 fan highlight. National Museum entrance is included in the price, unusual at this tier. The operator covers Bahrain Fort, Al Fateh Mosque, and the desert loop efficiently. Saturday morning (7h free before FP3) or Sunday race morning (9h) are the ideal windows.",
    seo_keywords: ["cheap bahrain tour full day", "5 star bahrain guided tour", "best value bahrain tour f1 weekend", "bahrain highlights tour 2026", "7 hour bahrain tour saturday morning", "f1 circuit tree of life bahrain", "manama guided excursion race week"],
    f1_windows_label: "Saturday Morning (before FP3) · Sunday Morning (Race Day)",
  },
  {
    id: 159,
    abstract: "5-hour downtown Manama circuit: Al Fateh Mosque, National Museum, UNESCO Bahrain Fort, World Trade Centre, and Muharraq island for traditional Bahraini sweets.",
    f1_context: "The Muharraq island stop for traditional sweets is what sets this downtown circuit apart from the generic city tours. You cross to the older island city — the historical pearl trading capital — to sample the sugar-dusted confections that local families have made for generations. The rest of the 5-hour loop covers Grand Mosque, National Museum, and the UNESCO Fort. At $52 it's one of the more affordable guided options. Best suited for the Friday morning window (6 hours free before FP1). Nine reviews at 4.4 stars.",
    seo_keywords: ["manama downtown tour 5 hours", "muharraq island bahrain tour", "bahrain traditional sweets experience", "bahrain city centre tour race week", "al fateh mosque national museum tour", "cheap bahrain city tour guided", "bahrain friday morning activity f1"],
    f1_windows_label: "Friday Morning (before FP1) · Saturday Morning (before FP3) · Sunday Morning (Race Day)",
  },
  {
    id: 160,
    abstract: "Private Bahrain city tour including a sit-down traditional Bahraini lunch — Grand Mosque, Bahrain Bay, UNESCO Fort, and Manama Souq with a personal guide.",
    f1_context: "The lunch inclusion is the differentiator here — a genuine sit-down meal of traditional Bahraini cuisine mid-tour, something the budget group tours don't offer. The private format means your guide adapts timing around F1 session schedules: if you need to be back for qualifying, that's baked into the itinerary. Bahrain Bay and World Trade Centre views, UNESCO Fort exploration, and the Grand Mosque interior round out a premium 5-hour circuit. At $111 it's the top of the guided-tour price range, but the 5-star score across six reviews justifies the premium.",
    seo_keywords: ["private bahrain tour with lunch", "bahrain private city tour f1", "bahrain traditional lunch tour", "premium bahrain guided tour 2026", "manama private guide bahrain gp", "bahrain grand prix private experience", "5 star private bahrain tour"],
    f1_windows_label: "Friday Morning (before FP1) · Saturday Morning (before FP3) · Sunday Morning (Race Day)",
  },
  {
    id: 161,
    abstract: "Compact 3-hour cultural tour of northern Manama — Al Fateh Mosque, Bahrain National Museum, Bahrain Fort, and the old souq. Fits any morning or evening gap.",
    f1_context: "Short on time but high on cultural density — this 3-hour Manama circuit is designed for the F1 fan who wants a fast, focused taste of Bahrain without sacrificing an entire morning. The northern Manama route hits Al Fateh Mosque, the National Museum, and the Bahrain Fort, plus the old souq with its perfume and gold vendors. At 3 hours it fits into any of the 6 available session windows across the race weekend, including the Friday and Saturday evening slots after practice. A premium format with personal attention at $110.",
    seo_keywords: ["discover manama 3 hour tour", "short manama cultural tour f1", "bahrain evening activity race weekend", "compact bahrain culture tour", "manama mosque museum fort tour", "3 hour bahrain tour f1 weekend", "bahrain evening session activity"],
    f1_windows_label: "Any Morning or Evening — 6 session windows",
  },
  {
    id: 162,
    abstract: "Cross the King Fahad Causeway into Saudi Arabia and explore Khobar and Dammam's coastline, heritage village, souq, and cultural centre. 7 hours from Bahrain.",
    f1_context: "The King Fahad Causeway is one of the most dramatic drives in the Gulf — a 25km bridge connecting Bahrain to Saudi Arabia over open water. This 7-hour tour takes F1 visitors across the border to explore Khobar's waterfront corniche, Dammam's heritage village, and the ITHRAA Cultural Centre. A cultural double-header that uniquely pairs Bahrain race week with a genuine taste of Saudi Arabia. At $219 it's the premium cross-border option, and the 5-star rating across five reviews suggests the operator handles border logistics seamlessly.",
    seo_keywords: ["king fahad causeway tour bahrain", "bahrain to saudi arabia day trip", "dammam khobar tour from bahrain", "cross border tour bahrain gp", "bahrain saudi day trip race weekend", "khobar corniche tour from manama", "unique bahrain f1 weekend experience"],
    f1_windows_label: "Saturday Morning (before FP3) · Sunday Morning (Race Day)",
  },
  {
    id: 163,
    abstract: "4.5-hour Bahrain cultural tour: UNESCO Pearling Path, Qal'at al-Bahrain Fort, Bab Al Bahrain Souq, and traditional coffee and pastries. 5 stars, $72.",
    f1_context: "An underrated gem in the Bahrain tour catalogue — this 4.5-hour itinerary prioritises depth over breadth. The UNESCO Pearling Path in Muharraq reveals the trading heritage that made Bahrain wealthy before oil, while Qal'at al-Bahrain Fort (Bronze Age to Islamic era) is the island's most archaeologically rich site. Traditional coffee and pastries mid-tour add an authentic culinary beat. At $72 it's accessible and at 4.5 hours it fits the Friday or Saturday morning windows with time to spare. Five-star rated by three verified travellers.",
    seo_keywords: ["bahrain UNESCO pearling path tour", "qalat al bahrain fort UNESCO tour", "bab al bahrain souq tour", "bahrain traditional coffee culture tour", "manama 4 hour culture tour f1", "bahrain cultural heritage tour 2026", "bahrain panoramic tour race weekend"],
    f1_windows_label: "Friday Morning (before FP1) · Saturday Morning (before FP3) · Sunday Morning (Race Day)",
  },
  {
    id: 164,
    abstract: "Full-day Bahrain tour: Al Fateh Mosque, Bahrain Bay, UNESCO Fort, F1 Circuit, Royal Camel Farm, Manama Souq, and King Fahad Causeway in 8 hours. $81.",
    f1_context: "Eight hours is exactly the duration Bahrain GP's race day morning allows (9 hours free before the race). This full-day circuit doesn't cut corners: the Al Fateh Mosque interior, Bahrain Bay skyline, UNESCO Bahrain Fort panorama, F1 Circuit photo stop, Royal Camel Farm encounter, Manama Souq immersion, and a drive across the King Fahad Causeway — all in one day. At $81 the breadth of coverage is exceptional value. Five-star score from a small sample of two reviews warrants monitoring, but the itinerary quality is clearly strong.",
    seo_keywords: ["bahrain full day 8 hour tour", "race day morning activity bahrain", "bahrain causeway f1 circuit tour", "comprehensive bahrain guided tour sunday", "bahrain gp sunday morning activity", "manama full day sightseeing 2026", "bahrain all attractions day tour"],
    f1_windows_label: "Sunday Morning (Race Day)",
  },
  {
    id: 165,
    abstract: "Self-guided 4-hour desert bus tour: Tree of Life, Royal Camel Farm, First Oil Well, F1 Circuit photo stop, and A'Ali traditional pottery. Bahrain for $56.",
    f1_context: "The only self-guided desert heritage tour in Bahrain, this 4-hour bus circuit packs in more F1-relevant stops than most guided alternatives. The Bahrain International Circuit photo opportunity sits alongside the Tree of Life (400 years old, thriving in barren desert) and the Royal Camel Farm. A'Ali Pottery village adds a craft dimension before you loop back. At $56 it's the budget option for the desert loop. The format rewards curious travellers who prefer to move at their own pace. Fits the Friday evening 4-hour window perfectly.",
    seo_keywords: ["tree of life desert tour bahrain", "self guided desert tour bahrain f1", "bahrain circuit camel farm tour", "budget desert tour bahrain", "ali pottery village bahrain tour", "4 hour desert heritage tour bahrain", "bahrain gp desert activity"],
    f1_windows_label: "Friday Morning (before FP1) · Friday Evening (after FP2) · Saturday Morning (before FP3) · Sunday Morning (Race Day)",
  },
  {
    id: 166,
    abstract: "7-hour comprehensive Bahrain tour — 10 attractions including UNESCO sites, the Grand Mosque, Manama Souq, and cultural heritage experiences. $93 from Manama.",
    f1_context: "Ten top attractions in one 7-hour loop — this is the most comprehensive single-day tour in Bahrain for travellers wanting maximum coverage. UNESCO World Heritage Sites are a focus, alongside the Grand Mosque, Manama Souq restaurants, and traditional cultural stops. Operated by Bahrain Fun Tours with 24/7 WhatsApp support, the logistics are handled professionally. The 5-star rating is from a single review, so quality is still being established, but the operator's reputation across other tours in the catalogue is strong. Best suited for Saturday morning before FP3.",
    seo_keywords: ["10 attractions bahrain tour", "comprehensive bahrain city tour 7h", "bahrain UNESCO sites tour f1", "amazing bahrain tour shared", "bahrain fun tours saturday morning", "manama souq culture tour 2026", "bahrain gp 10 sights tour"],
    f1_windows_label: "Saturday Morning (before FP3) · Sunday Morning (Race Day)",
  },
  {
    id: 167,
    abstract: "Bahrain's most affordable city tour at $42 — Al Fateh Mosque, National Museum, Bab Al Bahrain, Bahrain Bay views, and an optional boat ride. 4 hours.",
    f1_context: "The most affordable guided city tour in Bahrain at $42, this half-day circuit covers the essential Manama highlights with an optional Bahrain Bay boat ride that adds a nautical perspective. Al Fateh Mosque, the National Museum, and Bab Al Bahrain Souq are the cultural anchors; The Avenues seaside cafes offer a relaxed final stop. At 4 hours it fits the Friday morning and Friday evening windows equally well. The 4.0 rating from a single review limits confidence, but the price and content make it a strong entry-level choice for F1 visitors.",
    seo_keywords: ["cheap bahrain city tour", "bahrain bay boat ride tour", "al fateh mosque manama affordable tour", "half day bahrain city tour 4h", "bahrain gp budget activity", "manama bay tour friday morning", "affordable bahrain experience f1 2026"],
    f1_windows_label: "Friday Morning (before FP1) · Friday Evening (after FP2) · Saturday Morning (before FP3) · Sunday Morning (Race Day)",
  },
  {
    id: 168,
    abstract: "Private flexible 4-hour Bahrain tour with named local guide Sadeq — ancient ruins, vibrant culture, and Bahraini food on a completely customised itinerary.",
    f1_context: "A genuinely personal Bahrain experience: you travel with a named local guide — Sadeq — in a modern private car, building an itinerary around whatever interests you most. If you want to dig deep into the Dilmun civilisation, Sadeq knows where to go. If you want the food angle, he has restaurants most tourists never find. For F1 visitors who've seen the standard circuit tour highlights on previous race visits, this is the way to discover another layer of Bahrain. The 4-hour format fits morning or evening windows. Photography tips for Instagram moments included.",
    seo_keywords: ["private bahrain tour with local guide", "personalised bahrain tour f1", "bahrain local guide private tour", "customised manama tour race weekend", "flexible bahrain itinerary tour", "unique bahrain private experience 2026", "bahrain gp private guide"],
    f1_windows_label: "Friday Morning (before FP1) · Friday Evening (after FP2) · Saturday Morning (before FP3) · Sunday Morning (Race Day)",
  },
  {
    id: 169,
    abstract: "7-hour Bahrain highlights tour with lunch included — Al Fateh Mosque, National Museum, Royal Camel Farm, Manama Souq, and a drive by the F1 Circuit.",
    f1_context: "This 7-hour itinerary covers every major Bahrain landmark including a drive past the Formula 1 Circuit — the most directly F1-relevant stop in the standard tour catalogue. Royal Camel Farm, Al Fateh Mosque, and the National Museum provide cultural depth, while the included lunch means no time wasted searching for restaurants between stops. The operator clearly knows the circuit given the F1 Circuit inclusion. Best suited to the Saturday morning (7h) or race day Sunday window. A well-priced all-inclusive experience at $90.",
    seo_keywords: ["bahrain city tour with lunch included", "bahrain f1 circuit highlights tour", "7 hour bahrain guided tour saturday", "bahrain national museum camel farm tour", "al fateh mosque f1 circuit visit", "bahrain grand prix saturday morning tour", "guided bahrain highlights with meal"],
    f1_windows_label: "Saturday Morning (before FP3) · Sunday Morning (Race Day)",
  },
  {
    id: 170,
    abstract: "Explore five Manama icons in 5 hours — Al Fateh Mosque, Bahrain Fort (UNESCO), National Museum, Manama Souq, and Bahrain Bay waterfront. $80 with free time.",
    f1_context: "This 5-hour walking and driving tour takes a relaxed approach to Manama: generous time at the Bahrain Bay waterfront for photos, free time at The Avenues mall, and unhurried walks through the Dilmun-era Fort walls. The National Museum's chronological exhibits set the scene before you reach the living culture of Manama Souq. At $80 it sits in the mid-range, with a format that works well for first-time Bahrain visitors. Fits any of the three morning windows across the race weekend. The Bahrain Bay free time makes it particularly popular for photography.",
    seo_keywords: ["discover manama historic modern tour", "bahrain fort UNESCO tour 5 hours", "bahrain bay waterfront tour manama", "manama souq avenues tour 2026", "discover bahrain 5 hour tour race", "bahrain national museum walking tour", "f1 weekend manama sightseeing tour"],
    f1_windows_label: "Friday Morning (before FP1) · Saturday Morning (before FP3) · Sunday Morning (Race Day)",
  },
  {
    id: 171,
    abstract: "8-hour Bahrain city tour: Al Fateh Mosque, National Museum, Souq, Bahrain Fort, Al Areen Wildlife Park, and King Fahd Causeway photo stop. $64 with guide.",
    f1_context: "Eight hours with an English-speaking guide, hotel pickup, and a $64 price tag — this full-day Bahrain circuit is built for race day Sunday (9 hours free before the GP). The itinerary adds Al Areen Wildlife Park and City Centre Mall stops that most tours skip, alongside the standard Grand Mosque, Fort, and Souq landmarks. The King Fahd Causeway photo stop adds a Saudi Arabia border dimension without crossing. A high-value package for the race day morning window at one of the most affordable full-day price points in Bahrain.",
    seo_keywords: ["full day bahrain city tour 8 hours", "bahrain sunday race day activity", "al areen wildlife park bahrain tour", "bahrain tour with guide affordable", "bahrain causeway photo stop tour", "comprehensive bahrain 8 hour tour", "race day activity bahrain gp 2026"],
    f1_windows_label: "Sunday Morning (Race Day)",
  },
  {
    id: 172,
    abstract: "Private 1-hour boat of Manama's skyline — Bahrain Bay views, World Trade Centre, and the Gulf at golden hour or sunset. Perfect for couples and small groups.",
    f1_context: "The only water-based experience on Bahrain's GYG catalogue offers something no land tour can: Manama from the Gulf. The private boat holds up to a small group, making the $308 per-boat rate reasonable when split — around $77-100 per person for a couple or trio. The golden hour and evening slots are the obvious bookings during F1 race week, with the illuminated Bahrain Bay skyline and WTC towers reflecting on the water. At just 1 hour it fits even the tightest session gaps — Friday afternoon (2h between FP1 and FP2) or any evening window post-qualifying.",
    seo_keywords: ["manama skyline boat tour", "bahrain bay boat tour evening", "private boat manama f1 weekend", "bahrain water activity race week", "manama gulf boat ride sunset", "bahrain evening activity from the sea", "bahrain sunset boat tour 2026"],
    f1_windows_label: "Any Session Window — all 8 windows including evenings",
  },
  {
    id: 173,
    abstract: "45-minute guided jewellery-making tour at Al Majarah's Bahrain workshop — watch artisans, meet the founder, and craft your own silver souvenir to take home.",
    f1_context: "Forty-five minutes, $151, and you leave with a handmade silver souvenir from a Bahrain jewellery house. Al Majarah's workshop tour lets you watch the complete craft cycle — 3D design, casting, polishing, and gemstone-setting — before making your own piece under guidance. The founder and designer runs the demonstrations personally. This fits uniquely into the tighter gaps in the F1 schedule: the 2-hour Friday afternoon window between FP1 and FP2, or any evening post-session slot. A distinctive Bahrain souvenir with a story — and a permanent reminder of your Gulf Grand Prix trip.",
    seo_keywords: ["bahrain jewellery making tour", "al majarah jewellers bahrain", "craft silver souvenir bahrain tour", "unique bahrain experience f1 weekend", "bahrain artisan workshop tour", "manama jewellery craftsmanship tour", "short activity bahrain f1 session gap"],
    f1_windows_label: "Any Session Window — all 8 windows from 45 minutes",
  },
];

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT) || 3306,
    user: process.env.DATABASE_USER ?? 'root',
    password: process.env.DATABASE_PASSWORD ?? '',
    database: process.env.DATABASE_NAME ?? 'pitlane',
  });

  console.log(`[seed-bahrain-seo] Connected — updating ${SEO_DATA.length} experiences`);

  for (const row of SEO_DATA) {
    await conn.execute(
      `UPDATE experiences SET
         abstract = ?,
         f1_context = ?,
         seo_keywords = ?,
         f1_windows_label = ?
       WHERE id = ?`,
      [
        row.abstract,
        row.f1_context,
        JSON.stringify(row.seo_keywords),
        row.f1_windows_label,
        row.id,
      ]
    );
    console.log(`  [${row.id}] ${row.abstract.slice(0, 60)}…`);
  }

  await conn.end();
  console.log('\n[seed-bahrain-seo] Done.');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
