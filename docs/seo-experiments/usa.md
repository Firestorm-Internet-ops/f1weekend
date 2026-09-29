# Austin (United States GP, 23–25 Oct 2026) — `answer-first`

**Hypothesis:** a race page that answers the questions people actually search,
as headings with short direct answers (40–60 words), wins featured snippets,
"People also ask" and AI-answer citations, and so clicks.

## What changed (only on /races/usa)
- Title and meta description built from the questions answered
  ("United States Grand Prix 2026: Start Times, Getting to COTA & Things to Do").
- Under the race header: a question menu, then 7 questions as H2s, each with a
  40–60-word answer (`src/data/answers-2026.ts`, unit-tested for length).
- `FAQPage` schema from exactly these answers; the generic FAQ block is hidden
  on this page (one FAQ schema per page).
- Dates, session times and picks come from live data (calendar, F1 timetable,
  editorial picks), so answers can't go stale. Fixed facts are the circuit's:
  5.513 km, 20 corners, 56 laps, 41 m climb to Turn 1, Elroy ~24 km SE of Austin.

## Questions and the searches behind them (Ahrefs, US, Sept 2026)
| Question on the page | Searches it answers | US monthly volume |
|---|---|---|
| What is COTA, and where is it? | what does cota stand for; what is cota; where is cota race track; where is circuit of the americas; where is the us grand prix | 250; 350; 200; 150+40; 40 |
| What time is the Austin Grand Prix? | what time is the austin grand prix | 100 + 50 |
| How long is the COTA track? | how long is cota (track) | 100 + 80 |
| Where is the best place to watch F1 at COTA? | where to watch f1 austin | 50 |
| How do I get to COTA on race weekend? | how to get to cota; cota shuttle | — |
| Where should I stay for the US Grand Prix? | where to stay for austin grand prix | — |
| What is there to do in Austin during the Grand Prix? | things to do in austin during f1 | — |

(Several "cota" searches are about occupational therapy or the Austin bus
network; those were left out.)

## Log
| Week | Impr. | Clicks | Avg pos. | Queries | Booking clicks | AI citations | Notes |
|---|---|---|---|---|---|---|---|
| Live from: _(date merged to main)_ | | | | | | | |
