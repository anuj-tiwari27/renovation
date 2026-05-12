# CT Elite Remodel branding

The platform ships pre-branded for **CT Elite Remodel**. The name, gold accent
color, and SVG icon/logo fallbacks are all in place. To finish swapping in the
exact images you sent over, follow the four-file checklist below.

## Files involved

| Path | What lives there |
| --- | --- |
| `public/brand/icon.svg` | SVG roof mark used in the sidebar / topbar / login / signup. Default fallback so the app never 404s. |
| `public/brand/logo.svg` | SVG wordmark + tagline used on the landing page hero. |
| `src/app/icon.tsx` | Dynamic 32×32 favicon (gold "CT" on black). |
| `src/app/apple-icon.tsx` | Dynamic 180×180 Apple touch icon. |
| `src/app/icons/[size]/route.tsx` | Dynamic 192/384/512 PWA install icons. |

Names, theme color (`#c9a437` gold), background color, and the manifest description
all come from `src/app/manifest.ts` + `src/lib/env.ts`.

## Swap to your exact PNGs (5 minutes)

You sent two artwork files — the full **gold wordmark on black** and the **gold
roof icon on black**. Here's how to wire them in.

### 1. Save the in-app assets

Put the two files at these paths (you can drag-and-drop in your editor):

```
public/brand/icon.png    ← the gold roof icon (square; 512×512 or 1024×1024 ideal)
public/brand/logo.png    ← the full "CT ELITE REMODEL" lockup
```

Then update the two `src=` strings in `src/components/brand.tsx`:

```diff
- src="/brand/icon.svg"
+ src="/brand/icon.png"
```

```diff
- src="/brand/logo.svg"
+ src="/brand/logo.png"
```

You can also delete the `.svg` fallbacks once the PNGs are in place — or keep
them around as a fallback.

### 2. Replace the favicon + PWA icons with the real artwork

The cleanest way to use Next's metadata convention is to drop static PNG files
where Next looks for them; the static files take priority over the dynamic
`icon.tsx` / `apple-icon.tsx`.

```
src/app/icon.png         ← the gold roof icon (any square; 512×512 fine; Next auto-resizes for favicons)
src/app/apple-icon.png   ← the same icon, sized for iOS (180×180 recommended)
```

Once those PNGs exist, delete the dynamic generators:

```bash
rm src/app/icon.tsx src/app/apple-icon.tsx
```

For the PWA's 192/384/512 install icons (used by `manifest.webmanifest`), the
simplest path is to keep the dynamic route at `src/app/icons/[size]/route.tsx`
but make it serve the same PNG. Easier still: replace the manifest entries to
point at a single static file:

```diff
// src/app/manifest.ts
- { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
- { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "maskable" },
- { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
- { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
+ { src: "/brand/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
+ { src: "/brand/icon.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
```

(Browsers downscale a 512×512 source for the 192 slot just fine. If you want
crisper renders at small sizes, export the icon at the smaller size and add
both entries.)

### 3. Bump the service-worker cache so installed PWAs refresh

Already done in commit-history — `CACHE_VERSION` was bumped to `v3` as part of
the rebrand. Re-bump it any time you swap brand artwork so existing installs
pick up the change:

```diff
// public/sw.js
- const CACHE_VERSION = "v3";
+ const CACHE_VERSION = "v4";
```

## Theme tokens

The gold has been wired through Tailwind tokens (see `src/app/globals.css`).
You can tune the exact hue in two places:

- `--primary: 42 71% 45%` (HSL — primary buttons, ring focus, accents)
- `--color-brand-500: #c9a437` (and friends — used by `text-brand-*`, `bg-brand-*`)

The landing page hero uses a gradient `from-brand-500 to-brand-700` for the
headline accent — adjust those two if you want a tighter or looser gold sweep.

## Names and copy

If you want to change the app name without touching code, just set env vars:

```
NEXT_PUBLIC_APP_NAME="CT Elite Remodel"
NEXT_PUBLIC_COMPANY_NAME="CT Elite Remodel"
```

Both default to "CT Elite Remodel" already (in `src/lib/env.ts`), so it works
out of the box even without env overrides.
