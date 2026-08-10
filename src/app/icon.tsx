import { ImageResponse } from 'next/og';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

/** Ícone PWA Starmoon — letra S */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000000',
          color: '#ffffff',
          fontSize: 280,
          fontWeight: 800,
          letterSpacing: '-0.08em',
          fontFamily: 'Arial Black, Arial, sans-serif',
        }}
      >
        S
      </div>
    ),
    { ...size }
  );
}
