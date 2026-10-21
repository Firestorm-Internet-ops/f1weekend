import { SEO_EXPERIMENTS } from '../../data/seo-experiments';

export const EXPERIMENT_VERDICT_DATE = '2026-12-07';

export function experimentLockUntil(raceKey: string | null, now: Date): string | null {
  return raceKey && Object.hasOwn(SEO_EXPERIMENTS, raceKey) && now < new Date(`${EXPERIMENT_VERDICT_DATE}T00:00:00Z`)
    ? EXPERIMENT_VERDICT_DATE
    : null;
}
