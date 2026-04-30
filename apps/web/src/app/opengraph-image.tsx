import { ImageResponse } from 'next/og';

export const alt = 'trazabilidad — ERP para productores de alimentos';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Default social-share card. Renders the brand mark + value prop on the
 * cream canvas with terracotta accent strip — same visual language as the
 * auth shell so a Twitter/Slack preview reads as the same product.
 *
 * Programmatic: regenerates at request time, picks up future copy/color
 * changes without ever needing a designer to re-export a PNG.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#faf7f2',
          display: 'flex',
          flexDirection: 'column',
          padding: '64px',
          fontFamily: 'serif',
          position: 'relative',
        }}
      >
        {/* Terracotta accent strip on the left edge */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: 12,
            background: '#9c4221',
          }}
        />

        {/* Header — monogram + small wordmark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            color: '#1c1a17',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: '#9c4221',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 19,
                top: 12,
                width: 6,
                height: 32,
                borderRadius: 2,
                background: '#fff8ec',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 12,
                top: 19,
                width: 20,
                height: 6,
                borderRadius: 2,
                background: '#fff8ec',
              }}
            />
            <div
              style={{
                position: 'absolute',
                right: 11,
                bottom: 11,
                width: 8,
                height: 8,
                borderRadius: 999,
                background: '#fff8ec',
              }}
            />
          </div>
          <span style={{ fontSize: 30, fontWeight: 500, letterSpacing: -0.5 }}>
            trazabilidad
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            flex: 1,
            gap: 16,
            color: '#1c1a17',
          }}
        >
          <p
            style={{
              fontFamily: 'sans-serif',
              fontSize: 18,
              fontWeight: 500,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: '#736e66',
              margin: 0,
            }}
          >
            ERP · Argentina · AFIP
          </p>
          <h1
            style={{
              fontSize: 72,
              fontWeight: 500,
              letterSpacing: -2,
              lineHeight: 1.05,
              margin: 0,
              maxWidth: 880,
            }}
          >
            El sistema diseñado para
            <br />
            <span style={{ color: '#9c4221' }}>productores de alimentos.</span>
          </h1>
          <p
            style={{
              fontFamily: 'sans-serif',
              fontSize: 22,
              color: '#3a3631',
              margin: 0,
              marginTop: 8,
              maxWidth: 800,
            }}
          >
            Compras, producción, inventario, ventas y facturación electrónica.
          </p>
        </div>
      </div>
    ),
    { ...size },
  );
}
