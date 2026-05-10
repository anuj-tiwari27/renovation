"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Moon, Sun, LogOut, Wifi, WifiOff, Menu, Hammer } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SidebarNav } from "@/components/layout/sidebar";
import { InstallPrompt } from "@/components/pwa-install";
import { createClient } from "@/lib/supabase/client";
import { initialsOf } from "@/lib/utils";
import { env } from "@/lib/env";

export function Topbar({ user }: { user?: { full_name: string | null; email: string; role: string } }) {
  const { theme, setTheme } = useTheme();
  const [online, setOnline] = React.useState(true);

  React.useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const signOut = async () => {
    await createClient().auth.signOut();
    location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b border-border bg-background/80 px-3 backdrop-blur sm:px-4 lg:px-8">
      <div className="flex min-w-0 items-center gap-2">
        {/* Mobile hamburger */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SidebarNav closable />
          </SheetContent>
        </Sheet>

        {/* App name (mobile only — desktop sidebar already shows it) */}
        <Link href="/dashboard" className="flex items-center gap-1.5 lg:hidden">
          <Hammer className="h-4 w-4 text-primary" />
          <span className="truncate text-sm font-semibold">{env.NEXT_PUBLIC_APP_NAME}</span>
        </Link>

        <Badge variant={online ? "secondary" : "warning"} className="ml-1 hidden gap-1 sm:inline-flex">
          {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {online ? "Online" : "Offline"}
        </Badge>
        {/* Tiny dot version for very small screens */}
        <span
          aria-hidden
          className={
            "ml-1 inline-block h-2 w-2 shrink-0 rounded-full sm:hidden " +
            (online ? "bg-emerald-500" : "bg-amber-500")
          }
          title={online ? "Online" : "Offline"}
        />
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <div className="hidden md:block">
          <InstallPrompt variant="button" />
        </div>
        <Button asChild size="sm" className="hidden sm:inline-flex">
          <Link href="/intake/new">
            <Plus className="h-4 w-4" /> New intake
          </Link>
        </Button>
        <Button asChild size="icon" className="sm:hidden" aria-label="New intake">
          <Link href="/intake/new"><Plus className="h-4 w-4" /></Link>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {user && (
          <div className="flex items-center gap-2 pl-1 sm:pl-2">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              {initialsOf(user.full_name || user.email)}
            </div>
            <div className="hidden text-right text-xs md:block">
              <div className="max-w-[140px] truncate font-medium">{user.full_name ?? user.email}</div>
              <div className="capitalize text-muted-foreground">{user.role.replace("_", " ")}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
