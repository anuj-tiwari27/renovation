import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/settings/profile-form";
import { getCurrentProfile } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Connect Supabase to manage your account.
        </p>
      </div>
    );
  }

  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const isAdmin = profile.role === "admin";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Settings</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Your personal info and account credentials.
          {isAdmin && (
            <>
              {" "}
              Workspace user / role management lives at{" "}
              <Link href="/admin/settings" className="text-primary underline">
                Admin · Settings
              </Link>
              .
            </>
          )}
        </p>
      </div>

      <ProfileForm
        initial={{
          full_name: profile.full_name ?? "",
          email: profile.email,
          phone: profile.phone,
          role: profile.role,
          is_active: profile.is_active,
        }}
      />
    </div>
  );
}
