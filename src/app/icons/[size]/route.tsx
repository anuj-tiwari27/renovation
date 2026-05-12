import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";

export const dynamic = "force-static";

const ALLOWED = new Set([192, 384, 512]);

/**
 * Brand-aligned PWA install icons.
 *
 * Draws (via Satori-compatible CSS): a black background, a stylized gold roof
 * mark composed of two CSS-triangle peaks with a small chimney, and the
 * "CT ELITE REMODELING" wordmark stacked underneath.
 *
 * To swap in the actual company PNG instead of this rendering, save
 * `public/brand/icon.png` and promote it in `src/app/manifest.ts` (see the
 * commented-out entries there). Browsers will then prefer the PNG.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ size: string }> }) {
  const { size: raw } = await ctx.params;
  const size = parseInt(raw, 10);
  if (!ALLOWED.has(size)) return NextResponse.json({ error: "size not allowed" }, { status: 404 });

  const gold = "#d4a73d";
  const goldLight = "#f4d472";
  const goldDeep = "#9c7416";
  const bg = "#0b0b0b";

  // Geometry tuned so the roof + chimney + wordmark feel proportional.
  const roofHeight = Math.round(size * 0.22);
  const roofBase = Math.round(size * 0.34);
  const smallRoofHeight = Math.round(size * 0.16);
  const smallRoofBase = Math.round(size * 0.26);
  const ctSize = Math.round(size * 0.22);
  const eliteSize = Math.round(size * 0.075);
  const labelSize = Math.round(size * 0.06);

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
        {/* Roof mark — overlapping triangles + a tiny chimney */}
        <div
          style={{
            position: "relative",
            display: "flex",
            width: roofBase * 1.4,
            height: roofHeight + 8,
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          {/* Back (larger) roof */}
          <div
            style={{
              position: "absolute",
              right: 0,
              bottom: 0,
              width: 0,
              height: 0,
              borderLeft: `${roofBase / 2}px solid transparent`,
              borderRight: `${roofBase / 2}px solid transparent`,
              borderBottom: `${roofHeight}px solid ${gold}`,
            }}
          />
          {/* Chimney on the back roof */}
          <div
            style={{
              position: "absolute",
              right: roofBase * 0.18,
              bottom: roofHeight * 0.45,
              width: Math.max(3, Math.round(size * 0.018)),
              height: Math.round(roofHeight * 0.4),
              background: goldDeep,
            }}
          />
          {/* Front (smaller) roof */}
          <div
            style={{
              position: "absolute",
              left: 0,
              bottom: 0,
              width: 0,
              height: 0,
              borderLeft: `${smallRoofBase / 2}px solid transparent`,
              borderRight: `${smallRoofBase / 2}px solid transparent`,
              borderBottom: `${smallRoofHeight}px solid ${goldLight}`,
            }}
          />
        </div>

        {/* Baseline swoosh under the roofs */}
        <div
          style={{
            marginTop: Math.round(size * 0.012),
            height: Math.max(2, Math.round(size * 0.012)),
            width: Math.round(size * 0.5),
            background: gold,
            borderRadius: 9999,
          }}
        />

        {/* Wordmark */}
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
        {/* Tag line on the larger sizes only */}
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
