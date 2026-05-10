import Link from "next/link";
import { ArrowUpRight, Calendar, ClipboardList, DollarSign, FileText, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

const configured = isSupabaseConfigured;
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Project, ProjectStatus } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<ProjectStatus, string> = {
  new_lead: "New lead",
  consultation_scheduled: "Consultation",
  discovery_completed: "Discovery done",
  estimate_pending: "Estimate pending",
  estimate_sent: "Estimate sent",
  negotiation: "Negotiation",
  approved: "Approved",
  in_progress: "In progress",
  completed: "Completed",
  lost: "Lost",
};

const ACTIVE_STATUSES: ProjectStatus[] = [
  "new_lead",
  "consultation_scheduled",
  "discovery_completed",
  "estimate_pending",
  "estimate_sent",
  "negotiation",
  "approved",
  "in_progress",
];

export default async function DashboardPage() {
  let projects: Project[] = [];
  if (configured()) {
    const supa = await createClient();
    const { data } = await supa
      .from("projects")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(50);
    projects = (data as Project[] | null) ?? [];
  }

  const active = projects.filter((p) => ACTIVE_STATUSES.includes(p.status));
  const totalPipeline = active.reduce((sum, p) => sum + (Number(p.expected_value) || 0), 0);
  const signed = projects.filter((p) => p.status === "approved" || p.status === "in_progress" || p.status === "completed").length;
  const newLeads = projects.filter((p) => p.status === "new_lead").length;

  const kpis = [
    { label: "Active leads", value: active.length, icon: Users, hint: "in pipeline" },
    { label: "Pipeline value", value: formatCurrency(totalPipeline), icon: DollarSign, hint: "expected revenue" },
    { label: "Signed projects", value: signed, icon: ClipboardList, hint: "approved or running" },
    { label: "New this week", value: newLeads, icon: TrendingUp, hint: "fresh inquiries" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Snapshot of your remodeling business.</p>
        </div>
        <Button asChild>
          <Link href="/intake/new">Start an intake</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{k.label}</CardTitle>
              <k.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{k.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{k.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Pipeline</CardTitle>
            <CardDescription>Recent projects across stages</CardDescription>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <EmptyState />
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="pb-3 font-medium">Project</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Value</th>
                    <th className="pb-3 font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {projects.slice(0, 8).map((p) => (
                    <tr key={p.id}>
                      <td className="py-3">
                        <Link href={`/projects/${p.id}`} className="font-medium hover:underline">
                          {p.title}
                        </Link>
                      </td>
                      <td className="py-3">
                        <Badge variant="secondary" className="capitalize">
                          {STATUS_LABEL[p.status]}
                        </Badge>
                      </td>
                      <td className="py-3">{formatCurrency(p.expected_value)}</td>
                      <td className="py-3 text-muted-foreground">{formatDate(p.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Most common workflows</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <QuickLink href="/intake/new" icon={ClipboardList}>Start a new discovery</QuickLink>
            <QuickLink href="/leads" icon={Users}>Review leads</QuickLink>
            <QuickLink href="/calendar" icon={Calendar}>Schedule a consultation</QuickLink>
            <QuickLink href="/estimates" icon={FileText}>Build an estimate</QuickLink>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QuickLink({ href, icon: Icon, children }: { href: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-md border bg-card p-3 text-sm transition hover:bg-accent"
    >
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" /> {children}
      </span>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed p-10 text-center">
      <h3 className="text-base font-medium">No projects yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {configured()
          ? "Start your first discovery to populate the dashboard."
          : "Configure Supabase env vars and run the migration to see real data."}
      </p>
      <Button asChild className="mt-4">
        <Link href="/intake/new">Start an intake</Link>
      </Button>
    </div>
  );
}
