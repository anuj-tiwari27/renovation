import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const dynamic = "force-static";

const ALLOWED = new Set([192, 384, 512]);

/**
 * Maskable PWA icons.
 *
 * Android's adaptive icon system crops the artwork to whatever shape the
 * launcher uses (circle, squircle, rounded square). The spec requires the
 * critical part of the icon to live inside the central 80% — the
 * "safe zone". Outside that zone may get cropped.
 *
 * We render the wordmark scaled to 62% of the canvas (well inside the safe
 * zone) on the solid brand-black background so the crop never clips the
 * logo and never reveals a transparent area for the OS to theme.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ size: string }> }) {
  const { size: raw } = await ctx.params;
  const size = parseInt(raw, 10);
  if (!ALLOWED.has(size)) {
    return NextResponse.json({ error: "size not allowed" }, { status: 404 });
  }

  const buf = await readFile(join(process.cwd(), "public", "brand", "logo.png"));
  const dataUrl = `data:image/png;base64,${buf.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0b0b",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dataUrl}
          alt=""
          style={{
            // 62% keeps the wordmark fully inside Android's safe zone.
            width: "62%",
            height: "62%",
            objectFit: "contain",
          }}
        />
      </div>
    ),
    { width: size, height: size },
  );
}

export function generateStaticParams() {
  return [...ALLOWED].map((size) => ({ size: String(size) }));
}
