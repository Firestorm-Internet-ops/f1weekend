export default function robots() {
  // Staging (Vercel preview) is open to view but must never be crawled.
  if (process.env.VERCEL_ENV === 'preview') {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/itinerary/'],
      },
      {
        userAgent: 'AdsBot-Google',
        allow: '/',
      },
    ],
    sitemap: 'https://f1weekend.co/sitemap.xml',
  };
}
