"use client";

import * as React from "react";
import { Download, Share, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "remodel-install-dismissed-at";
const DISMISS_HOURS = 72;

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  // iOS Safari
  return Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

function isIos(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
}

function recentlyDismissed(): boolean {
  if (typeof window === "undefined") return false;
  const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
  if (!at) return false;
  return Date.now() - at < DISMISS_HOURS * 60 * 60 * 1000;
}

export function InstallPrompt({ variant = "card" }: { variant?: "card" | "button" }) {
  const [deferred, setDeferred] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = React.useState<boolean>(false);
  const [iosHint, setIosHint] = React.useState<boolean>(false);
  const [hidden, setHidden] = React.useState<boolean>(true);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    if (recentlyDismissed()) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setHidden(false);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      setHidden(true);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    if (isIos() && !isStandalone()) {
      setIosHint(true);
      setHidden(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") {
      setDeferred(null);
      setHidden(true);
    } else {
      dismiss();
    }
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setHidden(true);
  };

  if (installed || hidden || (!deferred && !iosHint)) return null;

  if (variant === "button") {
    if (iosHint) return null; // no programmatic install on iOS
    return (
      <Button size="sm" onClick={install} variant="outline">
        <Download className="h-4 w-4" /> Install app
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "fixed inset-x-3 bottom-3 z-40 flex items-start gap-3 rounded-xl border bg-card p-3 shadow-lg",
        "sm:inset-x-auto sm:right-4 sm:bottom-4 sm:max-w-sm",
      )}
      role="dialog"
      aria-label="Install app"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <Smartphone className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">Install Remodel Studio</div>
        {iosHint ? (
          <p className="mt-0.5 text-xs text-muted-foreground">
            On iOS, tap the <Share className="-mt-0.5 inline h-3 w-3" /> share button → <em>Add to Home Screen</em>.
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-muted-foreground">
            Add to your home screen for offline-friendly use during onsite consults.
          </p>
        )}
        {!iosHint && (
          <Button size="sm" onClick={install} className="mt-2">
            <Download className="h-4 w-4" /> Install
          </Button>
        )}
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={dismiss}
        className="-mr-1 -mt-1 rounded-md p-1 text-muted-foreground hover:bg-accent"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
