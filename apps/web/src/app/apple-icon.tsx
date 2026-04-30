import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/**
 * Apple home-screen icon. Programmatic so we don't ship a hand-drawn PNG;
 * Next.js generates this at build/request time. iOS Safari and most modern
 * browsers prefer a square solid-fill PNG with no transparency.
 */
export default function AppleIcon() {
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
        }}
      >
        {/* Lowercase 't' built from rectangles so we don't need a font load */}
        <div
          style={{
            position: 'absolute',
            left: 60,
            top: 38,
            width: 18,
            height: 104,
            borderRadius: 6,
            background: '#fff8ec',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 36,
            top: 60,
            width: 66,
            height: 18,
            borderRadius: 6,
            background: '#fff8ec',
          }}
        />
        {/* Brand accent dot */}
        <div
          style={{
            position: 'absolute',
            right: 38,
            bottom: 38,
            width: 18,
            height: 18,
            borderRadius: 999,
            background: '#fff8ec',
          }}
        />
      </div>
    ),
    { ...size },
  );
}
