/**
 * Generates SEO guide articles for featured Shanghai + Japan experiences
 * and saves them directly to the guide_article column.
 *
 * Run: npx tsx --env-file=.env scripts/generate-guide-articles.ts
 */
import mysql from 'mysql2/promise';

const DB_HOST = process.env.DATABASE_HOST ?? 'localhost';
const DB_PORT = Number(process.env.DATABASE_PORT) || 3306;
const DB_USER = process.env.DATABASE_USER ?? 'root';
const DB_PASS = process.env.DATABASE_PASSWORD ?? '';
const DB_NAME = process.env.DATABASE_NAME ?? 'pitlane';

interface Experience {
  id: number;
  slug: string;
  title: string;
  abstract: string;
  description: string;
  category: string;
  tag: string;
  price_label: string;
  duration_label: string;
  rating: string;
  review_count: number;
  neighborhood: string | null;
  f1_windows_label: string | null;
  travel_mins: number | null;
  meeting_point: string | null;
  f1_context: string | null;
  affiliate_url: string;
  highlights: string[];
  reviews_snapshot: Array<{
    author: string;
    country?: string;
    rating: number;
    text: string;
    date?: string;
  }>;
  race_slug: string;
  race_name: string;
  city: string;
}

// Race schedule context
const RACE_CONTEXT: Record<string, {
  dates: string;
  schedule: string;
  circuit: string;
  getting_there: string;
  currency_note: string;
}> = {
  'shanghai-2026': {
    dates: 'March 13–15, 2026',
    schedule: `The 2026 Chinese Grand Prix is a sprint weekend. Friday has a single practice session (FP1) in the afternoon. Saturday runs Sprint Qualifying in the morning and the Sprint Race in the afternoon. Sunday is Race Day — lights out at 15:00 CST. That leaves Friday morning, Friday evening, and Sunday morning as the primary free windows.`,
    circuit: 'Shanghai International Circuit, located in Jiading District',
    getting_there: 'Metro Line 11 to Anting Station (about 50 minutes from People\'s Square, ¥7)',
    currency_note: 'Prices are in Chinese Yuan (CNY/¥).',
  },
  'japan-2026': {
    dates: 'March 27–29, 2026',
    schedule: `The 2026 Japanese Grand Prix at Suzuka is a standard three-day race weekend. Friday has FP1 (11:30–12:30 JST) and FP2 (15:00–16:00 JST). Saturday has FP3 (11:30–12:30 JST) and Qualifying (15:00–16:00 JST). Sunday is Race Day at 14:00 JST. The widest free windows are Friday morning (before FP1), both midday gaps between sessions, and Sunday morning before the race.`,
    circuit: 'Suzuka International Racing Course',
    getting_there: 'Kintetsu Nagoya Line to Shirako or Suzuka-shi Station (about 50 minutes from Nagoya, ¥800)',
    currency_note: 'Prices are in Japanese Yen (JPY/¥).',
  },
  'bahrain-2026': {
    dates: 'April 10–12, 2026',
    schedule: `The 2026 Bahrain Grand Prix at Sakhir is a night-race weekend. Practice 1 and Practice 2 run on Friday afternoon and evening (approximately 15:30–16:30 and 19:00–20:00 AST). Saturday has Practice 3 in the afternoon and Qualifying in the evening (approximately 15:30–16:30 and 19:00–20:00 AST). Race Day is Sunday — lights out at approximately 20:00 AST. The widest free windows are Friday morning (6 hours before FP1), both mid-afternoon gaps between sessions, and the entire Sunday morning before the race (9 hours free from 08:00–17:00 AST).`,
    circuit: 'Bahrain International Circuit, Sakhir (about 30 km south of Manama)',
    getting_there: 'Taxi or ride-share from Manama city centre to Sakhir (approximately 30–40 minutes, BHD 5–8). Race-day shuttle buses also run from central Manama hotels.',
    currency_note: 'Prices are listed in USD. Bahrain uses the Bahraini Dinar (BHD); 1 BHD ≈ 2.65 USD.',
  },
};

