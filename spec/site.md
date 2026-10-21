# SEO loop for f1weekend.co

## Goal

Every Monday, read f1weekend.co's Google Search Console data, find the searches where a page already shows up but is not winning, and open or update one GitHub issue per page with what to fix. From an issue, a command drafts short answer blocks for that page with Claude, checks them against a QA gate (made-up numbers, length, reading level, AI tells) and saves them as unapproved drafts; a person approves them by editing the JSON in a PR, and only then do they show on the page.

Out of scope: auto-publishing anything (every draft needs a named approver); Google's Indexing API (it is only for job postings and livestreams); GA4 (access is still pending; booking clicks come from our own `affiliate_clicks` table instead); the homepage and other non-race pages as draft targets (they get issues, not drafts); FAQ schema for the new answers; Linear; changing any page of a race in the autumn SEO experiment before 7 Dec 2026.

Test command: `npx tsx --test tests/seo-loop/*.test.ts`

Setup command: `npm ci --no-audit --no-fund`

Preview: none. The only UI is one answer block (step 9). Its show/hide rule is unit-tested in `tests/seo-loop/publish.test.ts`; the page itself needs the database and Redis, so it is checked on staging.f1weekend.co after the PR into `staging`, not in a local preview.

Regression check (must stay green, run it before every commit): `npm run test:providers` (107 tests on 21 Oct 2026).

## Context the builder needs

- Search Console data is thin: 112 query/page rows in 90 days, 0 clicks, positions mostly 60–90. Thresholds below are set for that (3 impressions minimum), on purpose. The real export is in `tests/fixtures/gsc-2026-07-20_2026-10-19.json` and `tests/seo-loop/run.test.ts` pins the result on it.
- Most impressions still land on old addresses like `/races/belgium-2026/getting-there`. `next.config.ts` redirects `/races/<key>-<year>/...` to `/races/<key>/...` (the race segment only, never the experience slug). Paths must be normalised the same way before anything is counted.
- The service account `ga4-reader@gen-lang-client-0822624926.iam.gserviceaccount.com` has Restricted (read-only) access to the Search Console property `https://f1weekend.co/`. Its key goes in the env var `GOOGLE_SA_KEY` (the whole JSON as one string) on Vercel staging. Never commit it.
- SEO experiment (`src/data/seo-experiments.ts`): the races listed there (singapore, usa, mexico, brazil, las-vegas, qatar, abu-dhabi) must not change until the verdict on 7 Dec 2026. Issues may be opened for them, marked blocked; drafts and published answers may not.
- House style for tests and code: `node:test` + `node:assert/strict`, run with `tsx`; pure logic in `src/lib/`, DB access in `src/services/`, routes in `src/app/api/`. Tests import with relative paths.
- Existing pieces to reuse, not rewrite: `isBot`, `isInternalSession` and the `ClickRow` type from `src/lib/click-stats.ts`; `loadClicks` from `src/services/click-stats.service.ts`; `CALENDAR_2026` from `src/data/calendar-2026.ts`; `raceKey` from `src/lib/race-url.ts`; `SEO_EXPERIMENTS` from `src/data/seo-experiments.ts`; `generateText` from `src/lib/llm.ts`.

## Modules and exports the tests import

| Module | Exports |
|---|---|
| `src/lib/seo-loop/paths.ts` | `normalizePath(urlOrPath: string \| null): string \| null` |
| `src/lib/seo-loop/rows.ts` | `type GscRow`, `type SearchRow`, `mergeRows(rows: GscRow[]): SearchRow[]` |
| `src/lib/seo-loop/opportunities.ts` | `type OpportunityType`, `type Opportunity`, `type LoopContext`, `type PageTicket`, `expectedCtr`, `classify`, `raceKeyOfPath`, `findOpportunities`, `pageTickets` |
| `src/lib/seo-loop/publish.ts` | `EXPERIMENT_VERDICT_DATE`, `experimentLockUntil`, `type LoopAnswer`, `publishedAnswers` |
| `src/lib/seo-loop/ticket.ts` | `ticketKey`, `renderIssue`, `planIssueActions` |
| `src/lib/seo-loop/brief.ts` | `type RaceFacts`, `type Brief`, `weekendFact`, `buildBrief` |
| `src/lib/seo-loop/qa.ts` | `type DraftAnswer`, `numbersIn`, `readingGrade`, `checkAnswers` |
| `src/lib/seo-loop/draft.ts` | `parseDraft`, `draftAnswers` |
| `src/lib/gsc.ts` | `searchWindow`, `fetchSearchRows` |
| `src/lib/indexnow.ts` | `INDEXNOW_KEY`, `indexNowBody`, `submitIndexNow` |
| `src/lib/seo-loop/run.ts` | `bookingClicksByPath`, `runLoop` |

