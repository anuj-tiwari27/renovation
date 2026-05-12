import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
            fontSize: 70,
            fontWeight: 700,
            letterSpacing: 2,
            lineHeight: 1,
          }}
        >
          CT
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: 18,
            letterSpacing: 6,
            color: "#f4d472",
          }}
        >
          ELITE
        </div>
      </div>
    ),
    size,
  );
}
