import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          fontSize: 22,
          fontWeight: 700,
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          borderRadius: 8,
        }}
      >
        R
      </div>
    ),
    size,
  );
}
