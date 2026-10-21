import { checkAnswers, type DraftAnswer } from './qa';
import type { Brief } from './brief';
export function parseDraft(text: string): DraftAnswer[] {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const parsed: unknown = JSON.parse(fenced?.[1] ?? text);
  if (!Array.isArray(parsed)) throw new Error('Draft must be a JSON array');
  return parsed as DraftAnswer[];
}
export async function draftAnswers(brief: Brief, generate: (prompt: string) => Promise<string>, { maxAttempts = 3 } = {}) {
  let problems: string[] = [], answers: DraftAnswer[] = [];
  for (let attempts = 1; attempts <= maxAttempts; attempts++) {
    const prompt = attempts === 1 ? brief.prompt : `${brief.prompt}\n\nYour last draft failed these checks:\n${problems.map((p) => `- ${p}`).join('\n')}`;
    try { answers = parseDraft(await generate(prompt)); problems = checkAnswers(answers, brief).problems; }
    catch (error) { problems = [`all: json ${(error as Error).message}`]; answers = []; }
    if (!problems.length) return { status: 'passed' as const, answers, attempts, problems };
  }
  return { status: 'failed' as const, answers, attempts: maxAttempts, problems };
}
