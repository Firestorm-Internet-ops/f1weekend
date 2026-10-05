# São Paulo (São Paulo GP, 6–8 Nov 2026) — `unique-data`

**Hypothesis:** a race page that publishes data nobody else has (race-day
weather history, a form guide, travel times, a tour price guide and a
session-gap planner) earns rankings and AI citations that copied text cannot.

## What changed (only on /races/brazil)
- Title: "São Paulo Grand Prix 2026: Interlagos Weather, Form Guide & Getting There".
- Under the byline (`src/components/race/UniqueData.tsx`, maths in
  `src/lib/unique-data.ts`, sources in `src/services/race-stats.service.ts`):
  - **At a glance**: 4–5 quotable one-line facts computed from the data below.
  - **Will it rain at Interlagos on race day?** Rain and temperatures on each of
    the last 10 race days (Open-Meteo archive at the circuit), with the winner;
    the race-weekend forecast once it's within 16 days.
  - **Who is in form?** Top-5 drivers and teams (Jolpica), the last 3 race
    winners and wins by team at Interlagos (last 10 races). Labelled as history,
    not a prediction (new 2026 cars).
  - **How long does it take to get to Interlagos?** Train vs car from Pinheiros,
    Brooklin, Paulista, Jardins, Vila Madalena and both airports
    (`src/data/unique-data-2026.ts`).
  - **How much do tours cost?** Typical "from" price and middle-half range per
    kind of tour, from the live GetYourGuide/Viator/Tiqets listings.
  - **What can you do between sessions?** Per free slot of the weekend: how
    many tours fit and the best three, bookable.
- The cross-site *price comparison* first planned was dropped: only 1 São Paulo
  tour is sold on more than one site (no Tiqets in São Paulo), so it became a
  price guide.

## Keyword research (Ahrefs, US, 2 Oct 2026)
| Search | US monthly | Difficulty | Notes |
|---|---|---|---|
| f1 brazil · sao paulo grand prix · brazilian grand prix | 3,700 · 2,600 · 1,700 | 35 · 28 · 30 | F1.com and big sites own these |
| interlagos · interlagos circuit | 1,700 · 450 | 22 · 12 | Possible |
| f1 brazil schedule · f1 brazil qualifying | 800 · 600 | 27 · 9 | We have the schedule |
| **interlagos weather** (+ sao paulo grand prix weather, f1 brazil weather, forecast variants) | **450 + ~500** | **0** | **Main target: almost no competition** |
| brazil f1 track · sao paulo f1 track | 300 · 90 | 0 · 10 | Easy |
| things to do in sao paulo | 1,900 | 3 | Live tours section |
| f1 standings (for reference) | 233,000 | — | Owned by F1.com/ESPN; standings are for readers and AI answers, not ranking |

## Data checked (2 Oct 2026)
- Standings after round 15 (Jolpica): Antonelli 302, Russell 236, Hamilton 199;
  Mercedes 538, Ferrari 378, McLaren 306. Last 3 races won by Mercedes.
- Interlagos winners 2015–2025: Mercedes 5, Red Bull 3, Ferrari 1, McLaren 1.
- Race-day rain (Open-Meteo): 5 of the last 10 race days ≥ 1 mm; downpours in
  2016 (17.0 mm) and 2024 (17.9 mm), both remembered as wet races.
- Travel: CPTM Line 9 Pinheiros → Autódromo about 30 min; station ~600 m from
  the gate; Congonhas 14 km, Guarulhos 48 km (official mobility guide, CPTM).

## Log
| Week | Impr. | Clicks | Avg pos. | Queries | Booking clicks | AI citations | Notes |
|---|---|---|---|---|---|---|---|
| Live from: 5 Oct 2026 (released to main with the sitemap update; baseline: 0 GSC clicks site-wide in the 30 days before) | | | | | | | |
