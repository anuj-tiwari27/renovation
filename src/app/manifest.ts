import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: env.NEXT_PUBLIC_APP_NAME,
    short_name: "CT Elite",
    description: "CT Elite Remodel — kitchen, bath, and full-home discovery, intake, and estimation",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0b0b0b",
    theme_color: "#c9a437",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "New intake", short_name: "Intake", url: "/intake/new" },
      { name: "Dashboard", short_name: "Dashboard", url: "/dashboard" },
      { name: "Leads", short_name: "Leads", url: "/leads" },
    ],
  };
}
