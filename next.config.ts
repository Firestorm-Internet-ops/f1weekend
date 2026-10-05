import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@pitlane/gyg'],
  reactCompiler: true,
  compress: true,
  images: {
    qualities: [75, 80, 90],
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.getyourguide.com' },
      { protocol: 'https', hostname: 'img.getyourguide.com' },
      { protocol: 'https', hostname: '**.getyourguide.com' },
      // F1 track maps (Sepang for the Bahrain GP in Malaysia): fetched once by the image optimiser.
      { protocol: 'https', hostname: 'media.formula1.com', pathname: '/image/upload/**' },
    ],
  },
  async redirects() {
    return [
      // One host: www.f1weekend.co served the same pages as f1weekend.co (duplicates in search).
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.f1weekend.co' }],
        destination: 'https://f1weekend.co/:path*',
        permanent: true,
      },
      // Race URLs dropped the year (/races/bahrain-2026/schedule → /races/bahrain/schedule):
      // one address per race that keeps its rankings from season to season.
      {
        source: '/races/:key([a-z][a-z-]*[a-z])-:year(20\\d{2})/:path*',
        destination: '/races/:key/:path*',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Staging is public (no Vercel login) — keep it out of search results.
          ...(process.env.VERCEL_ENV === 'preview' ? [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] : []),
        ],
      },
      {
        source: '/experiences/:slug',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=3600' },
        ],
      },
      {
        source: '/schedule',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=600' },
        ],
      },
    ];
  },
};

export default nextConfig;