## Files the builder may create or change

- Create: everything under `src/lib/seo-loop/`; `src/lib/gsc.ts`; `src/lib/google-auth.ts`; `src/lib/indexnow.ts`; `public/<INDEXNOW_KEY>.txt`; `src/data/seo-loop-facts.ts`; `src/data/seo-loop-answers.json`; `src/components/race/LoopAnswers.tsx`; `src/app/api/seo-loop/route.ts`; `scripts/seo-loop.ts`; `scripts/seo-draft.ts`; `scripts/indexnow.ts`; `.github/workflows/seo-loop.yml`.
- Change: `package.json` (three scripts and the `google-auth-library` dependency, nothing else); `src/app/races/[raceSlug]/page.tsx` and `src/app/races/[raceSlug]/getting-there/page.tsx` (one `<LoopAnswers path=… />` each); `docs/` (step 11).
- Do not change: anything in `tests/`, `src/data/seo-experiments.ts`, any other page, `next.config.ts`, the database schema.

## Build order (bottom up; do not start a layer until the one below is green)

### Layer 1: pure logic, no network

**Step 1. `paths.ts`, `normalizePath`** (`tests/seo-loop/paths.test.ts`)
- Accepts a full URL or a bare path. Host must be `f1weekend.co` or `www.f1weekend.co`, anything else (staging included) returns `null`; so do `null` and `''`.
- Drops query string, hash, trailing slash (root stays `/`).
- Rewrites `/races/<key>-<4-digit year>` to `/races/<key>` in the race segment only, with the same pattern as `next.config.ts` (`[a-z][a-z-]*[a-z]` then `-20\d\d`). The rest of the path is untouched.

**Step 2. `rows.ts`, `mergeRows`** (`tests/seo-loop/rows.test.ts`)
- `GscRow` is the Search Console API row: `{ keys: [query, page], clicks, impressions, ctr, position }`. `SearchRow` is `{ query, path, impressions, clicks, position }`.
- Query is trimmed and lower-cased; page goes through `normalizePath`; rows with a `null` path or 0 impressions are dropped.
- Rows with the same query and path merge: impressions and clicks add up, position is the impression-weighted mean.
- Sorted by impressions, highest first.

**Step 3. `publish.ts`, the experiment lock and the show rule** (`tests/seo-loop/publish.test.ts`)
- `EXPERIMENT_VERDICT_DATE = '2026-12-07'`.
- `experimentLockUntil(raceKey | null, now)`: if `raceKey` is a key of `SEO_EXPERIMENTS` and `now` is before `2026-12-07T00:00:00Z`, return `'2026-12-07'`; otherwise `null`. Read the keys from `SEO_EXPERIMENTS`, do not copy the list.
- `LoopAnswer` is `{ path, id, q, a, searches: string[], approved: boolean, approvedBy: string | null, drafted: 'YYYY-MM-DD' }`.
- `publishedAnswers(path, answers, now)`: answers for exactly that path, `approved === true`, a non-empty `approvedBy`, and the path's race not locked (race key from `raceKeyOfPath`).

**Step 4. `opportunities.ts`** (`tests/seo-loop/opportunities.test.ts`)
- `expectedCtr(position)`: by `Math.round(position)`: 1 → 0.28, 2 → 0.15, 3 → 0.10, 4 → 0.07, 5 → 0.05, 6–10 → 0.03, above 10 → 0.01.
- `classify(row)`: fewer than 3 impressions → `null`. Position ≤ 10: `'low-ctr'` if impressions ≥ 20 and clicks/impressions < 0.5 × `expectedCtr`, else `null`. Position > 10 and ≤ 30 → `'striking-distance'`. Above 30 → `'weak-match'`.
- `raceKeyOfPath(path)`: `/races/<key>` or `/races/<key>/...` → `<key>`, else `null`.
- `findOpportunities(rows, ctx)` where `ctx = { now, raceDates: Record<raceKey, 'YYYY-MM-DD'>, bookingClicks: Record<path, number> }`:
  - A query with 3+ impressions on two or more of our paths makes each of those rows `'cannibalised'` (this replaces its own type). Rows under 3 impressions are not counted towards this and are not opportunities.
  - Every other row takes `classify`; `null` is left out.
  - `score = impressions × weight × soon × booked`. Weight: low-ctr 3, striking-distance 2, cannibalised 1.5, weak-match 1. `soon` = 2 when the path's race date is on or after `now` and at most 60 days later, else 1 (past races get no boost: they come back next year, they are not dead). `booked` = 2 when `bookingClicks[path] > 0`, else 1.
  - Sorted by score, highest first; ties by path, then query, alphabetically.
