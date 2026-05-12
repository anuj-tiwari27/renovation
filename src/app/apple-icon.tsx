import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const gold = "#d4a73d";
  const goldLight = "#f4d472";
  const goldDeep = "#9c7416";
  const bg = "#0b0b0b";
  const S = 180;

  const roofHeight = Math.round(S * 0.22);
  const roofBase = Math.round(S * 0.34);
  const smallRoofHeight = Math.round(S * 0.16);
  const smallRoofBase = Math.round(S * 0.26);

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
          <div
            style={{
              position: "absolute", right: 0, bottom: 0, width: 0, height: 0,
              borderLeft: `${roofBase / 2}px solid transparent`,
              borderRight: `${roofBase / 2}px solid transparent`,
              borderBottom: `${roofHeight}px solid ${gold}`,
            }}
          />
          <div
            style={{
              position: "absolute", right: roofBase * 0.18, bottom: roofHeight * 0.45,
              width: 4, height: Math.round(roofHeight * 0.4), background: goldDeep,
            }}
          />
          <div
            style={{
              position: "absolute", left: 0, bottom: 0, width: 0, height: 0,
              borderLeft: `${smallRoofBase / 2}px solid transparent`,
              borderRight: `${smallRoofBase / 2}px solid transparent`,
              borderBottom: `${smallRoofHeight}px solid ${goldLight}`,
            }}
          />
        </div>
        <div style={{ marginTop: 4, height: 3, width: 90, background: gold, borderRadius: 9999 }} />
        <div style={{ marginTop: 10, fontSize: 36, fontWeight: 700, letterSpacing: 2, color: gold, lineHeight: 1 }}>
          CT ELITE
        </div>
        <div style={{ marginTop: 4, fontSize: 12, letterSpacing: 7, color: goldLight }}>
          REMODELING
        </div>
      </div>
    ),
    size,
  );
}
