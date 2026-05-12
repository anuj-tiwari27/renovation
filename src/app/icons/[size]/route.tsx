import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";

export const dynamic = "force-static";

const ALLOWED = new Set([192, 384, 512]);

export async function GET(_req: Request, ctx: { params: Promise<{ size: string }> }) {
  const { size: raw } = await ctx.params;
  const size = parseInt(raw, 10);
  if (!ALLOWED.has(size)) return NextResponse.json({ error: "size not allowed" }, { status: 404 });

  const ctSize = Math.round(size * 0.42);
  const eliteSize = Math.round(size * 0.1);
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
          background: "#0b0b0b",
          color: "#d4a73d",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        <div
          style={{
            fontSize: ctSize,
            fontWeight: 700,
            letterSpacing: 4,
            lineHeight: 1,
          }}
        >
          CT
        </div>
        <div
          style={{
            marginTop: size * 0.04,
            fontSize: eliteSize,
            letterSpacing: eliteSize * 0.45,
            color: "#f4d472",
          }}
        >
          ELITE
        </div>
        <div
          style={{
            marginTop: size * 0.02,
            fontSize: Math.round(eliteSize * 0.6),
            letterSpacing: eliteSize * 0.3,
            color: "#9c7416",
          }}
        >
          REMODEL
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}

export function generateStaticParams() {
  return [...ALLOWED].map((size) => ({ size: String(size) }));
}
