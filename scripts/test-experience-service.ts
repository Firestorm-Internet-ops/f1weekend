import 'dotenv/config';
import {
  getExperiencesByRace,
  getFeaturedExperiences,
  getExperiencesByCategory,
  getExperiencesByWindow,
  getExperienceById,
} from '../src/services/experience.service';

async function main() {
  // Assumes race ID 1 = melbourne-2026
  const RACE_ID = 1;

  console.log('--- getExperiencesByRace ---');
  const all = await getExperiencesByRace(RACE_ID);
  console.log(`Total: ${all.length} (expected: 35)`);

  console.log('\n--- getFeaturedExperiences ---');
  const featured = await getFeaturedExperiences(RACE_ID);
  console.log(`Featured: ${featured.length} (expected: 6)`);
  featured.forEach(e => console.log(`  [${e.sortOrder}] ${e.title}`));

  console.log('\n--- getExperiencesByCategory (food) ---');
  const food = await getExperiencesByCategory(RACE_ID, 'food');
  console.log(`Food: ${food.length} (expected: 7)`);

  console.log('\n--- getExperiencesByWindow (thu-full) ---');
  const thuFull = await getExperiencesByWindow('thu-full', RACE_ID);
  console.log(`thu-full: ${thuFull.length} (expected: 35)`);

  console.log('\n--- getExperiencesByWindow (fri-gap) ---');
  const friGap = await getExperiencesByWindow('fri-gap', RACE_ID);
  console.log(`fri-gap: ${friGap.length} (expected: 3-5, all durationHours <= 1.5)`);
  friGap.forEach(e => console.log(`  ${e.title} — ${e.durationHours}h`));

  console.log('\n--- getExperienceById ---');
  const exp = await getExperienceById(1);
  console.log(`getExperienceById(1): ${exp ? exp.title : 'null'}`);
  const missing = await getExperienceById(99999);
  console.log(`getExperienceById(99999): ${missing} (expected: null)`);

  console.log('\n--- sort: price-low ---');
  const cheap = await getExperiencesByRace(RACE_ID, { sort: 'price-low' });
  console.log(`Cheapest: ${cheap[0]?.priceLabel} — ${cheap[0]?.title}`);

  console.log('\n--- sort: price-high ---');
  const expensive = await getExperiencesByRace(RACE_ID, { sort: 'price-high' });
  console.log(`Most expensive: ${expensive[0]?.priceLabel} — ${expensive[0]?.title}`);

  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
