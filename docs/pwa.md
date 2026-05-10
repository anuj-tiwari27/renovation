# Use Remodel Studio as a PWA

Remodel Studio is built as a Progressive Web App. Once deployed (on HTTPS), it can be installed on any modern device — Mac, Windows, iPad, iPhone, Android — and used offline during onsite consultations.

## How users install it

### On desktop (Chrome / Edge / Brave / Arc)
- Visit your deployed URL.
- Look for the **install icon** in the address bar (a small monitor with a down-arrow). Click it → **Install**.
- Or: click the **Install app** button that appears in the top-right of the dashboard.
- Or: browser menu → **Install Remodel Studio**.

### On Android (Chrome / Edge)
- Visit your deployed URL.
- Tap the in-app install banner (auto-shown), or tap the browser menu → **Install app** / **Add to Home screen**.
- The app launches in standalone mode — no address bar, like a native app.

### On iPhone / iPad (Safari)
Apple doesn't expose a programmatic install API, so this is manual:
- Visit your deployed URL in **Safari** (not Chrome — Chrome on iOS uses Safari's engine but doesn't expose Add to Home Screen).
- Tap the **Share** button (square with up-arrow).
- Scroll → **Add to Home Screen** → **Add**.
- The icon appears on the home screen and launches the app full-screen.

The app already detects iOS and shows the share-button hint automatically.

## How it works

| Concern | Mechanism |
| --- | --- |
| Manifest | `src/app/manifest.ts` (Next.js generates `/manifest.webmanifest` automatically) |
| Icons | `src/app/icon.tsx` (favicon), `src/app/apple-icon.tsx` (180×180), `src/app/icons/[size]/route.tsx` (192/384/512 PNGs from `next/og`'s `ImageResponse`) — no static binaries to ship |
| Service worker | `public/sw.js` — registered by `src/components/offline-watcher.tsx` on first visit |
| Install prompt | `src/components/pwa-install.tsx` — listens for `beforeinstallprompt`, shows a card on mobile and a button in the topbar on desktop, supports iOS share-sheet hint, snoozes for 72h on dismiss |

## Caching strategy

- HTML navigations: **network-first**, fall back to cached app shell + `/offline` page.
- `_next/static`, `/icons/*`, fonts, `manifest.webmanifest`: **stale-while-revalidate**.
- Supabase API GETs: **network-first** with short cache.
- Mutations (POST/PUT/PATCH/DELETE) are **never** cached by the SW — they go through the in-app IndexedDB outbox so reconnecting always replays the latest, idempotent state.

## Force a service worker update

Bump `CACHE_VERSION` in `public/sw.js`:

```diff
-const CACHE_VERSION = "v2";
+const CACHE_VERSION = "v3";
```

The SW activates the new version on next page load and clears old caches.

## Verifying it actually installed

- Chrome DevTools → **Application** → **Manifest**: should show name, icons rendered, no errors.
- **Application** → **Service Workers**: status `activated and is running`.
- Hit **Offline** in the Network panel → reload the dashboard. You should see the offline shell instead of "no internet". Open `/intake/[your-project]` → fill answers → toggle online → watch the toast "Synced N changes".

## Push notifications (optional)

The SW already handles `push` and `notificationclick`. To start sending pushes:

1. Generate VAPID keys: `npx web-push generate-vapid-keys`
2. Add an endpoint that `subscription.subscribe(...)`s with your public key.
3. Persist subscriptions per user (Supabase table is straightforward).
4. Server-side use `web-push` to deliver — payload `{ title, body, url }`.

## Common gotchas

- **"Install" doesn't appear on desktop.** Chrome only offers it on HTTPS (or `localhost`), with a valid manifest, and a registered SW. Check DevTools → Application → Manifest for warnings. The most common cause used to be 404 icon URLs — that's now fixed (icons are dynamic Next routes).
- **iOS doesn't open in standalone.** Make sure you used Safari (not Chrome) when adding. Other iOS browsers can't install.
- **Cache feels stale after deploy.** Bump `CACHE_VERSION` (above). Or, in DevTools, Application → Service Workers → **Update on reload**.
