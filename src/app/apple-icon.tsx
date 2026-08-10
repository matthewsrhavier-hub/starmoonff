import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/** Ícone Apple Touch — letra S */
export default function AppleIcon() {
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
          fontSize: 110,
          fontWeight: 800,
          letterSpacing: '-0.08em',
          fontFamily: 'Arial Black, Arial, sans-serif',
          borderRadius: 40,
        }}
      >
        S
      </div>
    ),
    { ...size }
  );
}
