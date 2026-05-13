import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewAppointmentDialog, type ProjectOption } from "@/components/appointments/new-appointment-dialog";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";
export const metadata = { title: "Calendar" };

interface Appt {
  id: string;
  starts_at: string;
  ends_at: string;
  location: string | null;
  kind: string | null;
  notes: string | null;
  project_id: string | null;
  projects: { title: string } | null;
}

const KIND_LABEL: Record<string, string> = {
  consultation: "Consultation",
  design: "Design review",
  site_visit: "Site visit",
  final_walk: "Final walk",
};

const KIND_TONE: Record<string, "secondary" | "success" | "warning"> = {
  consultation: "secondary",
  design: "secondary",
  site_visit: "warning",
  final_walk: "success",
};

export default async function CalendarPage() {
  let appts: Appt[] = [];
  let projects: ProjectOption[] = [];

  if (isSupabaseConfigured()) {
    const supa = await createClient();
    const { data } = await supa
      .from("appointments")
      .select("id, starts_at, ends_at, location, kind, notes, project_id, projects(title)")
      .gte("starts_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order("starts_at");
    appts = (data as unknown as Appt[]) ?? [];

    const { data: projRows } = await supa
      .from("projects")
      .select("id, title, client_id")
      .order("updated_at", { ascending: false })
      .limit(200);
    projects = (projRows as ProjectOption[] | null) ?? [];
  }

  const grouped = groupByDay(appts);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Calendar</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Upcoming consultations, design reviews, and walkthroughs.
          </p>
        </div>
        <NewAppointmentDialog projects={projects} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming</CardTitle>
          <CardDescription>Past 7 days and everything ahead.</CardDescription>
        </CardHeader>
        <CardContent>
          {appts.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
              No appointments yet. Use <strong>New appointment</strong> to add one.
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map(([dayLabel, items]) => (
                <section key={dayLabel}>
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {dayLabel}
                  </h2>
                  <ul className="divide-y rounded-lg border">
                    {items.map((a) => (
                      <li key={a.id} className="flex items-start gap-3 p-3 sm:p-4">
                        <div className="flex w-20 shrink-0 flex-col items-center rounded-md bg-muted/60 px-2 py-1 text-center">
                          <div className="text-xs text-muted-foreground">
                            {new Date(a.starts_at).toLocaleTimeString([], {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            – {new Date(a.ends_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={KIND_TONE[a.kind ?? ""] ?? "secondary"}>
                              {KIND_LABEL[a.kind ?? ""] ?? a.kind ?? "Appointment"}
                            </Badge>
                            {a.projects?.title && (
                              <Link
                                href={`/projects/${a.project_id}`}
                                className="font-medium hover:underline"
                              >
                                {a.projects.title}
                              </Link>
                            )}
                          </div>
                          {a.location && <div className="mt-1 text-sm text-muted-foreground">{a.location}</div>}
                          {a.notes && (
                            <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.notes}</div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function groupByDay(appts: Appt[]): [string, Appt[]][] {
  const groups: Record<string, Appt[]> = {};
  for (const a of appts) {
    const d = new Date(a.starts_at);
    const key = d.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    (groups[key] ||= []).push(a);
  }
  return Object.entries(groups);
}