- `PageTicket` is `{ path, raceKey, score, blockedUntil, opportunities }`. `pageTickets(opps, now)`: one per path, score is the sum, opportunities sorted as above, `blockedUntil = experimentLockUntil(raceKey, now)`. Tickets sorted by score, ties by path.

**Step 5. `ticket.ts`** (`tests/seo-loop/ticket.test.ts`)
- `ticketKey(path)` = `seo-loop:<path>`.
- `renderIssue(ticket)` returns `{ title, body, labels: ['seo-loop'] }`. Title: `SEO loop: <path> (<n> searches)`, `1 search` when n is 1. Body, in this order: the hidden line `<!-- seo-loop:<path> -->`; the live link `https://f1weekend.co<path>`; a Markdown table `| Search | Type | Impressions | Clicks | Position |` with one row per opportunity, position to 1 decimal; then either `Blocked until <date> (SEO experiment)` or the line `npm run seo:draft -- --path <path>`.
- `planIssueActions(openIssues: { number, body }[], tickets)`: for each ticket in order, `{ action: 'update', number, ticket }` if an open issue's body contains the exact hidden line `<!-- seo-loop:<path> -->`, else `{ action: 'create', ticket }`. Match the whole hidden line, so `/races/belgium` never matches `/races/belgium/getting-there`.

**Step 6. `brief.ts`** (`tests/seo-loop/brief.test.ts`)
- `RaceFacts` is `{ raceKey, raceName, season, startDate, raceDate, facts: string[] }`.
- `weekendFact(r)`: `The <season> <raceName> weekend is <d1>–<d2> <Month> <year>.`; when the months differ, `<d1> <Month1>–<d2> <Month2> <year>.` Days without a leading zero, English month names, en dash.
- `buildBrief(ticket, facts)` returns `{ path, raceKey, queries, facts, allowedNumbers, prompt }`. It throws `/blocked/i` when `ticket.blockedUntil` is set and `/race/i` when `ticket.raceKey !== facts.raceKey`.
  - `queries`: the 5 opportunities with the most impressions, in that order.
  - `facts`: `weekendFact` first, then `facts.facts` in order.
  - `allowedNumbers`: `numbersIn` of every fact, unique, sorted as strings.
  - `prompt` contains each query as a line `- <query>`, each fact verbatim, and the rules the QA gate checks: 1–5 answers; each answer 40–60 words; use only the numbers in the facts; no em dashes; plain words for a grade-8 reader; the banned phrases; reply with a JSON array of `{ id, q, a, searches }` only.

**Step 7. `qa.ts`** (`tests/seo-loop/qa.test.ts`)
- `numbersIn(text)`: matches of `/\d+(?:[.,:]\d+)*/g`, with thousands commas removed (`1,666` → `1666`); decimals and times are kept (`7.004`, `4:30`). Order of appearance.
- `readingGrade(text)`: Flesch-Kincaid grade, `0.39 × words/sentences + 11.8 × syllables/words − 15.59`. Words: whitespace-split tokens that contain a letter or digit. Sentences: pieces split on `[.!?]+` followed by whitespace or the end, at least 1. Syllables per word: lower-case, keep letters only (accented letters count as vowels when they are vowels), count groups of `[aeiouy]` and accented vowels, minus 1 if the word ends in `e` and has more than one group, at least 1; a token with no letters counts 1.
- `checkAnswers(answers, brief)` returns `{ ok, problems }`; `ok` is `problems.length === 0`. Each problem is `<id>: <code> <detail>`, with `all` as the id for whole-draft problems. Codes and rules:
  - `count`: 1–5 answers, exact text `all: count <n> (need 1–5)`.
  - `id`: kebab-case `/^[a-z0-9]+(-[a-z0-9]+)*$/` and unique.
  - `question`: `q` ends with `?` and is at most 90 characters.
  - `words`: `a` is 40–60 words (same word rule as `readingGrade`), detail starts with the count.
  - `number`: every number in `q` and `a` is in `brief.allowedNumbers`, one problem per bad number, detail starts with the number (`number 65 …`).
  - `dash`: `a` or `q` contains `—`, or ` – ` (en dash with spaces). An unspaced en dash in `24–26` is fine.
  - `phrase`: case-insensitive, any of: `delve`, `nestled`, `tapestry`, `unforgettable`, `look no further`, `whether you're`, `in today's`, `embark`, `bustling`, `vibrant`, `game-changer`, `it's worth noting`.
  - `searches`: non-empty, and every item is one of `brief.queries`.
  - `grade`: `readingGrade(a)` above 10.

