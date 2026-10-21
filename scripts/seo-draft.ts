import { readFile, writeFile } from 'node:fs/promises';
import { CALENDAR_2026 } from '../src/data/calendar-2026';
import { raceKey } from '../src/lib/race-url';
import { experimentLockUntil } from '../src/lib/seo-loop/publish';
import { buildBrief } from '../src/lib/seo-loop/brief';
import { draftAnswers } from '../src/lib/seo-loop/draft';
import { generateText } from '../src/lib/llm';
import { SEO_LOOP_FACTS } from '../src/data/seo-loop-facts';
import type { PageTicket } from '../src/lib/seo-loop/opportunities';
import type { LoopAnswer } from '../src/lib/seo-loop/publish';

async function main() {
  const path = process.argv[process.argv.indexOf('--path') + 1];
  const match = path?.match(/^\/races\/([^/]+)(\/getting-there)?$/), key = match?.[1] ?? null;
  if (!key) throw new Error('Drafts require a race page or getting-there path');
  if (experimentLockUntil(key, new Date())) throw new Error('This race is blocked by the SEO experiment');
  const race = CALENDAR_2026.find((r) => raceKey(r.slug) === key), facts = SEO_LOOP_FACTS[key];
  if (!race || !facts?.length) throw new Error(`No sourced race facts for ${key}`);
  const response = await fetch('https://staging.f1weekend.co/api/seo-loop');
  if (!response.ok) throw new Error(`SEO loop endpoint returned ${response.status}`);
  const { tickets } = await response.json() as { tickets: PageTicket[] };
  const ticket = tickets.find((t) => t.path === path);
  if (!ticket) throw new Error(`No SEO opportunity ticket for ${path}`);
  const brief = buildBrief(ticket, { raceKey: key, raceName: race.name, season: Number(race.raceDate.slice(0, 4)), startDate: race.startDate, raceDate: race.raceDate, facts });
  const result = await draftAnswers(brief, (prompt) => generateText('Write concise, factual answers using only the supplied facts.', prompt));
  if (result.status === 'failed') { console.error(result.problems.join('\n')); process.exitCode = 1; return; }

  const file = 'src/data/seo-loop-answers.json', existing = JSON.parse(await readFile(file, 'utf8')) as LoopAnswer[];
  const additions = result.answers.map((answer) => ({ ...answer, path, approved: false, approvedBy: null, drafted: new Date().toISOString().slice(0, 10) }));
  const existingIds = new Set(existing.filter((answer) => answer.path === path).map((answer) => answer.id));
  const duplicate = additions.find((answer) => existingIds.has(answer.id));
  if (duplicate) throw new Error(`Draft answer id already exists for ${path}: ${duplicate.id}`);
  await writeFile(file, `${JSON.stringify([...existing, ...additions], null, 2)}\n`);
  console.log(`Saved ${additions.length} unapproved draft answers.`);
}

main().catch((error) => { console.error(error); process.exit(1); });
