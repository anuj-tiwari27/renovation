import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

/**
 * PWA manifest.
 *
 * All icon entries point at dynamic routes that composite the user's
 * /public/brand/logo.png onto a solid black canvas. This is necessary
 * because the raw logo PNG has a transparent background — Android's
 * adaptive icon system would fill that transparency with the system
 * theme color (showing the logo on a light tile on the home screen).
 *
 * - /icons/{size}            -> "any" purpose, logo at 82% of canvas
 * - /icons/maskable/{size}   -> "maskable" purpose, logo at 62% (safe zone)
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: env.NEXT_PUBLIC_APP_NAME,
    short_name: "CT Elite Remodeling",
    description:
      "CT Elite Remodeling — kitchen, bath, and full-home discovery, intake, and estimation",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0b0b0b",
    theme_color: "#0b0b0b",
    categories: ["business", "productivity"],
    icons: [
      // Maskable first — Android prefers these for adaptive home screen icons
      { src: "/icons/maskable/192", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
      // "Any" — used on iOS, browser tabs, smaller surfaces
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
