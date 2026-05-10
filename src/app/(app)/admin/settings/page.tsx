import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { Badge } from "@/components/ui/badge";
import type { Profile } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Settings" };

export default async function SettingsPage() {
  let profiles: Profile[] = [];
  if (isSupabaseConfigured()) {
    const supa = await createClient();
    const { data } = await supa.from("profiles").select("*").order("created_at", { ascending: false });
    profiles = (data as Profile[] | null) ?? [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Admin · Users & roles</h1>
        <p className="text-muted-foreground">Manage who can access what. Change role via Supabase SQL or extend this page.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Users ({profiles.length})</CardTitle><CardDescription>RLS enforces role-based access automatically.</CardDescription></CardHeader>
        <CardContent className="overflow-x-auto">
          {profiles.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">No users yet.</div>
          ) : (
            <table className="w-full min-w-[600px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="pb-3">Name</th><th className="pb-3">Email</th><th className="pb-3">Role</th><th className="pb-3">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {profiles.map((u) => (
                  <tr key={u.id}>
                    <td className="py-3 font-medium">{u.full_name ?? "—"}</td>
                    <td className="py-3 text-muted-foreground">{u.email}</td>
                    <td className="py-3"><Badge variant="secondary" className="capitalize">{u.role.replace("_", " ")}</Badge></td>
                    <td className="py-3">{u.is_active ? <Badge variant="success">Active</Badge> : <Badge>Inactive</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
