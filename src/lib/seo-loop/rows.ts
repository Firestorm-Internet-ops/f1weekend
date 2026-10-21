import { normalizePath } from './paths';
export type GscRow = { keys: [string, string]; clicks: number; impressions: number; ctr: number; position: number };
export type SearchRow = { query: string; path: string; impressions: number; clicks: number; position: number };
export function mergeRows(rows: GscRow[]): SearchRow[] {
  const merged = new Map<string, SearchRow>();
  for (const row of rows) {
    const query = row.keys[0].trim().toLowerCase(), path = normalizePath(row.keys[1]);
    if (!path || row.impressions === 0) continue;
    const key = `${query}\0${path}`, old = merged.get(key);
    if (old) {
      const total = old.impressions + row.impressions;
      old.position = (old.position * old.impressions + row.position * row.impressions) / total;
      old.impressions = total; old.clicks += row.clicks;
    } else merged.set(key, { query, path, impressions: row.impressions, clicks: row.clicks, position: row.position });
  }
  return [...merged.values()].sort((a, b) => b.impressions - a.impressions);
}
