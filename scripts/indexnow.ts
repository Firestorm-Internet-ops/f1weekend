import { indexNowBody, submitIndexNow } from '../src/lib/indexnow';
async function main() {
  const body = indexNowBody(process.argv.slice(2));
  if (!body) { console.log('No f1weekend.co URLs to submit.'); return; }
  console.log(`IndexNow accepted with status ${await submitIndexNow(body)}.`);
}

main().catch((error) => { console.error(error); process.exit(1); });
