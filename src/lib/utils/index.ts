export { cn } from "./cn";

export const formatCurrency = (n: number | null | undefined, currency = "USD") => {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
};

// SSR-safe Intl formatters.
//
// Vercel's Node runtime defaults to UTC; the browser uses the user's local
// timezone. A single timestamp like "2026-05-13T23:00:00Z" would otherwise
// format as "May 13" on the server and "May 14" on a Mumbai client — that's
// the source of React #418 hydration errors we keep seeing.
//
// We pin every date/time formatter to UTC so server-rendered HTML and the
// first client hydration pass are byte-identical. Client-only views that
// want the user's local timezone should compute that after `mounted` flips
// true (use `formatDateLocal` / `formatTimeLocal` for those).
export const formatDate = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(dt);
};

export const formatTime = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(dt);
};

/**
 * Use only AFTER a `mounted` flag has flipped true in a client component.
 * Returns the user's local timezone formatting — never call this during
 * the initial SSR pass.
 */
export const formatDateLocal = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(dt);
};

export const formatTimeLocal = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(dt);
};

export const initialsOf = (name?: string | null) =>
  (name || "")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "—";

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
