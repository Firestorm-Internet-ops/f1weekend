import { raceKeyOfPath } from './opportunities';
import { experimentLockUntil } from './lock';
export { EXPERIMENT_VERDICT_DATE, experimentLockUntil } from './lock';
export type LoopAnswer = { path: string; id: string; q: string; a: string; searches: string[]; approved: boolean; approvedBy: string | null; drafted: string };
export function publishedAnswers(path: string, answers: LoopAnswer[], now: Date): LoopAnswer[] {
  if (experimentLockUntil(raceKeyOfPath(path), now)) return [];
  return answers.filter((a) => a.path === path && a.approved === true && !!a.approvedBy?.trim());
}
