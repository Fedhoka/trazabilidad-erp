import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

/**
 * Browser tab favicon. Replaces the Vercel-triangle default. Next.js
 * generates this PNG at request time and serves it as /icon.png with the
 * correct headers — no manual asset export needed.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#9c4221',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          borderRadius: 6,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 11,
            top: 7,
            width: 3,
            height: 18,
            borderRadius: 1,
            background: '#fff8ec',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 7,
            top: 11,
            width: 11,
            height: 3,
            borderRadius: 1,
            background: '#fff8ec',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 6,
            bottom: 6,
            width: 4,
            height: 4,
            borderRadius: 999,
            background: '#fff8ec',
          }}
        />
      </div>
    ),
    { ...size },
  );
}
