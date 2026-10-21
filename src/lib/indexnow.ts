import { normalizePath } from './seo-loop/paths';
export const INDEXNOW_KEY = '8c27f98a1e36d4b05c71a2f9406e3b8d';
export function indexNowBody(urls: string[]) {
  const paths = [...new Set(urls.map(normalizePath).filter((p): p is string => !!p))];
  if (paths.length > 10000) throw new Error('IndexNow supports at most 10,000 URLs');
  if (!paths.length) return null;
  return { host: 'f1weekend.co', key: INDEXNOW_KEY, keyLocation: `https://f1weekend.co/${INDEXNOW_KEY}.txt`, urlList: paths.map((p) => `https://f1weekend.co${p}`) };
}
export async function submitIndexNow(body: NonNullable<ReturnType<typeof indexNowBody>>, fetcher: typeof fetch = globalThis.fetch): Promise<number> {
  const response = await fetcher('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify(body) });
  if (![200, 202].includes(response.status)) throw new Error(`IndexNow request failed: ${response.status}`);
  return response.status;
}
