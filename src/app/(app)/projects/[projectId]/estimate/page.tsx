import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EstimateEditor } from "@/components/estimate/estimate-editor";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { Estimate, Project, ScopeItem } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Estimate" };

interface Props {
  params: Promise<{ projectId: string }>;
}

export default async function EstimatePage({ params }: Props) {
  const { projectId } = await params;
  if (!isSupabaseConfigured()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estimate</CardTitle>
          <CardDescription>Configure Supabase to build estimates.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const supa = await createClient();
  const { data: project } = await supa
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) notFound();

  // Load (or lazily create) the active draft estimate
  let estimate: Estimate | null = null;
  {
    const { data } = await supa
      .from("estimates")
      .select("*")
      .eq("project_id", projectId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    estimate = (data as Estimate | null) ?? null;
  }
  if (!estimate) {
    const { data: created } = await supa
      .from("estimates")
      .insert({ project_id: projectId, status: "draft" })
      .select("*")
      .single();
    estimate = created as Estimate;
  }

  // On first open, auto-populate bill-to from the linked client so the
  // estimate has something useful to show without an extra click.
  const e = estimate;
  if (!e.bill_to_name) {
    const { data: client } = await supa
      .from("clients")
      .select("full_name, email, phone, address_street, address_city, address_state, address_zip")
      .eq("id", (project as Project).client_id)
      .maybeSingle();
    if (client) {
      const c = client as {
        full_name: string;
        email: string | null;
        phone: string | null;
        address_street: string | null;
        address_city: string | null;
        address_state: string | null;
        address_zip: string | null;
      };
      const addr = [c.address_street, [c.address_city, c.address_state, c.address_zip].filter(Boolean).join(", ")]
        .filter(Boolean)
        .join("\n");
      const { data: updated } = await supa
        .from("estimates")
        .update({
          bill_to_name: c.full_name,
          bill_to_email: c.email,
          bill_to_phone: c.phone,
          bill_to_address: addr || null,
        })
        .eq("id", e.id)
        .select("*")
        .single();
      estimate = (updated as Estimate) ?? e;
    }
  }

  const { data: items } = await supa
    .from("scope_items")
    .select("*")
    .eq("estimate_id", estimate.id)
    .order("position", { ascending: true });

  return (
    <EstimateEditor
      estimate={estimate}
      project={project as Project}
      items={(items as ScopeItem[] | null) ?? []}
    />
  );
}