function generateArticle(exp: Experience): string {
  const ctx = RACE_CONTEXT[exp.race_slug];
  const highlightsList = exp.highlights.map(h => `- ${h}`).join('\n');
  const reviews = exp.reviews_snapshot.slice(0, 3);
  const reviewBlock = reviews.map(r => {
    const origin = r.country ? ` from ${r.country}` : '';
    const stars = '★'.repeat(r.rating);
    return `**${r.author}${origin}** (${stars}): "${r.text}"`;
  }).join('\n\n');

  const windowsText = exp.f1_windows_label
    ? `This experience fits best in: **${exp.f1_windows_label}**.`
    : '';

  const f1ContextSection = exp.f1_context
    ? `\n${exp.f1_context}\n`
    : '';

  const neighbourhoodText = exp.neighborhood
    ? ` Located in ${exp.neighborhood}.`
    : '';

  const travelText = exp.travel_mins
    ? ` Allow ${exp.travel_mins} minutes travel time from the city centre.`
    : '';

  return `# ${exp.title}: Complete Guide for the ${exp.race_name} Weekend

Meta description: Everything you need to know about ${exp.title} during the ${exp.race_name} ${exp.race_slug.slice(-4)}. ${exp.price_label} · ${exp.duration_label} · ${exp.rating}★ from ${exp.review_count.toLocaleString()} reviews.
URL: /races/${exp.race_slug}/experiences/${exp.slug}/
Category: ${exp.category}


The ${exp.race_name} runs ${ctx.dates} at ${ctx.circuit}. Between sessions, ${exp.city} — and the wider region around it — opens up for everything from cultural deep-dives to food tours that have drawn glowing reviews from thousands of visitors. ${exp.title} is one of the experiences we've consistently recommended for this race weekend, and this guide covers everything you need to book with confidence.

${ctx.currency_note}

If you're planning your race weekend around the [${exp.race_name}](https://f1weekend.co/races/${exp.race_slug}), this guide covers every detail.


## What to Expect

${exp.description ?? exp.abstract}${neighbourhoodText}${travelText}

**Highlights include:**
${highlightsList}


## F1 Race Weekend Timing

${ctx.schedule}

${windowsText}

${f1ContextSection}

Getting to the circuit: ${ctx.getting_there}.


## Ticket Price & How to Book

**${exp.title}** is priced at **${exp.price_label}** per person for ${exp.duration_label}. It is rated **${exp.rating} out of 5** from **${exp.review_count.toLocaleString()} verified reviews** on GetYourGuide.

Mobile vouchers are accepted — no printing required. Instant confirmation applies.

[Book ${exp.title} — ${exp.price_label}](${exp.affiliate_url})

> **Q: How far in advance should I book ${exp.title} during the ${exp.race_name}?**
> Book at least 1–2 weeks before race weekend. Popular departures during Grand Prix week sell out early. Instant confirmation means your spot is locked the moment you book.


## Is It Worth It?

A ${exp.rating}-star rating from ${exp.review_count.toLocaleString()} reviews is a meaningful signal at that volume. It reflects consistent quality across different guides, departure times, and visitor backgrounds. The ${exp.price_label} price point for ${exp.duration_label} positions it well for a race weekend where session gaps need filling without eating into the day.

For visitors attending the ${exp.race_name}: the race itself gives you the circuit. This experience gives you ${exp.city}. That combination — track plus city — is what separates a race trip from a race weekend.


## What Visitors Are Saying

${reviewBlock}


## Practical Information

- **Duration:** ${exp.duration_label}
- **Price:** ${exp.price_label} per person
- **Rating:** ${exp.rating}★ from ${exp.review_count.toLocaleString()} reviews
- **Booking:** Online in advance — mobile voucher accepted, instant confirmation
- **Best windows:** ${exp.f1_windows_label ?? 'See F1 Race Weekend Timing section above'}
- **Circuit access:** ${ctx.getting_there}

Planning more of your trip? See the full [${exp.race_name} weekend guide](https://f1weekend.co/races/${exp.race_slug}) for the complete race schedule, circuit transport, and the best experiences across the weekend.

[Book ${exp.title} — ${exp.price_label}](${exp.affiliate_url})
`;
}

async function main() {
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    ssl: DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : undefined,
  });

  console.log(`[generate] Connected to ${DB_HOST}:${DB_PORT}/${DB_NAME}`);

  const [rows] = await conn.execute<mysql.RowDataPacket[]>(`
    SELECT e.id, e.slug, e.title, e.abstract, e.description,
           e.category, e.tag, e.price_label, e.duration_label,
           e.rating, e.review_count, e.neighborhood, e.f1_windows_label,
           e.travel_mins, e.meeting_point, e.f1_context,
           e.affiliate_url, e.highlights, e.reviews_snapshot,
           r.slug as race_slug, r.name as race_name, r.city
    FROM experiences e
    JOIN races r ON e.race_id = r.id
    WHERE e.is_featured = 1
      AND r.slug IN ('shanghai-2026', 'japan-2026', 'bahrain-2026')
    ORDER BY r.slug, e.slug
  `);

  const experiences = rows as Experience[];
  let saved = 0;

  for (const exp of experiences) {
    const article = generateArticle(exp);
    const [result] = await conn.execute<mysql.ResultSetHeader>(
      `UPDATE experiences SET guide_article = ? WHERE id = ?`,
      [article, exp.id]
    );
    if (result.affectedRows > 0) {
      console.log(`[generate] OK   ${exp.race_slug} / ${exp.slug} (${article.length} chars)`);
      saved++;
    } else {
      console.log(`[generate] WARN ${exp.slug} — no rows updated`);
    }
  }

  await conn.end();
  console.log(`\n[generate] Done — ${saved}/${experiences.length} guide articles saved`);
}

main().catch((err) => {
  console.error('[generate] Failed:', err);
  process.exit(1);
});
