import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Camera, FileText, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Project, Client, Activity } from "@/lib/supabase/database.types";

interface Props {
  params: Promise<{ projectId: string }>;
}

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: Props) {
  const { projectId } = await params;
  if (!isSupabaseConfigured()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project preview</CardTitle>
          <CardDescription>Configure Supabase to load real project data.</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  const supa = await createClient();
  const { data: project } = await supa.from("projects").select("*").eq("id", projectId).maybeSingle();
  if (!project) notFound();
  const p = project as Project;
  const { data: client } = await supa.from("clients").select("*").eq("id", p.client_id).maybeSingle();
  const c = client as Client | null;
  const { data: activities } = await supa
    .from("activities")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{p.type.replace("_"," ")}</div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{p.title}</h1>
          <div className="mt-1 text-sm text-muted-foreground">
            {c?.full_name ?? "—"} {c?.address_city ? `· ${c.address_city}, ${c.address_state ?? ""}` : ""}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="capitalize">{p.status.replace("_"," ")}</Badge>
          <Button asChild>
            <Link href={`/intake/${p.id}?type=${p.type}&rooms=${encodeURIComponent(p.rooms.join(","))}`}>
              Continue intake <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Budget</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Row label="Min" value={formatCurrency(p.budget_min)} />
            <Row label="Ideal" value={formatCurrency(p.budget_ideal)} />
            <Row label="Max" value={formatCurrency(p.budget_max)} />
            <Row label="Expected" value={formatCurrency(p.expected_value)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Row label="Desired completion" value={formatDate(p.desired_completion)} />
            <Row label="Hard deadline" value={formatDate(p.hard_deadline)} />
            <Row label="Start flexibility" value={p.start_flexibility ?? "—"} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Quick actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-between">
              <Link href={`/projects/${p.id}/media`}><span className="flex items-center gap-2"><Camera className="h-4 w-4" /> Upload media</span> <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link href={`/projects/${p.id}/summary`}><span className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> AI summary</span> <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link href={`/projects/${p.id}/estimate`}><span className="flex items-center gap-2"><FileText className="h-4 w-4" /> Build estimate</span> <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent activity</CardTitle></CardHeader>
        <CardContent>
          {activities && activities.length > 0 ? (
            <ul className="space-y-3 text-sm">
              {(activities as Activity[]).map((a) => (
                <li key={a.id} className="flex items-center justify-between">
                  <span>{a.kind.replace("_", " ")}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(a.created_at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-muted-foreground">No activity yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-1 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
