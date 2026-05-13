import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Estimates" };

interface Row {
  id: string;
  project_id: string;
  status: string;
  total: number;
  updated_at: string;
  projects: { title: string } | null;
}

export default async function EstimatesPage() {
  let rows: Row[] = [];
  if (isSupabaseConfigured()) {
    const supa = await createClient();
    const { data } = await supa
      .from("estimates")
      .select("id, project_id, status, total, updated_at, projects(title)")
      .order("updated_at", { ascending: false });
    rows = (data as unknown as Row[]) ?? [];
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Estimates</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Drafts, sent proposals, and accepted projects.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All estimates ({rows.length})</CardTitle>
          <CardDescription>Click a row to edit.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {rows.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
              No estimates yet.
            </div>
          ) : (
            <table className="w-full min-w-[640px] text-sm">
              <colgroup>
                <col className="w-auto" />
                <col className="w-32" />
                <col className="w-28" />
                <col className="w-32" />
              </colgroup>
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr className="border-b">
                  <th className="py-3 pr-4 font-medium">Project</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  <th className="py-3 pr-4 text-right font-medium">Total</th>
                  <th className="py-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.id} className="align-middle">
                    <td className="py-3 pr-4">
                      <Link
                        className="font-medium hover:underline"
                        href={`/projects/${r.project_id}/estimate`}
                      >
                        {r.projects?.title ?? "—"}
                      </Link>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant="secondary" className="capitalize">
                        {r.status}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums">{formatCurrency(r.total)}</td>
                    <td className="py-3 whitespace-nowrap text-muted-foreground">
                      {formatDate(r.updated_at)}
                    </td>
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
