import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Favicon. Next picks this up at /icon and emits the <link rel="icon"> tag.
// Output is 512x512 PNG — browsers downscale to the tab favicon themselves.
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default async function Icon() {
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
          style={{ width: "82%", height: "82%", objectFit: "contain" }}
        />
      </div>
    ),
    size,
  );
}
