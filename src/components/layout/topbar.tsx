"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Moon, Sun, LogOut, Wifi, WifiOff } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { initialsOf } from "@/lib/utils";

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
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur lg:px-8">
      <div className="flex items-center gap-3">
        <Badge variant={online ? "secondary" : "warning"} className="gap-1">
          {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {online ? "Online" : "Offline"}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <Button asChild size="sm">
          <Link href="/intake/new"><Plus className="h-4 w-4" /> New intake</Link>
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        {user && (
          <div className="flex items-center gap-2 pl-2">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              {initialsOf(user.full_name || user.email)}
            </div>
            <div className="hidden text-right text-xs sm:block">
              <div className="font-medium">{user.full_name ?? user.email}</div>
              <div className="text-muted-foreground capitalize">{user.role.replace("_", " ")}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
