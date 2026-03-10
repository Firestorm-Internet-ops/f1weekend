import 'dotenv/config';
import mysql from 'mysql2/promise';

const DB_HOST = process.env.DATABASE_HOST ?? 'localhost';
const DB_PORT = Number(process.env.DATABASE_PORT) || 3306;
const DB_USER = process.env.DATABASE_USER ?? 'root';
const DB_PASS = process.env.DATABASE_PASSWORD ?? '';
const DB_NAME = process.env.DATABASE_NAME ?? 'pitlane';
const RACE_SLUG = 'bahrain-2026';

async function main() {
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    ssl: DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : undefined,
  });

  console.log(`[patch-bahrain] Connected to ${DB_HOST}:${DB_PORT}/${DB_NAME}`);

  const [raceRows] = await conn.execute<mysql.RowDataPacket[]>(
    `SELECT id FROM races WHERE slug = ? LIMIT 1`,
    [RACE_SLUG]
  );

  if (raceRows.length === 0) {
    console.error(`[patch-bahrain] Race not found: ${RACE_SLUG}`);
    await conn.end();
    process.exit(1);
  }

  const raceId = Number(raceRows[0].id);
  console.log(`[patch-bahrain] Race id: ${raceId}`);

  const [result] = await conn.execute<mysql.ResultSetHeader>(
    `UPDATE experiences
     SET
       short_description = CASE
         WHEN short_description IS NULL OR TRIM(short_description) = ''
           THEN abstract
         ELSE short_description
       END,
       description = CASE
         WHEN description IS NULL OR TRIM(description) = ''
           THEN CONCAT_WS('\n\n', NULLIF(abstract, ''), NULLIF(f1_context, ''))
         ELSE description
       END
     WHERE race_id = ?
       AND (
         description IS NULL OR TRIM(description) = ''
         OR short_description IS NULL OR TRIM(short_description) = ''
       )`,
    [raceId]
  );

  console.log(`[patch-bahrain] Updated rows: ${result.affectedRows}`);
  await conn.end();
  console.log('[patch-bahrain] Done');
}

main().catch((err) => {
  console.error('[patch-bahrain] Failed:', err);
  process.exit(1);
});
