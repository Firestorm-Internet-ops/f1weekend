import 'dotenv/config';
import { getRaceBySlug, getUpcomingRace, getSessionsByRace, getWindowsByRace } from '../src/services/race.service';

async function main() {
  console.log('--- getRaceBySlug ---');
  const race = await getRaceBySlug('melbourne-2026');
  console.log(race);

  if (!race) throw new Error('Race not found');

  console.log('\n--- getUpcomingRace ---');
  const upcoming = await getUpcomingRace();
  console.log(upcoming?.name, upcoming?.raceDate);

  console.log('\n--- getSessionsByRace ---');
  const sessions = await getSessionsByRace(race.id);
  sessions.forEach(s => console.log(`${s.dayOfWeek} ${s.startTime} ${s.shortName}`));

  console.log('\n--- getWindowsByRace ---');
  const windows = await getWindowsByRace(race.id);
  windows.forEach(w => console.log(`${w.slug} (${w.maxDurationHours}h)`));

  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