**Step 8. `draft.ts`** (`tests/seo-loop/draft.test.ts`)
- `parseDraft(text)`: if the text contains a ```` ```json ```` fence, parse what is inside; else parse the whole text. It throws when the JSON is invalid or is not an array (message includes `array`).
- `draftAnswers(brief, generate, { maxAttempts = 3 } = {})` with `generate: (prompt: string) => Promise<string>`. Attempt 1 sends `brief.prompt` unchanged. A failed attempt (parse error = problem `all: json <message>`, or QA problems) sends `brief.prompt` + `\n\nYour last draft failed these checks:\n- <problem>` (one line each) on the next attempt. Returns `{ status: 'passed' | 'failed', answers, attempts, problems }`, stopping at the first pass or after `maxAttempts`.

### Layer 2: integration (network mocked in tests)

**Step 9a. `gsc.ts`** (`tests/seo-loop/gsc.test.ts`)
- `searchWindow(now, days = 28)`: `endDate` is 3 days before `now` (UTC date), `startDate` is `days − 1` days before that.
- `fetchSearchRows({ siteUrl, startDate, endDate, accessToken, fetch = globalThis.fetch })`: POST to `https://www.googleapis.com/webmasters/v3/sites/<encodeURIComponent(siteUrl)>/searchAnalytics/query`, `Authorization: Bearer <token>`, JSON body `{ startDate, endDate, dimensions: ['query','page'], rowLimit: 25000, startRow }`. A page of exactly 25,000 rows asks for the next one. No `rows` key = `[]`. A non-2xx status throws with the status in the message.

**Step 9b. `google-auth.ts`** (no unit test; verified live, see "Done")
- `searchConsoleToken(): Promise<string>`: reads `GOOGLE_SA_KEY` (JSON string), uses `google-auth-library`'s `JWT` with scope `https://www.googleapis.com/auth/webmasters.readonly`, returns the access token. Throws a clear error when the variable is missing.

**Step 9c. `indexnow.ts`** (`tests/seo-loop/indexnow.test.ts`)
- `INDEXNOW_KEY`: a new random 32-character lower-case hex string, and `public/<key>.txt` containing exactly that key.
- `indexNowBody(urls)`: each URL through `normalizePath`, others dropped, de-duplicated in first-seen order, made absolute on `https://f1weekend.co`. Returns `{ host: 'f1weekend.co', key, keyLocation: 'https://f1weekend.co/<key>.txt', urlList }`, `null` when the list is empty, throws when there are more than 10,000.
- `submitIndexNow(body, fetch = globalThis.fetch)`: POST JSON (`content-type: application/json; charset=utf-8`) to `https://api.indexnow.org/indexnow`; returns the status for 200 and 202, throws with the status for anything else.

**Step 10. `run.ts`** (`tests/seo-loop/run.test.ts`)
- `bookingClicksByPath(rows: ClickRow[])`: counts clicks per `normalizePath(referer)`, skipping `isBot(userAgent)`, `isInternalSession(sessionId)` and `null` paths.
- `runLoop({ gscRows, clickRows, raceDates, now })` = `pageTickets(findOpportunities(mergeRows(gscRows), { now, raceDates, bookingClicks: bookingClicksByPath(clickRows) }), now)`.
- On the real fixture it must give exactly the 8 tickets and scores pinned in the test, Belgium "Getting there" first with 66.

