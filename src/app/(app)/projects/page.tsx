import Link from "next/link";
import { ArrowUpRight, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Project, ProjectStatus } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Projects" };

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

const STATUS_TONE: Record<ProjectStatus, "secondary" | "success" | "warning" | "destructive"> = {
  new_lead: "secondary",
  consultation_scheduled: "secondary",
  discovery_completed: "secondary",
  estimate_pending: "warning",
  estimate_sent: "warning",
  negotiation: "warning",
  approved: "success",
  in_progress: "success",
  completed: "success",
  lost: "destructive",
};

export default async function ProjectsPage() {
  let rows: Project[] = [];
  if (isSupabaseConfigured()) {
    const supa = await createClient();
    const { data } = await supa.from("projects").select("*").order("updated_at", { ascending: false });
    rows = (data as Project[] | null) ?? [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Projects</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          All projects across stages — tap a card to open it.
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((p) => (
            <li key={p.id}>
              <ProjectCard project={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProjectCard({ project: p }: { project: Project }) {
  return (
    <Link
      href={`/projects/${p.id}`}
      className={cn(
        "group flex h-full flex-col rounded-xl border bg-card p-5 shadow-sm transition",
        "hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          {p.type.replace("_", " ")}
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
      </div>

      <h3 className="mt-1 line-clamp-2 font-semibold leading-snug">{p.title}</h3>

      <div className="mt-3">
        <Badge variant={STATUS_TONE[p.status]} className="capitalize">
          {STATUS_LABEL[p.status]}
        </Badge>
      </div>

      {p.rooms?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {p.rooms.slice(0, 4).map((r) => (
            <span
              key={r}
              className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground"
            >
              {r.replace("_", " ")}
            </span>
          ))}
          {p.rooms.length > 4 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
              +{p.rooms.length - 4}
            </span>
          )}
        </div>
      )}

      <div className="mt-auto grid grid-cols-2 gap-3 pt-4 text-sm">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Value</div>
          <div className="font-medium">{formatCurrency(p.expected_value)}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Updated</div>
          <div className="font-medium">{formatDate(p.updated_at)}</div>
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed p-10 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
        <ClipboardList className="h-6 w-6" />
      </span>
      <h3 className="mt-4 text-base font-semibold">No projects yet</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Use the <kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs">+</kbd> button in the
        top bar to start your first discovery. Each completed intake creates a project here.
      </p>
    </div>
  );
}
