"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { env } from "@/lib/env";

/**
 * The brand mark — gold roof icon. Backed by /public/brand/icon.svg by default.
 *
 * To swap in your exact PNG: save it at `public/brand/icon.png` and change the
 * `src` below from `icon.svg` to `icon.png`.
 */
export function BrandMark({
  size = 28,
  className,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement> & { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/icon.svg"
      alt={`${env.NEXT_PUBLIC_APP_NAME} mark`}
      width={size}
      height={size}
      className={cn("shrink-0 select-none", className)}
      {...props}
    />
  );
}

/**
 * The full wordmark (icon + "CT ELITE REMODEL" text). Use this in hero spots,
 * not in tight nav rows.
 */
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
      src="/brand/logo.svg"
      alt={env.NEXT_PUBLIC_APP_NAME}
      height={height}
      style={{ height }}
      className={cn("w-auto select-none", className)}
    />
  );
}
