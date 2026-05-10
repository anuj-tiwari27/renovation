import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { getCurrentProfile } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (isSupabaseConfigured()) {
    const profile = await getCurrentProfile();
    if (!profile) redirect("/login");
  }

  return (
    <div className="flex min-h-svh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
