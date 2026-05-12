import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

/**
 * PWA manifest. Install icons point at /brand/icon.png — drop the real
 * company logo at public/brand/icon.png (recommended 512×512 PNG) and
 * Android/Chrome will pick it up on next install. While that file is
 * missing the browser falls back to the dynamic /icons/[size] route
 * (gold "CT" wordmark) so install never breaks.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: env.NEXT_PUBLIC_APP_NAME,
    short_name: "CT Elite Remodeling",
    description: "CT Elite Remodeling — kitchen, bath, and full-home discovery, intake, and estimation",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0b0b0b",
    theme_color: "#c9a437",
    categories: ["business", "productivity"],
    icons: [
      // Real company logo — preferred.
      { src: "/brand/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/icon.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      // Dynamic fallbacks (next/og) — generated on the fly, always available.
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/384", sizes: "384x384", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
    shortcuts: [
      { name: "New intake", short_name: "Intake", url: "/intake/new" },
      { name: "Dashboard", short_name: "Dashboard", url: "/dashboard" },
      { name: "Leads", short_name: "Leads", url: "/leads" },
    ],
  };
}
