"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { env } from "@/lib/env";

/**
 * To use the actual company logo instead of the SVG fallback:
 *  1. Save your icon PNG at `public/brand/icon.png` (recommended 512×512).
 *  2. Save your wordmark PNG at `public/brand/logo.png`.
 *  3. Flip these two constants from `.svg` to `.png`.
 *  4. Bump `CACHE_VERSION` in `public/sw.js` so installed PWAs refresh.
 */
const ICON_SRC = "/brand/icon.png";
const LOGO_SRC = "/brand/logo.png";

export function BrandMark({
  size = 28,
  className,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement> & { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={ICON_SRC}
      alt={`${env.NEXT_PUBLIC_APP_NAME} mark`}
      width={size}
      height={size}
      className={cn("shrink-0 select-none object-contain", className)}
      {...props}
    />
  );
}

export function BrandLogo({
  className,
  height = 56,
}: {
  className?: string;
  height?: number;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_SRC}
      alt={env.NEXT_PUBLIC_APP_NAME}
      height={height}
      style={{ height }}
      className={cn("w-auto select-none object-contain", className)}
    />
  );
}
