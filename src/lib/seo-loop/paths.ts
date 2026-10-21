export function normalizePath(urlOrPath: string | null): string | null {
  if (!urlOrPath) return null;
  let path: string;
  if (urlOrPath.startsWith('/')) path = urlOrPath;
  else {
    try {
      const url = new URL(urlOrPath);
      if (!['f1weekend.co', 'www.f1weekend.co'].includes(url.hostname.toLowerCase())) return null;
      path = url.pathname;
    } catch { return null; }
  }
  path = path.split(/[?#]/, 1)[0] || '/';
  path = path.replace(/^\/races\/([a-z][a-z-]*[a-z])-20\d\d(?=\/|$)/, '/races/$1');
  return path.length > 1 ? path.replace(/\/+$/, '') : '/';
}
