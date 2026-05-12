import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";

export const dynamic = "force-static";

const ALLOWED = new Set([192, 384, 512]);

/**
 * Brand-aligned PWA install icons.
 *
 * Drawn with Satori-compatible JSX. The roof is an inline <svg> (Satori
 * supports it) so we get crisp triangles instead of the CSS-border hack
 * Satori doesn't honor.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ size: string }> }) {
  const { size: raw } = await ctx.params;
  const size = parseInt(raw, 10);
  if (!ALLOWED.has(size)) return NextResponse.json({ error: "size not allowed" }, { status: 404 });

  const gold = "#d4a73d";
  const goldLight = "#f4d472";
  const goldDeep = "#9c7416";
  const bg = "#0b0b0b";

  // Roof sizing proportional to the icon canvas.
  const roofW = Math.round(size * 0.5);
  const roofH = Math.round(roofW * 0.55);

  const ctSize = Math.round(size * 0.22);
  const eliteSize = Math.round(size * 0.075);
  const labelSize = Math.round(size * 0.06);

  // Pre-render the roof SVG. viewBox 200x110 with stroke-based outlines
  // (matches the public/brand/icon.svg approximation).
  const roof = (
    <svg
      width={roofW}
      height={roofH}
      viewBox="0 0 200 110"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Back (larger) roof */}
      <path
        d="M 30 80 L 110 22 L 190 80 Z"
        fill={bg}
        stroke={gold}
        strokeWidth="6"
        strokeLinejoin="round"
      />
      {/* Chimney */}
      <rect x="160" y="36" width="9" height="22" fill={goldDeep} />
      {/* Front (smaller) roof */}
      <path
        d="M 10 80 L 70 42 L 130 80 Z"
        fill={bg}
        stroke={goldLight}
        strokeWidth="6"
        strokeLinejoin="round"
      />
      {/* Baseline swoosh */}
      <path
        d="M 4 84 Q 100 104 196 84"
        fill="none"
        stroke={gold}
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Big-house window (2x2 grid) */}
      <g transform="translate(98 50)">
        <rect width="22" height="22" fill={gold} />
        <line x1="11" y1="0" x2="11" y2="22" stroke={bg} strokeWidth="2.5" />
        <line x1="0" y1="11" x2="22" y2="11" stroke={bg} strokeWidth="2.5" />
      </g>
      {/* Small-house window */}
      <g transform="translate(58 60)">
        <rect width="16" height="16" fill={goldLight} />
        <line x1="8" y1="0" x2="8" y2="16" stroke={bg} strokeWidth="2" />
        <line x1="0" y1="8" x2="16" y2="8" stroke={bg} strokeWidth="2" />
      </g>
    </svg>
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: bg,
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        {roof}

        <div
          style={{
            marginTop: Math.round(size * 0.04),
            fontSize: ctSize,
            fontWeight: 700,
            letterSpacing: ctSize * 0.04,
            color: gold,
            lineHeight: 1,
          }}
        >
          CT ELITE
        </div>
        <div
          style={{
            marginTop: Math.round(size * 0.015),
            fontSize: eliteSize,
            letterSpacing: eliteSize * 0.55,
            color: goldLight,
          }}
        >
          REMODELING
        </div>
        {size >= 384 && (
          <div
            style={{
              marginTop: Math.round(size * 0.02),
              fontSize: labelSize,
              letterSpacing: labelSize * 0.3,
              color: goldDeep,
            }}
          >
            KITCHEN · BATH · FULL HOME
          </div>
        )}
      </div>
    ),
    { width: size, height: size },
  );
}

export function generateStaticParams() {
  return [...ALLOWED].map((size) => ({ size: String(size) }));
}
