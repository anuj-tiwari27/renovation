"use client";

import * as React from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackLabel?: string;
}

/**
 * Image with a graceful fallback when the source 404s, the signed URL
 * expires, or the user is offline. Shows a neutral icon tile so the
 * gallery grid doesn't render a broken-image glyph.
 */
export function Thumbnail({ fallbackLabel, className, src, alt = "", ...rest }: Props) {
  const [failed, setFailed] = React.useState(false);
  // Reset failure flag when the src changes (e.g. signed URL refresh).
  React.useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed || !src) {
    return (
      <div
        role="img"
        aria-label={fallbackLabel ?? "Image unavailable"}
        className={cn(
          "grid h-full w-full place-items-center bg-muted text-muted-foreground",
          className,
        )}
      >
        <div className="flex flex-col items-center gap-1">
          <ImageOff className="h-6 w-6 opacity-60" />
          <span className="text-[10px] uppercase tracking-wide">
            {fallbackLabel ?? "No preview"}
          </span>
        </div>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className={className}
      {...rest}
    />
  );
}
