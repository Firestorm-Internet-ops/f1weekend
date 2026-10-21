import type { GscRow } from './seo-loop/rows';
export function searchWindow(now: Date, days = 28) {
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - 3 * 86400000;
  return { startDate: new Date(end - (days - 1) * 86400000).toISOString().slice(0, 10), endDate: new Date(end).toISOString().slice(0, 10) };
}
export async function fetchSearchRows({ siteUrl, startDate, endDate, accessToken, fetch: fetcher = globalThis.fetch }: { siteUrl: string; startDate: string; endDate: string; accessToken: string; fetch?: typeof fetch }): Promise<GscRow[]> {
  const all: GscRow[] = [], url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
  for (let startRow = 0; ; startRow += 25000) {
    const response = await fetcher(url, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ startDate, endDate, dimensions: ['query', 'page'], rowLimit: 25000, startRow }) });
    if (!response.ok) throw new Error(`Search Console request failed: ${response.status}`);
    const body = await response.json() as { rows?: GscRow[] };
    const page = body.rows ?? []; all.push(...page);
    if (page.length < 25000) return all;
  }
}
