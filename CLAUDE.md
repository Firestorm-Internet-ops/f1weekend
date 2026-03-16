# f1weekend — Claude Code Context

## What This Is
Formula 1 experience discovery and SEO content platform. F1 fans visit to find GYG tours/experiences for race weekends, book via affiliate links, and read editorial race guides. SEO/AEO is core — content must rank on Google and answer engines.

## Stack
- **Framework**: Next.js 15 (App Router), TypeScript
- **Database**: PostgreSQL via Drizzle ORM (`drizzle/schema.ts`, `drizzle.config.ts`)
- **Cache**: Redis (`src/lib/redis.ts`)
- **Payments**: Stripe (`src/lib/stripe.ts`)
- **GYG client**: `src/lib/gyg-client.ts`
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
