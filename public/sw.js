/* CT Elite Remodeling service worker
 * Strategy:
 *  - HTML navigations: network-first, fall back to cached app shell + offline page
 *  - Static assets (_next, fonts, icons): stale-while-revalidate
 *  - Supabase API GETs: network-first with short cache
 *  - POST/PUT/PATCH/DELETE for mutating endpoints: queued via Background Sync (handled in app via IndexedDB; SW relays the trigger)
 */

const CACHE_VERSION = "v6";
const PRECACHE = `precache-${CACHE_VERSION}`;
const RUNTIME = `runtime-${CACHE_VERSION}`;
const APP_SHELL = [
  "/",
  "/offline",
  "/manifest.webmanifest",
  "/brand/logo.png",
  "/icons/192",
  "/icons/512",
  "/icons/maskable/192",
  "/icons/maskable/512",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => ![PRECACHE, RUNTIME].includes(k)).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

const isHTML = (request) =>
  request.mode === "navigate" || (request.headers.get("accept") || "").includes("text/html");

const isStatic = (url) =>
  url.pathname.startsWith("/_next/static") ||
  url.pathname.startsWith("/icons/") ||
  url.pathname === "/icon" ||
  url.pathname === "/apple-icon" ||
  url.pathname === "/manifest.webmanifest" ||
  url.pathname.startsWith("/fonts/");

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return; // mutations handled by app-level outbox

  const url = new URL(request.url);

  if (isHTML(request)) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME).then((c) => c.put(request, copy));
          return res;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match("/offline"))),
    );
    return;
  }

  if (isStatic(url)) {
    event.respondWith(
      caches.open(RUNTIME).then(async (cache) => {
        const cached = await cache.match(request);
        const fetched = fetch(request)
          .then((res) => {
            cache.put(request, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || fetched;
      }),
    );
    return;
  }

  if (url.hostname.endsWith("supabase.co")) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request)),
    );
  }
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "FLUSH_OUTBOX") {
    self.clients.matchAll().then((clients) =>
      clients.forEach((client) => client.postMessage({ type: "FLUSH_OUTBOX" })),
    );
  }
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = (() => {
    try {
      return event.data.json();
    } catch {
      return { title: "CT Elite Remodeling", body: event.data.text() };
    }
  })();
  event.waitUntil(
    self.registration.showNotification(data.title || "CT Elite Remodeling", {
      body: data.body || "",
      icon: "/icons/192",
      badge: "/icons/192",
      data: data.url ? { url: data.url } : undefined,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";
  event.waitUntil(self.clients.openWindow(url));
});
