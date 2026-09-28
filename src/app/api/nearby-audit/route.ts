import { NextRequest, NextResponse } from 'next/server';
import { runNearbyAudit, renderAuditCsv, renderAuditHtml } from '@/lib/nearby-audit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/nearby-audit            → HTML report
 * GET /api/nearby-audit?format=csv → CSV download
 * GET /api/nearby-audit?race=monaco-2026
 *
 * READ-ONLY. Disabled on production (VERCEL_ENV=production) so it only exists
 * on Vercel preview / staging deployments, which can reach Cloud SQL.
 */
export async function GET(req: NextRequest) {
  if (process.env.VERCEL_ENV === 'production') {
    return new NextResponse('Not found', { status: 404 });
  }

  const race = req.nextUrl.searchParams.get('race') ?? undefined;
  const format = req.nextUrl.searchParams.get('format');
  const headers = { 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' };

  try {
    const result = await runNearbyAudit(race);

    if (format === 'csv') {
      return new NextResponse(renderAuditCsv(result), {
        headers: {
          ...headers,
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="nearby-audit.csv"',
        },
      });
    }

    const csvParams = new URLSearchParams({ format: 'csv' });
    if (race) csvParams.set('race', race);
    return new NextResponse(renderAuditHtml(result, `?${csvParams.toString()}`), {
      headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err) {
    console.error('[GET /api/nearby-audit] failed:', err);
    return new NextResponse(`Audit failed: ${err instanceof Error ? err.message : String(err)}`, {
      status: 500,
      headers: { ...headers, 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
