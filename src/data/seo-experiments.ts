/**
 * SEO experiments, autumn 2026: each remaining race tests ONE technique so we
 * can pick a winner for 2027 (method and results: docs/seo-experiments/).
 * Everything else on the race pages stays identical across races.
 */
export type SeoVariant =
  | 'control'       // the standard page, unchanged
  | 'answer-first'  // real search questions as headings, 40–60-word direct answers, FAQ schema
  | 'topic-cluster' // race page + focused intent pages
  | 'unique-data'   // tables nobody else has (prices across sites, travel times, gap fits)
  | 'expert-guide'  // long-form guide with sources, author, last verified
  | 'freshness'     // page updated weekly with what changed
  | 'validation';   // best two techniques combined

export interface SeoExperiment {
  variant: SeoVariant;
  hypothesis: string;
  /** Day the variant went live (YYYY-MM-DD); measurement starts here. */
  liveFrom?: string;
}

/** By race key (URL /races/<key>). Races not listed get the standard page. */
export const SEO_EXPERIMENTS: Record<string, SeoExperiment> = {
  singapore: { variant: 'control', hypothesis: 'Baseline: the standard race page, unchanged.' },
  usa: { variant: 'answer-first', hypothesis: 'Pages that answer real search questions directly win snippets, AI citations and clicks.', liveFrom: '2026-09-30' },
  mexico: { variant: 'topic-cluster', hypothesis: 'Several focused pages (Day of the Dead, where to stay, getting there, weather and packing) linked from the race page beat one page.', liveFrom: '2026-09-30' },
  brazil: { variant: 'unique-data', hypothesis: 'Original data (race-day weather history, form guide, travel times, tour price guide, session-gap planner) earns rankings where copied text cannot.', liveFrom: '2026-10-05' },
  'las-vegas': { variant: 'expert-guide', hypothesis: 'Depth and trust signals (sources, author, last verified) help ranking.' },
  qatar: { variant: 'freshness', hypothesis: 'Frequently updated pages are recrawled and ranked sooner.' },
  'abu-dhabi': { variant: 'validation', hypothesis: 'The two best techniques so far, combined, confirm the 2027 template.' },
};

export function seoExperiment(raceKey: string): SeoExperiment | null {
  return SEO_EXPERIMENTS[raceKey] ?? null;
}
