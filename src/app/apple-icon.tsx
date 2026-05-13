import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Apple touch icon — used when iOS users "Add to Home Screen". iOS doesn't
// apply an adaptive mask, but does add a slight rounded-corner inset, so
// we keep a comfortable padding from the edges.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
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
          style={{ width: "84%", height: "84%", objectFit: "contain" }}
        />
      </div>
    ),
    size,
  );
}
