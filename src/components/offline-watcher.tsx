"use client";
import * as React from "react";
import { toast } from "sonner";
import { startAutoFlush, flush, pending } from "@/lib/offline/outbox";

export function OfflineWatcher() {
  React.useEffect(() => {
    startAutoFlush();
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    let wasOffline = !navigator.onLine;
    const handleOnline = async () => {
      if (wasOffline) toast.success("Back online — syncing pending changes…");
      wasOffline = false;
      const pendingRows = await pending();
      if (pendingRows.length) {
        const result = await flush();
        if (result.ok) toast.success(`Synced ${result.ok} change${result.ok === 1 ? "" : "s"}`);
      }
    };
    const handleOffline = () => {
      wasOffline = true;
      toast.warning("You're offline — changes will sync when reconnected.");
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  return null;
}
