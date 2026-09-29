/**
 * Draws a circuit outline from OpenStreetMap data (© OpenStreetMap
 * contributors, ODbL). Circuits are mapped as `highway=raceway` ways; the
 * racing line is the biggest connected set of raceway ways near the
 * circuit's coordinates, which leaves out nearby karting and drag strips.
 * Pure functions (tested with fixtures); fetching is in fetchRaceways().
 */

export interface OsmWay {
  type: 'way';
  id: number;
  tags?: Record<string, string>;
  geometry?: { lat: number; lon: number }[];
  nodes?: number[];
}

const OVERPASS_ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];

export function overpassQuery(lat: number, lng: number, radiusM = 3000): string {
  return `[out:json][timeout:20];way["highway"="raceway"](around:${radiusM},${lat},${lng});out geom;`;
}

/** Raceway ways around the point. Tries each Overpass endpoint; throws if none answer. */
export async function fetchRaceways(lat: number, lng: number, timeoutMs = 8000): Promise<OsmWay[]> {
  let lastError: unknown;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'f1weekend.co track outline' },
        body: `data=${encodeURIComponent(overpassQuery(lat, lng))}`,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) throw new Error(`Overpass ${endpoint} → HTTP ${res.status}`);
      const j = (await res.json()) as { elements?: OsmWay[] };
      return (j.elements ?? []).filter((e) => e.type === 'way' && (e.geometry?.length ?? 0) > 1);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Overpass unreachable');
}

const isPitLane = (w: OsmWay) => {
  const t = w.tags ?? {};
  return /pit/i.test(`${t.service ?? ''} ${t.raceway ?? ''} ${t.name ?? ''}`);
};

const isSideTrack = (w: OsmWay) => /kart|drag|drift|skid|test track|off-?road|motocross/i.test(`${w.tags?.name ?? ''} ${w.tags?.raceway ?? ''} ${w.tags?.sport ?? ''}`);

const key = (p: { lat: number; lon: number }) => `${p.lat.toFixed(6)},${p.lon.toFixed(6)}`;

function wayLengthM(w: OsmWay): number {
  const g = w.geometry ?? [];
  let m = 0;
  for (let i = 1; i < g.length; i++) {
    const dy = (g[i].lat - g[i - 1].lat) * 111_000;
    const dx = (g[i].lon - g[i - 1].lon) * 111_000 * Math.cos((g[i].lat * Math.PI) / 180);
    m += Math.hypot(dx, dy);
  }
  return m;
}

/**
 * The circuit: ways grouped by shared points (connected components); the
 * group with the most track length wins. Karting / drag strips are dropped
 * first so they can't join through a service road.
 */
export function pickCircuit(ways: OsmWay[]): OsmWay[] {
  const usable = ways.filter((w) => (w.geometry?.length ?? 0) > 1 && !isSideTrack(w));
  const parent = usable.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const owner = new Map<string, number>();
  usable.forEach((w, i) => {
    for (const p of w.geometry!) {
      const k = key(p);
      const other = owner.get(k);
      if (other === undefined) owner.set(k, i);
      else parent[find(i)] = find(other);
    }
  });
  const groups = new Map<number, OsmWay[]>();
  usable.forEach((w, i) => {
    const r = find(i);
    groups.set(r, [...(groups.get(r) ?? []), w]);
  });
  let best: OsmWay[] = [];
  let bestLen = 0;
  for (const g of groups.values()) {
    const len = g.reduce((n, w) => n + wayLengthM(w), 0);
    if (len > bestLen) {
      best = g;
      bestLen = len;
    }
  }
  // A real F1 layout is 3–7 km; anything under 1.5 km isn't the circuit.
  return bestLen >= 1500 ? best : [];
}

/** SVG outline, scaled to fit width × height, north up. null when there's no usable circuit. */
export function renderTrackSvg(ways: OsmWay[], opts: { width?: number; height?: number; title?: string } = {}): string | null {
  const circuit = pickCircuit(ways);
  if (circuit.length === 0) return null;
  const width = opts.width ?? 800;
  const height = opts.height ?? 520;
  const pad = 24;
  const pts = circuit.flatMap((w) => w.geometry!);
  const lat0 = pts.reduce((n, p) => n + p.lat, 0) / pts.length;
  const cos = Math.cos((lat0 * Math.PI) / 180);
  const xy = (p: { lat: number; lon: number }) => ({ x: p.lon * cos, y: -p.lat });
  const all = pts.map(xy);
  const minX = Math.min(...all.map((p) => p.x));
  const maxX = Math.max(...all.map((p) => p.x));
  const minY = Math.min(...all.map((p) => p.y));
  const maxY = Math.max(...all.map((p) => p.y));
  const scale = Math.min((width - 2 * pad) / (maxX - minX || 1), (height - 2 * pad) / (maxY - minY || 1));
  const offX = (width - (maxX - minX) * scale) / 2;
  const offY = (height - (maxY - minY) * scale) / 2;
  const path = (w: OsmWay) =>
    w.geometry!
      .map((p, i) => {
        const q = xy(p);
        return `${i === 0 ? 'M' : 'L'}${((q.x - minX) * scale + offX).toFixed(1)} ${((q.y - minY) * scale + offY).toFixed(1)}`;
      })
      .join(' ');
  const pit = circuit.filter(isPitLane);
  const track = circuit.filter((w) => !isPitLane(w));
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(opts.title ?? 'Circuit layout')}">`,
    // One clean line, like F1's own track maps. No halo: on tracks with close
    // parallel straights (Sepang) a wide halo merged into one pale block.
    `<g fill="none" stroke-linecap="round" stroke-linejoin="round">`,
    ...pit.map((w) => `<path d="${path(w)}" fill="none" stroke="#9A9AA5" stroke-width="2" stroke-dasharray="5 5"/>`),
    ...track.map((w) => `<path d="${path(w)}" fill="none" stroke="#15151E" stroke-width="6"/>`),
    `</g></svg>`,
  ].join('');
}
