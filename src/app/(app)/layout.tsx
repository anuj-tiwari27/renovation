import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { getCurrentProfile } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // If Supabase isn't wired up yet, render the shell anyway so devs can preview UI.
  let profile: Awaited<ReturnType<typeof getCurrentProfile>> = null;
  if (isSupabaseConfigured()) {
    profile = await getCurrentProfile();
    if (!profile) redirect("/login");
  }

  return (
    <div className="flex min-h-svh">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar
          user={
            profile
              ? { full_name: profile.full_name, email: profile.email, role: profile.role }
              : { full_name: "Preview", email: "preview@local", role: "admin" }
          }
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
