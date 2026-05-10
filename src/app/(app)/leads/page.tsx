import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Project, ProjectStatus, Client } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leads" };

const COLUMNS: { id: ProjectStatus; label: string }[] = [
  { id: "new_lead", label: "New" },
  { id: "consultation_scheduled", label: "Consultation" },
  { id: "discovery_completed", label: "Discovery" },
  { id: "estimate_pending", label: "Estimating" },
  { id: "estimate_sent", label: "Sent" },
  { id: "negotiation", label: "Negotiation" },
  { id: "approved", label: "Approved" },
  { id: "lost", label: "Lost" },
];

type Row = Project & { clients: Pick<Client, "full_name" | "address_city" | "address_state"> | null };

export default async function LeadsPage() {
  let rows: Row[] = [];
  if (isSupabaseConfigured()) {
    const supa = await createClient();
    const { data } = await supa
      .from("projects")
      .select("*, clients(full_name,address_city,address_state)")
      .order("pipeline_position", { ascending: true })
      .order("updated_at", { ascending: false });
    rows = (data as unknown as Row[]) ?? [];
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Leads</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Drag-free kanban — open a card to update status.
          </p>
        </div>
        <Button asChild className="self-start sm:self-auto">
          <Link href="/intake/new">New intake</Link>
        </Button>
      </div>

      <div className="-mx-3 flex gap-3 overflow-x-auto px-3 pb-2 sm:-mx-0 sm:gap-4 sm:px-0">
        {COLUMNS.map((col) => {
          const items = rows.filter((r) => r.status === col.id);
          return (
            <div key={col.id} className="w-[260px] shrink-0 sm:w-72">
              <Card className="bg-muted/40">
                <CardHeader className="flex-row items-center justify-between space-y-0 py-3">
                  <CardTitle className="text-sm">{col.label}</CardTitle>
                  <Badge variant="secondary">{items.length}</Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  {items.map((p) => (
                    <Link
                      key={p.id}
                      href={`/projects/${p.id}`}
                      className="block rounded-lg border bg-card p-3 text-sm shadow-sm transition hover:shadow-md"
                    >
                      <div className="font-medium">{p.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.clients?.full_name ?? "—"}
                        {p.clients?.address_city ? ` · ${p.clients.address_city}, ${p.clients.address_state ?? ""}` : ""}
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="capitalize text-muted-foreground">{p.type.replace("_"," ")}</span>
                        <span>{formatCurrency(p.expected_value)}</span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">Updated {formatDate(p.updated_at)}</div>
                    </Link>
                  ))}
                  {items.length === 0 && (
                    <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
                      No items
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