### Layer 3: wiring (no new unit tests; each has a check in "Done")

**Step 11. Route, scripts, workflow, facts, answers, block, docs**
- `src/app/api/seo-loop/route.ts`, `GET`: 404 on production (`VERCEL_ENV === 'production'`), like `/stats`. On staging: Search Console token, `searchWindow(now)`, `fetchSearchRows` for `https://f1weekend.co/`, `loadClicks` for the last 90 days, `raceDates` from `CALENDAR_2026` keyed by `raceKey(slug)`, then `runLoop`. Responds `{ window, tickets, issues: tickets.map(renderIssue) }` with `Cache-Control: no-store` and `X-Robots-Tag: noindex, nofollow`. Errors respond 500 with the message.
- `scripts/seo-loop.ts` (`npm run seo:loop`, `-- --dry-run`): GETs `https://staging.f1weekend.co/api/seo-loop`; dry run prints each rendered issue and stops. Otherwise it lists open issues labelled `seo-loop` with the GitHub REST API (`GITHUB_TOKEN`, `GITHUB_REPOSITORY`), runs `planIssueActions`, then creates or PATCHes the body of each issue. It never closes issues.
- `.github/workflows/seo-loop.yml`: Mondays `0 3 * * 1` (08:30 IST) plus `workflow_dispatch`; `permissions: contents: read, issues: write`; checkout, Node 22, `npm ci`, `npx tsx scripts/seo-loop.ts`.
- `src/data/seo-loop-facts.ts`: `SEO_LOOP_FACTS: Record<raceKey, string[]>`, written and sourced by a person (comment with the source URL above each fact). Start with `belgium` only, using facts from the existing Belgium getting-there page and its sources. Never generated by the model.
- `scripts/seo-draft.ts` (`npm run seo:draft -- --path <path>`): refuses non-race paths and locked races; builds `RaceFacts` from `CALENDAR_2026` and `SEO_LOOP_FACTS` (refuses when the race has no facts); fetches that page's ticket from the staging route; `draftAnswers` with `generateText`; on `passed`, appends the answers to `src/data/seo-loop-answers.json` with `approved: false`, `approvedBy: null`, `drafted: <today>`; on `failed`, prints the problems and writes nothing.
- `src/data/seo-loop-answers.json`: starts as `[]`.
- `src/components/race/LoopAnswers.tsx`: server component, `publishedAnswers(path, answers, new Date())`; renders nothing when empty, else a section "Quick answers" with each `q` as an `h2` (anchor `id`) and `a` as a paragraph, styled like the answer-first blocks on `/races/usa`. No JSON-LD.
- Add `<LoopAnswers path="/races/<key>" />` to the race page and `<LoopAnswers path="/races/<key>/getting-there" />` to the getting-there page, at the end of the main content.
- `scripts/indexnow.ts` (`npm run indexnow -- <path or URL> ...`): `indexNowBody` then `submitIndexNow`, prints the status.
- `package.json`: scripts `seo:loop`, `seo:draft`, `indexnow` (all `tsx --env-file-if-exists=.env scripts/<name>.ts`), dependency `google-auth-library`.
- Docs: add a section to `docs/seo-experiments/README.md` saying the loop exists, that it is blocked on experiment races until 7 Dec, and how to approve a draft (set `approved: true` and `approvedBy` to your author slug in a PR).

## Done means

1. `npx tsx --test tests/seo-loop/*.test.ts`: every test passes, none skipped, none edited.
2. `npm run test:providers`: still 107 passing.
3. `npx tsc --noEmit` and `npm run lint` clean for the new and changed files.
4. `npm run build` succeeds.
5. Live check of step 9b, run locally with the key in `.env`: `npx tsx --env-file=.env -e "import('./src/lib/google-auth.ts').then(async m => { const { fetchSearchRows, searchWindow } = await import('./src/lib/gsc.ts'); const rows = await fetchSearchRows({ siteUrl: 'https://f1weekend.co/', ...searchWindow(new Date()), accessToken: await m.searchConsoleToken() }); console.log(rows.length) })"` prints a number above 0.
6. After the PR into `staging`: `https://staging.f1weekend.co/api/seo-loop` returns tickets; `https://f1weekend.co/api/seo-loop` returns 404 (once released); `npm run seo:loop -- --dry-run` prints issues; no race page shows a "Quick answers" section, because nothing is approved yet.
