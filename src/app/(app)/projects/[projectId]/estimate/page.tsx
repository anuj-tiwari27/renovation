import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { formatCurrency } from "@/lib/utils";
import type { Project, Estimate, ScopeItem } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Estimate" };

const CATEGORIES = [
  "Cabinets",
  "Countertops",
  "Plumbing",
  "Appliances",
  "Flooring",
  "Lighting",
  "Tile",
  "Labor",
  "Design",
  "Permits",
  "Other",
];

interface Props { params: Promise<{ projectId: string }> }

export default async function EstimatePage({ params }: Props) {
  const { projectId } = await params;
  if (!isSupabaseConfigured()) {
    return <Card><CardHeader><CardTitle>Estimate</CardTitle><CardDescription>Configure Supabase first.</CardDescription></CardHeader></Card>;
  }
  const supa = await createClient();
  const { data: project } = await supa.from("projects").select("*").eq("id", projectId).maybeSingle();
  if (!project) notFound();
  const p = project as Project;

  // Load (or create) the active draft estimate
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
  const e: Estimate = estimate;

  const { data: items } = await supa
    .from("scope_items")
    .select("*")
    .eq("estimate_id", e.id)
    .order("position", { ascending: true });
  const rows = (items as ScopeItem[] | null) ?? [];

  const subtotal = rows.reduce((s, r) => s + Number(r.total ?? 0), 0);
  const total = subtotal * (1 + Number(e.tax_rate ?? 0));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Estimate</h1>
          <p className="text-muted-foreground">{p.title}</p>
        </div>
        <Badge variant="secondary" className="capitalize">{e.status}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scope items</CardTitle>
          <CardDescription>
            Categories: {CATEGORIES.join(", ")}. Add/edit items via API or the admin panel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
              No line items yet. Use the AI summary as a starting point and add items here.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Description</th>
                  <th className="pb-3 text-right">Qty</th>
                  <th className="pb-3">Unit</th>
                  <th className="pb-3 text-right">Unit price</th>
                  <th className="pb-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2 capitalize">{r.category}</td>
                    <td className="py-2">{r.description}</td>
                    <td className="py-2 text-right">{r.qty}</td>
                    <td className="py-2">{r.unit}</td>
                    <td className="py-2 text-right">{formatCurrency(r.unit_price)}</td>
                    <td className="py-2 text-right font-medium">{formatCurrency(r.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-sm space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between"><span>Tax ({(Number(e.tax_rate ?? 0) * 100).toFixed(2)}%)</span><span>{formatCurrency(subtotal * Number(e.tax_rate ?? 0))}</span></div>
              <div className="flex justify-between border-t pt-1 text-base font-semibold"><span>Total</span><span>{formatCurrency(total)}</span></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button asChild variant="outline">
          <Link href={`/api/pdf/${projectId}`} target="_blank">Open report</Link>
        </Button>
        <Button asChild>
          <Link href={`/projects/${projectId}`}>Done</Link>
        </Button>
      </div>
    </div>
  );
}
