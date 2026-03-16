# F1 City Explorer SEO Agent — Persistent Memory

## Melbourne-Specific Knowledge

### Transport
- Trams are free within the Free Tram Zone (CBD). No ticket needed for city center rides.
- Route 1 / Route 96 trams run St Kilda Rd corridor toward Albert Park Circuit.
- Albert Park Circuit is 4.2 km from the CBD — ~15 min by tram, ~10 min by taxi/Uber.
- Laneways tour start points vary by operator but are typically within the Free Tram Zone.

### F1 Race Week Patterns (Australian GP, March)
- Thursday is a free day for fans — ideal for full-day city exploration.
- Friday FP1/FP2 gap (roughly 13:30–16:00 AEDT) is the key 2.5 hr window between sessions.
- Saturday morning before qualifying and Sunday morning before the race are viable for 3-hr activities.
- Melbourne CBD gets noticeably busier Thu–Sun; popular laneways spots fill up by 11am.
- March is early autumn in Melbourne — mild, occasionally rainy, good for walking tours.

### GYG Data Patterns — Melbourne
- GYG food/walking tours for Melbourne consistently return strong ratings (4.7–4.9).
- Laneways food tour (t203662) confirmed at A$130 / 3 hrs / 4.8 rating / 2341 reviews.
- Adult-only (18+) restriction is prominent — must appear in practical info and FAQ.
- Inclusions list for t203662 verified from pipeline input (do not infer additional items).

### SEO Keywords — Melbourne Food/Laneway Tours
- Primary: "Melbourne laneways food tour"
- Secondary: "Melbourne food tour F1 2026", "things to do Melbourne Grand Prix",
  "Melbourne laneway bars", "Melbourne food experience F1 weekend"
- AEO high-value questions: best time to book, adult-only age restriction, fit around F1 sessions

### GYG Data Patterns — Melbourne Balloon (t66946)
- Hot air balloon (t66946): A$379 (disc. from A$595) / 4 hrs total / 1 hr in air / 4.8 rating / 1,245 reviews
- Operates Thursday and Sunday ONLY — key scheduling constraint for F1 race week
- Meeting point: Pullman on the Park Hotel, 192 Wellington Parade, East Melbourne (not a hotel pickup)
- Breakfast NOT included in base ticket — must book upgraded option for buffet breakfast
- ~4:30 AM arrival required — set two alarms, dress in warm non-loose layers, closed-toe shoes
- Weather cancellation risk: recommend Thursday over Sunday for reschedule buffer
- Unique angle: Melbourne is one of the only major cities globally where balloon flight over CBD is legal
- Sunday March 8 race starts 15:00 AEDT — dawn flight finishes well before noon, viable race day option
- Albert Park Circuit visible from balloon at altitude — strong narrative tie-in for F1 audience

### SEO Keywords — Melbourne Balloon
- Primary: "hot air balloon Melbourne", "Melbourne balloon ride"
- Secondary: "balloon over Melbourne CBD", "Melbourne sunrise balloon F1 2026",
  "hot air balloon Melbourne F1 race week", "things to do Melbourne Grand Prix morning"
- AEO high-value questions: legality of CBD flight, weather cancellation policy, F1 timing fit

### GYG Data Patterns — Melbourne Day Trips (Great Ocean Road)
- Great Ocean Road tour (t11856): A$115 / 12 hrs / 4.7 rating / 4,523 reviews
- Max group size 24 — prominent selling point vs large coach tours; always mention
- Food exclusion is the only exclusion — recommend bring own + Apollo Bay as buy option
- Hotel pickup included — strong convenience hook for F1 CBD visitors
- 16 languages audio commentary — relevant USP for international F1 crowd

### SEO Keywords — Melbourne Day Trips (Great Ocean Road)
- Primary: "Great Ocean Road day trip Melbourne", "12 Apostles tour from Melbourne"
- Secondary: "Melbourne F1 day trip", "things to do Melbourne Grand Prix Thursday",
  "Great Ocean Road F1 2026"
- AEO high-value questions: F1 timing (Thursday-only), cost vs self-drive, what's included

### Full-Day Tour F1 Timing Rule (Melbourne)
- Any tour 8+ hours ONLY fits Thursday (no sessions) or Wednesday (pre-race-week arrival day)
- Never suggest Friday–Sunday for full-day tours — all three days have circuit conflicts
- Wednesday arrival framing is a secondary hook for early-arriving race fans
- Sellout risk framing is appropriate for capped-group tours during race week

## Frontend Architecture Patterns (pitlane/frontend)

### Experience List Page — Category Metadata
- `generateMetadata` in `/races/[raceSlug]/experiences/page.tsx` must receive both `params` AND `searchParams`.
- `searchParams` contains `{ category?, window?, sort? }` as a Promise in Next.js 16 App Router.
- Category-specific metadata lives in `CATEGORY_META[race.city][category]` — keyed by `race.city` string (Melbourne, Shanghai, Suzuka).
- Fallback: generic title/description if no city-specific entry found.
- Canonical URL for category pages: append `?category=${category}` to base URL.

### Experience Detail Page — f1Context Fallback
- `exp.f1Context` is populated by the GYG enrichment pipeline but is often null for newer/Japan races.
- Pattern: `resolveF1Context(exp)` helper — returns `exp.f1Context` if set, otherwise assembles from `f1WindowsLabel`, `neighborhood`, `travelMins`, and a category-level fallback string.
- The F1 Weekend Pick callout block now always renders if ANY of those fields are non-null.

### Homepage Top Picks — Link Path
- Top Picks cards must link to `/races/${activeRaceSlug}/experiences/${exp.slug}` (race-scoped canonical).
- Bug: was linking to `/experiences/${exp.slug}` (flat, non-canonical). Fixed Feb 2026.

### generateStaticParams Race Coverage
- Always include all three active races: `['melbourne-2026', 'shanghai-2026', 'japan-2026']`.
- japan-2026 was missing from experience detail page generateStaticParams — fixed Feb 2026.

## General Agent Rules (confirmed across sessions)
- Hours section: OMIT entirely if no scrape data provided. Never generate from training data.
- Prices: copy exactly from input — never convert, round, or estimate.
- Transport routes: only name specific route numbers if verified in input. Otherwise describe the mode.
- Banned vague time words: typically, generally, usually, about, roughly, most days, often.
- AEO blocks: lead with the attraction name + direct answer in sentence 1.
- Do NOT use emojis in output (user preference, confirmed).
- Word count target for f1weekend.co articles: 1500–2000 words (pipeline override of default 3500–5500).
