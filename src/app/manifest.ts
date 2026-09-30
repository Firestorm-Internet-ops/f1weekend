import type { MetadataRoute } from 'next';

/** Web app manifest: name, colours and the icons Android / Google use (home screen, search). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'F1 Weekend',
    short_name: 'F1 Weekend',
    description: 'Plan your F1 race weekend: session times, getting to the circuit and things to do between sessions.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F6F5F2',
    theme_color: '#E10600',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
