# SEO experiments — autumn 2026

**Goal:** choose one SEO/AEO technique for the 2027 race pages using the last
seven races of 2026. Each race tests **one** idea; everything else on the pages
(experiences feed, schedule, planner, design) is identical, so differences come
from the technique. Config: `src/data/seo-experiments.ts`.

## The experiments

| Race | Weekend | Variant | Hypothesis | Doc |
|---|---|---|---|---|
| Singapore | 9–11 Oct | `control` | Baseline: the standard page, unchanged | [singapore.md](singapore.md) |
| Austin | 23–25 Oct | `answer-first` | Real search questions as headings with 40–60-word direct answers win snippets, AI citations and clicks | [usa.md](usa.md) |
| Mexico City | 30 Oct–1 Nov | `topic-cluster` | Several focused pages (Day of the Dead, where to stay, getting there, weather & packing) beat one page | [mexico.md](mexico.md) |
| São Paulo | 6–8 Nov | `unique-data` | Original data (prices across sites, travel times, gap fits) earns rankings | [brazil.md](brazil.md) |
| Las Vegas | 19–21 Nov | `expert-guide` | Depth + trust (sources, author, last verified) helps | [las-vegas.md](las-vegas.md) |
| Qatar | 27–29 Nov | `freshness` | Weekly-updated pages get recrawled and ranked sooner | [qatar.md](qatar.md) |
| Abu Dhabi | 4–6 Dec | `validation` | The best two ideas combined confirm the 2027 template | [abu-dhabi.md](abu-dhabi.md) |

## How we measure (same for every race)

Window: from the day a variant is **live on production** to 3 days after its race.
Numbers are logged weekly in each race doc.

| Metric | Source | Why |
|---|---|---|
| Impressions, clicks, average position, queries ranked | Google Search Console (via Ahrefs `gsc-*`), filtered to `/races/<key>` pages | Visibility; clicks alone are too few to compare |
| **Share of demand** = clicks ÷ monthly searches for the race's keyword set | Search Console + Ahrefs keyword volumes | Makes Las Vegas (big) and Qatar (small) comparable |
| Booking clicks and bookings | `affiliate_clicks` + partner reports, split by campaign `f1-<race>-<page>` | Money, per race and page |
| AI citations | Ahrefs Brand Radar (AI responses citing f1weekend.co) | Answer-engine visibility (GEO/AEO) |
| Time to index / first ranking | Search Console URL inspection, `gsc-page-history` | Speed |

Keyword sets per race are listed in each race doc (from Ahrefs, US market, plus
the host country where relevant).

## Honest limits
- Traffic is small (the site is recovering from duplicate pages and link spam),
  so results are **directional**, not statistically significant. Early signals
  (impressions, positions, queries, AI citations) carry more weight than clicks.
- Races differ in demand and in how long each page has to rank; share of demand
  and the per-day metrics correct for part of that. Singapore is the control.
- Site-wide changes during the test (recrawl, disavow taking effect) lift every
  race; compare races with each other, not with the past.

## Scorecard (filled in after each race)

| Race | Variant | Live from | Days live | Impr. | Clicks | Share of demand | Avg pos. | Queries | Booking clicks | AI citations | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Singapore | control | | | | | | | | | | |
| Austin | answer-first | 30 Sep | | | | | | | | | |
| Mexico City | topic-cluster | | | | | | | | | | |
| São Paulo | unique-data | | | | | | | | | | |
| Las Vegas | expert-guide | | | | | | | | | | |
| Qatar | freshness | | | | | | | | | | |
| Abu Dhabi | validation | | | | | | | | | | |

After Abu Dhabi: [2027-playbook.md](2027-playbook.md).
