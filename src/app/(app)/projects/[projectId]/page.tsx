import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Camera,
  FileText,
  Sparkles,
  ClipboardList,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
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

  const intakeHref = `/intake/${p.id}?type=${p.type}&rooms=${encodeURIComponent(p.rooms.join(","))}`;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <Link
          href="/projects"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          ← All projects
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {p.type.replace("_", " ")}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{p.title}</h1>
            {c?.full_name && (
              <div className="mt-1 text-sm text-muted-foreground">
                {c.full_name}
                {c.address_city ? ` · ${c.address_city}, ${c.address_state ?? ""}` : ""}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {p.status.replace("_", " ")}
            </Badge>
            <Button asChild>
              <Link href={intakeHref}>
                Continue intake <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Rooms in scope */}
      {p.rooms?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Rooms in scope</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {p.rooms.map((r) => (
                <Badge key={r} variant="secondary" className="capitalize">
                  {r.replace("_", " ")}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Client + Budget + Timeline */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {c?.full_name && (
              <div className="flex items-start gap-2">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  {(c.full_name ?? "")
                    .split(" ")
                    .map((p) => p[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </span>
                <span className="font-medium">{c.full_name}</span>
              </div>
            )}
            {c?.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                <a className="truncate hover:underline" href={`mailto:${c.email}`}>
                  {c.email}
                </a>
              </div>
            )}
            {c?.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0" />
                <a className="hover:underline" href={`tel:${c.phone}`}>
                  {c.phone}
                </a>
              </div>
            )}
            {(c?.address_street || c?.address_city) && (
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {c.address_street}
                  {c.address_street && <br />}
                  {[c.address_city, c.address_state, c.address_zip].filter(Boolean).join(", ")}
                </span>
              </div>
            )}
            {!c?.full_name && !c?.email && !c?.phone && (
              <div className="text-muted-foreground">No contact details yet.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Budget</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Row label="Min" value={formatCurrency(p.budget_min)} />
            <Row label="Ideal" value={formatCurrency(p.budget_ideal)} />
            <Row label="Max" value={formatCurrency(p.budget_max)} />
            <Row label="Expected" value={formatCurrency(p.expected_value)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Row label="Desired completion" value={formatDate(p.desired_completion)} />
            <Row label="Hard deadline" value={formatDate(p.hard_deadline)} />
            <Row label="Start flexibility" value={p.start_flexibility ?? "—"} />
          </CardContent>
        </Card>
      </div>

      {/* Design preferences */}
      {(p.luxury_level != null ||
        p.function_vs_aesthetic != null ||
        p.budget_flexibility != null ||
        p.timeline_urgency != null ||
        p.design_boldness != null) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Design preferences</CardTitle>
            <CardDescription>How the client calibrated the project.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <SliderRow label="Luxury" value={p.luxury_level} />
            <SliderRow label="Function ↔ Aesthetic" value={p.function_vs_aesthetic} />
            <SliderRow label="Budget flex" value={p.budget_flexibility} />
            <SliderRow label="Timeline urgency" value={p.timeline_urgency} />
            <SliderRow label="Design boldness" value={p.design_boldness} />
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction href={intakeHref} icon={ClipboardList} label="View / edit answers" />
          <QuickAction href={`/projects/${p.id}/media`} icon={Camera} label="Upload media" />
          <QuickAction href={`/projects/${p.id}/summary`} icon={Sparkles} label="AI summary" />
          <QuickAction href={`/projects/${p.id}/estimate`} icon={FileText} label="Build estimate" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activities && activities.length > 0 ? (
            <ul className="space-y-3 text-sm">
              {(activities as Activity[]).map((a) => (
                <li key={a.id} className="flex items-center justify-between">
                  <span className="capitalize">{a.kind.replace("_", " ")}</span>
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

function SliderRow({ label, value }: { label: string; value: number | null | undefined }) {
  const v = typeof value === "number" ? value : null;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-medium">{v == null ? "—" : `${v}/100`}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: v == null ? 0 : `${Math.min(100, Math.max(0, v))}%` }}
        />
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-2 rounded-lg border bg-card p-3 text-sm font-medium transition hover:border-primary/50 hover:bg-accent"
    >
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        {label}
      </span>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
