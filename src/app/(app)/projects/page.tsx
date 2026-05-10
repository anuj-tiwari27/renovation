import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Project } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Projects" };

export default async function ProjectsPage() {
  let rows: Project[] = [];
  if (isSupabaseConfigured()) {
    const supa = await createClient();
    const { data } = await supa.from("projects").select("*").order("updated_at", { ascending: false });
    rows = (data as Project[] | null) ?? [];
  }
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">All projects across stages.</p>
        </div>
        <Button asChild><Link href="/intake/new">New intake</Link></Button>
      </div>
      <Card>
        <CardHeader><CardTitle>All projects ({rows.length})</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="pb-3">Title</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Value</th>
                <th className="pb-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((p) => (
                <tr key={p.id}>
                  <td className="py-3"><Link className="font-medium hover:underline" href={`/projects/${p.id}`}>{p.title}</Link></td>
                  <td className="py-3 capitalize text-muted-foreground">{p.type.replace("_"," ")}</td>
                  <td className="py-3"><Badge variant="secondary">{p.status.replace("_"," ")}</Badge></td>
                  <td className="py-3">{formatCurrency(p.expected_value)}</td>
                  <td className="py-3 text-muted-foreground">{formatDate(p.updated_at)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={5} className="py-12 text-center text-muted-foreground">No projects yet.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
