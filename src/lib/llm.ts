import Anthropic from '@anthropic-ai/sdk';
import { Ollama } from 'ollama';
import { execFile } from 'child_process';
import { promisify } from 'util';

const LLM_PROVIDER = process.env.LLM_PROVIDER ?? 'ollama';
const execFileAsync = promisify(execFile);

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
    return generateWithClaudeCli(systemPrompt, userPrompt);
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
    model: 'claude-sonnet-4-6',
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

async function generateWithClaudeCli(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const model = process.env.CLAUDE_MODEL ?? process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';
  const timeoutMs = Number(process.env.CLAUDE_CLI_TIMEOUT_MS ?? 120000);
  const args = [
    '-p',
    userPrompt,
    '--append-system-prompt',
    systemPrompt,
    '--model',
    model,
    '--permission-mode',
    'bypassPermissions',
    '--output-format',
    'text',
  ];

  try {
    const { stdout } = await execFileAsync('claude', args, {
      maxBuffer: 10 * 1024 * 1024,
      timeout: timeoutMs,
    });
    return stdout.trim();
  } catch (error) {
    const e = error as Error & { stderr?: string; stdout?: string; code?: string | number; signal?: string };
    if (e.signal === 'SIGTERM' || e.code === 'ETIMEDOUT') {
      throw new Error(`Claude CLI call timed out after ${timeoutMs}ms`);
    }
    const stderr = e.stderr ? `\n${e.stderr}` : '';
    const stdout = e.stdout ? `\nstdout:\n${e.stdout}` : '';
    const code = e.code !== undefined ? ` (code: ${String(e.code)})` : '';
    throw new Error(`Claude CLI call failed${code}: ${e.message}${stderr}${stdout}`);
  }
}
