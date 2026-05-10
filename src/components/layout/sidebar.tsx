"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  ClipboardList,
  FileText,
  Calendar,
  Settings,
  Hammer,
  Image as ImageIcon,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { env } from "@/lib/env";
import { SheetClose } from "@/components/ui/sheet";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/projects", label: "Projects", icon: ClipboardList },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/estimates", label: "Estimates", icon: FileText },
  { href: "/inspiration", label: "Inspiration", icon: ImageIcon },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function SidebarNav({ closable = false }: { closable?: boolean }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
        <Hammer className="h-5 w-5 text-primary" />
        <span className="font-semibold">{env.NEXT_PUBLIC_APP_NAME}</span>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            const link = (
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" /> {label}
              </Link>
            );
            return (
              <li key={href}>{closable ? <SheetClose asChild>{link}</SheetClose> : link}</li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-border p-4 text-xs text-muted-foreground">
        v0.1 · {env.NEXT_PUBLIC_COMPANY_NAME}
      </div>
    </div>
  );
}

/** Desktop sidebar — hidden below the lg breakpoint. */
export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card/50 lg:flex lg:flex-col">
      <SidebarNav />
    </aside>
  );
}
