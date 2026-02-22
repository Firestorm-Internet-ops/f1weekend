import 'dotenv/config';
import { generateText } from '../src/lib/llm';

async function main() {
  console.log(`[test] LLM_PROVIDER = ${process.env.LLM_PROVIDER}`);
  console.log('[test] Calling generateText...');

  const result = await generateText(
    'You are a helpful travel assistant.',
    'Suggest one fun thing to do in Melbourne in 1 sentence.'
  );

  console.log('[test] Response:', result);
}

main().catch((err) => {
  console.error('[test] Failed:', err);
  process.exit(1);
});
