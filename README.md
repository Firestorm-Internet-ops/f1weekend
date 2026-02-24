# Pitlane — F1 Weekend Companion

F1 race weekend companion app for the 2026 Australian Grand Prix (Melbourne, Mar 5–8).

Live at: [f1weekend.co](https://f1weekend.co)

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS 4 |
| Language | TypeScript 5 |
| ORM | Drizzle ORM |
| Database | TiDB (MySQL-compatible) |
| Cache | Redis (ioredis) |
| Vector DB | Qdrant |
| AI | Anthropic Claude (itinerary generation) |
| Maps | Google Maps (`@react-google-maps/api`) |
| Analytics | Vercel Analytics |

## Features

- **Race schedule** — session timetable with live countdown to lights out
- **Session-gap planning** — curated experience windows that fit between F1 sessions
- **Experiences** — browsable catalogue of Melbourne tours, restaurants, and activities (food, culture, adventure, daytrip, nightlife)
- **Experience map** — Google Maps view of all experiences near Albert Park
- **AI itinerary** — Claude-powered weekend planner that generates a shareable day-by-day itinerary
- **Circuit map** — SVG Albert Park circuit overlay
- **Affiliate tracking** — GetYourGuide partner click tracking

## Pages

| Route | Description |
|---|---|
| `/` | Home — hero, race countdown, schedule + gap cards |
| `/experiences` | Browse curated Melbourne experiences |
| `/experiences/map` | Map view of experiences |
| `/experiences/[slug]` | Individual experience detail |
| `/itinerary` | AI itinerary generator form |
| `/itinerary/[id]` | Shareable itinerary view |
| `/schedule` | Full race schedule |
| `/getting-there` | Transport & logistics |
| `/about` | About |

## API Routes

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/experiences` | List experiences (with filters) |
| `POST` | `/api/itinerary` | Generate AI itinerary |
| `GET` | `/api/itinerary/[id]` | Fetch saved itinerary |
| `POST` | `/api/click` | Track affiliate click |

## Database Schema

Drizzle ORM manages the MySQL schema. Key tables:

- `races` — race metadata (Melbourne 2026)
- `sessions` — F1 session timetable (practice, qualifying, sprint, race)
- `experience_windows` — time slots between sessions when activities fit
- `experiences` — curated Melbourne experiences with GYG enrichment data
- `experience_windows_map` — many-to-many linking experiences to windows
- `itineraries` — AI-generated itineraries (cached by prompt hash)
- `affiliate_clicks` — click attribution tracking
- `schedule_entries` — full race weekend schedule (all series)
- `events` — generic event log

## Getting Started

### Prerequisites

- Node.js 20+
- MySQL 8+ or TiDB
- Redis
- Qdrant (optional — for vector search)

### Install

```bash
cd frontend
npm install
```

### Environment

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

Key variables:

```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=
DATABASE_NAME=pitlane

# Redis
REDIS_URL=redis://localhost:6379

# LLM — 'ollama' for local dev, 'anthropic' for production
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=tinyllama
# ANTHROPIC_API_KEY=sk-ant-...

# Qdrant
QDRANT_URL=http://localhost:6333

# GetYourGuide affiliate
GYG_PARTNER_ID=
GYG_API_KEY=

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Database setup

```bash
# Initialize schema + seed race data
npm run db:init

# Push schema changes
npm run db:push

# Seed experiences
npm run db:seed-experiences
```

### Run

```bash
npm run dev    # development (webpack)
npm run build  # production build
npm run start  # production server
npm run lint   # ESLint
```

## Scripts

Data and enrichment scripts live in `scripts/`:

| Script | Purpose |
|---|---|
| `seed-race.ts` | Seed Melbourne 2026 race + sessions |
| `seed-experiences.ts` | Seed initial experience catalogue |
| `seed-schedule.ts` | Seed full race weekend schedule |
| `enrich-from-gyg.ts` | Pull enrichment data from GYG API |
| `enrich-seo-content.ts` | Generate Claude SEO content for experiences |
| `migrate-*.ts` | Schema migration helpers |

Run any script with:

```bash
npx tsx scripts/<script-name>.ts
```

## Project Structure

```
src/
├── app/                  # Next.js App Router pages + API routes
├── components/
│   ├── experiences/      # Experience card, map, filters
│   ├── itinerary/        # Itinerary form + view
│   ├── layout/           # Nav, Footer
│   └── race/             # Schedule, countdown, circuit map
├── lib/
│   ├── db/               # Drizzle client + schema
│   ├── llm.ts            # LLM abstraction (Ollama / Anthropic)
│   ├── redis.ts          # Redis client
│   └── affiliates.ts     # GYG affiliate URL helpers
├── services/             # Data access layer
│   ├── experience.service.ts
│   ├── itinerary.service.ts
│   ├── race.service.ts
│   └── schedule.service.ts
└── types/                # Shared TypeScript types
```
