# f1weekend — Claude Code Context

## What This Is
Formula 1 experience discovery and SEO content platform. F1 fans visit to find GYG tours/experiences for race weekends, book via affiliate links, and read editorial race guides. SEO/AEO is core — content must rank on Google and answer engines.

## Stack
- **Framework**: Next.js 15 (App Router), TypeScript
- **Database**: PostgreSQL via Drizzle ORM (`drizzle/schema.ts`, `drizzle.config.ts`)
- **Cache**: Redis (`src/lib/redis.ts`)
- **Payments**: Stripe (`src/lib/stripe.ts`)
- **GYG client**: `src/lib/gyg-client.ts`
- **Booking providers**: `src/lib/providers/` — GetYourGuide, Viator, Tiqets. Offers per experience live in `experience_offers`; `/api/click` picks the offer and builds the provider's affiliate link
- **AI**: `@anthropic-ai/sdk` for content enrichment

## Key Directories
```
src/services/          Business logic (experience-service, race-service, seo-service)
src/components/        React components (hero/, cards/, forms/, modals/)
src/lib/               Utilities (db, redis, gyg-client, stripe)
src/app/[race]/        Dynamic race detail pages
scripts/               38+ pipeline scripts — fetch, seed, enrich, patch
drizzle/               DB schema + migrations
```

## Branching & Release Workflow (always follow)
Only three branches exist at any time: `main`, `staging`, and one `feature/<short-description>` branch.

1. **Feature branch**: create from `main` with a descriptive name (e.g. `feature/nearby-activities-filter`). All coding happens here. Test it fully, bottom up, before moving on.
2. **Feature → `staging`**: open a PR into `staging`, merge it, then **delete the feature branch**. `staging` is what the Vercel staging/preview environment shows; the user verifies it there.
3. **`staging` → `main`**: only after the user confirms staging looks right. `main` is production (f1weekend.co).

Never push or merge directly to `main`. Never keep more than one feature branch alive.

Vercel only builds `main` (production) and `staging` (staging.f1weekend.co) — `vercel.json` `ignoreCommand` skips every other branch. Test feature work locally, then on staging.

**2026 calendar**: `src/data/calendar-2026.ts` is the source of truth for race order, dates and moved venues (Bahrain GP → Sepang); `race.service` applies it over the `races` table, and the home page leads with the next race. F1 session times for upcoming races come from Jolpica (`src/lib/jolpica.ts`, api.jolpi.ca, cached 12 h) unless a full timetable is in `src/data/timetables-2026.ts`. Races flagged `liveExperiences` (Bahrain/Sepang and every race after it) show GetYourGuide + Viator + Tiqets products live around the circuit (`services/nearby-feed.service.ts`, `components/experiences/NearbyFeed.tsx`) instead of the database list.

## Common Dev Commands
```bash
npm run dev            # Start dev server
npx drizzle-kit push   # Push schema changes to DB
npx drizzle-kit studio # Browse database
```

## Common Tasks — Which Script to Use
| Task | Script |
|---|---|
| Add a new F1 race | `scripts/seed-race-content.ts` |
| Fetch GYG experiences for a race | `scripts/enrich-from-gyg.ts` |
| Generate SEO content | `scripts/enrich-seo-content.ts` |
| Generate guide articles | `scripts/generate-guide-articles.ts` |
| Fix session data | `scripts/patch-*.ts` |
| Create the multi-provider offers table (once) | `npm run db:migrate-offers` |
| Fetch + match Viator/Tiqets offers for a race | `npm run offers:fetch -- --race <slug>` |
| Change race dates / venue / order | `src/data/calendar-2026.ts`, then `npm run db:sync-calendar` |
| Track image for a moved venue | add the file under `public/tracks/` named in the calendar entry (`trackImage`) |
| Weekend timetable for a race not in the DB | `src/data/timetables-2026.ts` (wins over stored sessions) |
| Check calendar/timetables against F1 (Jolpica) | open `/api/schedule-check` on staging |

## Data Pipeline (`pipeline/`)
Self-contained Python pipeline that fetches GYG experiences and seeds the f1weekend DB.

```bash
cd f1weekend/pipeline && python main.py --race monaco-2026
cd f1weekend/pipeline && python main.py --race monaco-2026 --start-over
```

- Race configs: `pipeline/races/*.toml` — copy `_template.toml` to add a new race
- Shared modules: `getyourguideapi/shared/` (gyg_client, experience_ranker, etc.)
- DB seeder: `pipeline/db_seeder.py`
- Content AI: `pipeline/content_generator.py` (Gemini)

## Agents Available (in `.claude/agents/`)
- `f1-seo` — rank and score GYG experiences for F1 relevance
- `seo-aeo-geo-strategist` — generate race guide editorial content
- `f1-city-explorer-seo` — generate SEO attraction guide articles
- `f1-reel-scriptwriter` — Instagram Reel scripts with F1 energy
- `ui-design-auditor` — UI/UX design review (inherited from root)

## Pitfalls
- Redis must be running locally (`brew services start redis`)
- Prod DB needs Cloud SQL Auth Proxy — use `.env.cloudsql` config
- GYG enrichment uses Claude API — set `ANTHROPIC_API_KEY` in `.env`

## Docs
Full codebase reference: `../docs/F1WEEKEND-CODEBASE.md`
