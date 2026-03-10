import 'dotenv/config';
import mysql from 'mysql2/promise';

const DB_HOST = process.env.DATABASE_HOST ?? 'localhost';
const DB_PORT = Number(process.env.DATABASE_PORT) || 3306;
const DB_USER = process.env.DATABASE_USER ?? 'root';
const DB_PASS = process.env.DATABASE_PASSWORD ?? '';
const DB_NAME = process.env.DATABASE_NAME ?? 'pitlane';

const DESC_RACES = ['bahrain-2026', 'saudi-2026'];
const EMOJI_RACE = 'saudi-2026';

async function getRaceId(conn: mysql.Connection, slug: string): Promise<number | null> {
  const [rows] = await conn.execute<mysql.RowDataPacket[]>(
    `SELECT id FROM races WHERE slug = ? LIMIT 1`,
    [slug]
  );
  if (rows.length === 0) return null;
  return Number(rows[0].id);
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

  console.log(`[patch-content] Connected to ${DB_HOST}:${DB_PORT}/${DB_NAME}`);

  const raceIds: number[] = [];
  for (const slug of DESC_RACES) {
    const id = await getRaceId(conn, slug);
    if (id === null) {
      console.warn(`[patch-content] Race not found, skipping: ${slug}`);
      continue;
    }
    raceIds.push(id);
    console.log(`[patch-content] ${slug} → race_id=${id}`);
  }

  if (raceIds.length > 0) {
    const placeholders = raceIds.map(() => '?').join(', ');
    const [descResult] = await conn.execute<mysql.ResultSetHeader>(
      `UPDATE experiences
       SET
         short_description = CASE
           WHEN short_description IS NULL OR TRIM(short_description) = ''
             THEN COALESCE(NULLIF(abstract, ''), NULLIF(title, ''))
           ELSE short_description
         END,
         description = CASE
           WHEN description IS NULL OR TRIM(description) = ''
             THEN CONCAT_WS(
               '\n\n',
               COALESCE(NULLIF(abstract, ''), NULLIF(short_description, ''), NULLIF(title, '')),
               NULLIF(f1_context, '')
             )
           ELSE description
         END
       WHERE race_id IN (${placeholders})
         AND (
           description IS NULL OR TRIM(description) = ''
           OR short_description IS NULL OR TRIM(short_description) = ''
         )`,
      raceIds
    );
    console.log(`[patch-content] Description patch updated rows: ${descResult.affectedRows}`);
  }

  const saudiId = await getRaceId(conn, EMOJI_RACE);
  if (saudiId !== null) {
    const [emojiResult] = await conn.execute<mysql.ResultSetHeader>(
      `UPDATE experiences
       SET image_emoji = CASE
         WHEN category = 'food' THEN '🍽️'
         WHEN category = 'culture' THEN '🏛️'
         WHEN category = 'adventure' THEN '🧭'
         WHEN category = 'daytrip' THEN '🚌'
         WHEN category = 'nightlife' THEN '🌙'
         ELSE '📍'
       END
       WHERE race_id = ?
         AND (image_emoji IS NULL OR TRIM(image_emoji) = '')`,
      [saudiId]
    );
    console.log(`[patch-content] Saudi image_emoji patch updated rows: ${emojiResult.affectedRows}`);
  }

  await conn.end();
  console.log('[patch-content] Done');
}

main().catch((err) => {
  console.error('[patch-content] Failed:', err);
  process.exit(1);
});
