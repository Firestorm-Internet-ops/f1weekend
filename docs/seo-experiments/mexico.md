# Mexico City (Mexico City GP, 30 Oct–1 Nov 2026) — `topic-cluster`

**Hypothesis:** a race page that links to focused pages, one per thing people
search before the trip (each linking back and to the others), ranks for more
searches and earns more booking clicks than one long page.

## What changed (only for /races/mexico)
- **Race page (hub):** title "F1 Mexico City 2026: Schedule, Day of the Dead &
  Race Weekend Guide"; a "Plan your Mexico City weekend" block under the byline
  linking the four pages.
- **New pages** (`src/app/races/[raceSlug]/[topic]`, content in
  `src/data/clusters-2026.ts`, unit-tested):
  - `/races/mexico/day-of-the-dead` (lead page): dates, the parade on qualifying
    day, how to see both, where to see Día de Muertos, bookable Day of the Dead
    tours from the live feed. `Event` schema for the parade.
  - `/races/mexico/where-to-stay`: areas by Metro time to the circuit.
  - `/races/mexico/weather-what-to-pack`: weather, altitude, bag rules, packing.
- **Getting There** (existing page) joins the cluster: links to the others.
- Every page: question headings with 40–60-word answers, `FAQPage` +
  `BreadcrumbList` schema, sources and "facts checked" date in the byline, its
  own campaign ID (`f1-mexico-day-of-the-dead`, …), sitemap and llms.txt entries.
- Other races: the new paths are 404s; nothing else changed.

## Keyword research (Ahrefs, US, 30 Sep 2026)
f1weekend.co Domain Rating: **10**.

| Page | Searches it targets | US monthly volume | Difficulty | Who ranks now |
|---|---|---|---|---|
| Day of the Dead | day of the dead mexico city; dia de los muertos mexico city; mexico city day of the dead (parade); day of the dead parade mexico city 2026; when is day of the dead 2026 | 900; 900; 350 (+300); 300; 500 — about **5,000** across all variants | 0–7 | #2 is a DR 12 blog with 2 linking sites: **winnable** |
| Where to stay | where to stay in mexico city; best area to stay in mexico city; best neighborhoods in mexico city; hotel near autodromo hermanos rodriguez | 2,200; 500; 500; 30 | 13; 1; 0; — | Travel blogs (DR 30–56, 50–64 linking sites), Reddit, TripAdvisor: hard, long tail first |
| Weather & packing | mexico city altitude; mexico city weather november / in november; what to wear in mexico city; what to pack for mexico city; f1 bag policy | 13,000; 700 + 450; 350; 100; 100 | 0 (altitude: answered in Google itself) | AccuWeather, US News, TUI for weather: hard; wear/pack: easy |
| Getting there | autodromo hermanos rodriguez; como llegar a autodromo hermanos rodriguez | 800; 30 | 12; — | Existing page |
| Race page | f1 mexico city 2026; f1 mexico schedule; mexico grand prix | 1,100; 700; 2,700 | 12; 0; 28 | "mexico grand prix": F1.com, Wikipedia, ticket sites |

Race-specific trip searches ("hotel near autódromo", "mexico gp weather",
"best seats") are 10–40 a month each: tiny, but ready to book.

## Facts and sources (checked 30 Sep 2026)
- Gran Desfile de Día de Muertos: Sat 31 Oct 2026, 12:00, Puerta de los Leones
  (Chapultepec) → Reforma → Zócalo; free; ~1.5 million watched in 2025
  (Secretaría de Cultura CDMX).
- Alebrijes Monumentales parade 17 Oct; figures on Reforma until 8 Nov
  (Time Out México). Mega Procesión de Catrinas Sun 25 Oct, 18:00
  (El Financiero).
- Circuit access: Metro Line 9 (Velódromo, Ciudad Deportiva, Puebla),
  Metrobús Line 2, Trolleybus Line 2; gates open 08:00 (mexico.gp, F1.com).
- Bag rules: max 10 × 15 × 30 cm, preferably clear; no glass, coolers, drones,
  tripods, professional/video cameras, folding chairs (mexico.gp rules).
- Session times on the pages come from the live F1 timetable.

## Log
| Week | Impr. | Clicks | Avg pos. | Queries | Booking clicks | AI citations | Notes |
|---|---|---|---|---|---|---|---|
| Live from: _(date merged to main)_ | | | | | | | |
