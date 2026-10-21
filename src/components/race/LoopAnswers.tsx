import answers from '@/data/seo-loop-answers.json';
import { publishedAnswers } from '@/lib/seo-loop/publish';
import type { LoopAnswer } from '@/lib/seo-loop/publish';

export default function LoopAnswers({ path }: { path: string }) {
  const visible = publishedAnswers(path, answers as LoopAnswer[], new Date());
  if (!visible.length) return null;
  return <section className="mt-12 border-t border-[var(--border-subtle)] pt-8" aria-labelledby="quick-answers">
    <h2 id="quick-answers" className="font-display font-bold text-2xl text-[var(--text-primary)] mb-6">Quick answers</h2>
    <div className="space-y-6">{visible.map((answer) => <article key={answer.id}>
      <h2 id={answer.id} className="font-display font-bold text-lg text-[var(--text-primary)] mb-2">{answer.q}</h2>
      <p className="text-[var(--text-secondary)] leading-relaxed">{answer.a}</p>
    </article>)}</div>
  </section>;
}
