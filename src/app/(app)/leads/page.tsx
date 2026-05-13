import { LeadsBoard, type LeadRow } from "@/components/leads/leads-board";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leads" };

export default async function LeadsPage() {
  let rows: LeadRow[] = [];
  if (isSupabaseConfigured()) {
    const supa = await createClient();
    const { data } = await supa
      .from("projects")
      .select("*, clients(full_name,address_city,address_state)")
      .order("pipeline_position", { ascending: true })
      .order("updated_at", { ascending: false });
    rows = (data as unknown as LeadRow[]) ?? [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Leads</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Drag a card between columns to update its stage. Tap the title to open the project.
        </p>
      </div>
      <LeadsBoard initial={rows} />
    </div>
  );
}
