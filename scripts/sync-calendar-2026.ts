/**
 * Writes the 2026 calendar (src/data/calendar-2026.ts) into the races table:
 * round and race_date for every race, and the venue for races that moved
 * (Bahrain GP → Sepang). Off-calendar races (Saudi) get available = false.
 * The site already applies the calendar in code; this keeps the database,
 * scripts and pipeline in step. Updates only; nothing is deleted.
 *
 *   npx tsx scripts/sync-calendar-2026.ts --dry-run
 *   npx tsx scripts/sync-calendar-2026.ts
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';
import { CALENDAR_2026, OFF_CALENDAR_2026 } from '../src/data/calendar-2026';

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT) || 3306,
    user: process.env.DATABASE_USER ?? 'root',
    password: process.env.DATABASE_PASSWORD ?? '',
    database: process.env.DATABASE_NAME ?? 'pitlane',
  });
  const [rows] = await conn.query<mysql.RowDataPacket[]>('SELECT slug, round, race_date, city, circuit_name FROM races');
  const bySlug = new Map(rows.map((r) => [r.slug as string, r]));

  for (const race of CALENDAR_2026) {
    const row = bySlug.get(race.slug);
    if (!row) {
      console.log(`[calendar] ${race.slug}: not in the database, skipped`);
      continue;
    }
    const current = row.race_date instanceof Date ? row.race_date.toISOString().slice(0, 10) : String(row.race_date).slice(0, 10);
    const v = race.venue;
    const changes = [
      row.round !== race.round && `round ${row.round} → ${race.round}`,
      current !== race.raceDate && `date ${current} → ${race.raceDate}`,
      v && row.circuit_name !== v.circuitName && `venue ${row.circuit_name} → ${v.circuitName}`,
    ].filter(Boolean);
    if (changes.length === 0) continue;
    console.log(`[calendar] ${race.slug}: ${changes.join(', ')}`);
    if (DRY_RUN) continue;
    await conn.execute('UPDATE races SET round = ?, race_date = ? WHERE slug = ?', [race.round, race.raceDate, race.slug]);
    if (race.liveExperiences) await conn.execute('UPDATE races SET available = true WHERE slug = ?', [race.slug]);
    if (v) {
      await conn.execute(
        `UPDATE races SET name = ?, circuit_name = ?, city = ?, country = ?, country_code = ?,
           circuit_lat = ?, circuit_lng = ?, timezone = ?, flag = ? WHERE slug = ?`,
        [race.name, v.circuitName, v.city, v.country, v.countryCode, v.circuitLat, v.circuitLng, v.timezone, v.flag, race.slug]
      );
    }
  }
  for (const slug of OFF_CALENDAR_2026) {
    if (!bySlug.has(slug)) continue;
    console.log(`[calendar] ${slug}: off the calendar → available = false`);
    if (!DRY_RUN) await conn.execute('UPDATE races SET available = false WHERE slug = ?', [slug]);
  }
  await conn.end();
  console.log(DRY_RUN ? '[calendar] Dry run, nothing written' : '[calendar] Done');
}

main().catch((err) => {
  console.error('[calendar] Failed:', err);
  process.exit(1);
});
