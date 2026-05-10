import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { formatCurrency } from "@/lib/utils";
import type { Project, ProjectStatus } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics" };

const TERMINAL_WIN: ProjectStatus[] = ["approved", "in_progress", "completed"];

export default async function AnalyticsPage() {
  let rows: Project[] = [];
  if (isSupabaseConfigured()) {
    const supa = await createClient();
    const { data } = await supa.from("projects").select("*");
    rows = (data as Project[] | null) ?? [];
  }

  const total = rows.length;
  const won = rows.filter((p) => TERMINAL_WIN.includes(p.status)).length;
  const lost = rows.filter((p) => p.status === "lost").length;
  const conversion = total ? Math.round((won / total) * 100) : 0;
  const avgValue = won
    ? Math.round(rows.filter((p) => TERMINAL_WIN.includes(p.status)).reduce((s, p) => s + (Number(p.expected_value) || 0), 0) / won)
    : 0;
  const pipeline = rows
    .filter((p) => !TERMINAL_WIN.includes(p.status) && p.status !== "lost")
    .reduce((s, p) => s + (Number(p.expected_value) || 0), 0);

  const byType = ["kitchen", "bathroom", "full_home", "multi_room", "commercial"].map((t) => ({
    type: t,
    count: rows.filter((r) => r.type === t).length,
  }));

  const kpis = [
    { label: "Total projects", value: total },
    { label: "Conversion rate", value: `${conversion}%` },
    { label: "Avg won project value", value: formatCurrency(avgValue) },
    { label: "Active pipeline", value: formatCurrency(pipeline) },
    { label: "Won", value: won },
    { label: "Lost", value: lost },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Conversion and pipeline at a glance.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{k.label}</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-semibold">{k.value}</div></CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>Mix by project type</CardTitle><CardDescription>Where the work is coming from</CardDescription></CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm">
            {byType.map((b) => (
              <li key={b.type} className="flex items-center justify-between">
                <span className="capitalize">{b.type.replace("_", " ")}</span>
                <span className="font-medium">{b.count}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
