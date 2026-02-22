import Anthropic from '@anthropic-ai/sdk';
import { Ollama } from 'ollama';

const LLM_PROVIDER = process.env.LLM_PROVIDER ?? 'ollama';

/**
 * LLM abstraction layer.
 * Routes to Ollama (local dev) or Anthropic Claude (production)
 * based on LLM_PROVIDER env var.
 */
export async function generateText(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  if (LLM_PROVIDER === 'ollama') {
    return generateWithOllama(systemPrompt, userPrompt);
  }

  if (LLM_PROVIDER === 'anthropic') {
    return generateWithAnthropic(systemPrompt, userPrompt);
  }

  throw new Error(`Unknown LLM_PROVIDER: ${LLM_PROVIDER}. Use 'ollama' or 'anthropic'.`);
}

async function generateWithOllama(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const ollama = new Ollama({
    host: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
  });

  const model = process.env.OLLAMA_MODEL ?? 'tinyllama';

  const response = await ollama.chat({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  return response.message.content;
}

async function generateWithAnthropic(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userPrompt },
    ],
  });

  const block = response.content[0];
  if (block.type === 'text') {
    return block.text;
  }

  throw new Error('Unexpected response format from Anthropic');
}
