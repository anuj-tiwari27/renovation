import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";

export const dynamic = "force-static";

const ALLOWED = new Set([192, 384, 512]);

export async function GET(_req: Request, ctx: { params: Promise<{ size: string }> }) {
  const { size: raw } = await ctx.params;
  const size = parseInt(raw, 10);
  if (!ALLOWED.has(size)) return NextResponse.json({ error: "size not allowed" }, { status: 404 });

  const fontSize = Math.round(size * 0.62);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #4a63e7 0%, #2f3da3 100%)",
          color: "white",
          fontSize,
          fontWeight: 700,
          letterSpacing: -fontSize * 0.04,
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        R
      </div>
    ),
    { width: size, height: size },
  );
}

export function generateStaticParams() {
  return [...ALLOWED].map((size) => ({ size: String(size) }));
}
