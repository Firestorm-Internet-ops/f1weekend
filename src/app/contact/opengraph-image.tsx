import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Contact F1 Weekend';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    <div style={{
      background: '#15151E',
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'flex-start', justifyContent: 'flex-end',
      padding: '60px 72px',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: '#E10600' }} />
      <div style={{ fontSize: 22, color: '#B8B8CC', letterSpacing: 4, marginBottom: 20, textTransform: 'uppercase' }}>
        2026 Australian Grand Prix · Melbourne
      </div>
      <div style={{ fontSize: 72, fontWeight: 900, color: '#ffffff', lineHeight: 1.05, marginBottom: 24 }}>
        CONTACT
      </div>
      <div style={{ fontSize: 28, color: '#9a9aaf', maxWidth: 700 }}>
        Get in touch with the F1 Weekend team
      </div>
    </div>,
    { width: 1200, height: 630 }
  );
}
