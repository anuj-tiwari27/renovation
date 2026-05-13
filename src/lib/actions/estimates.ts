"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Estimate, ScopeItem, EstimateStatus } from "@/lib/supabase/database.types";

export interface EstimatePatch {
  status?: EstimateStatus;
  tax_rate?: number;
  discount_percent?: number;
  notes?: string | null;
  terms?: string | null;
  bill_to_name?: string | null;
  bill_to_email?: string | null;
  bill_to_phone?: string | null;
  bill_to_address?: string | null;
}

export async function updateEstimateAction(estimateId: string, patch: EstimatePatch) {
  const supa = await createClient();
  const { error } = await supa.from("estimates").update(patch).eq("id", estimateId);
  if (error) throw new Error(error.message);
  revalidatePath(`/projects`);
  return { ok: true };
}

export async function recomputeEstimateTotalsAction(estimateId: string) {
  const supa = await createClient();
  const { data: items } = await supa
    .from("scope_items")
    .select("total")
    .eq("estimate_id", estimateId);
  // Tolerate the case where migration 0002 hasn't been run yet (discount_percent missing).
  let discountPct = 0;
  let taxRate = 0;
  try {
    const { data: est, error } = await supa
      .from("estimates")
      .select("tax_rate, discount_percent")
      .eq("id", estimateId)
      .maybeSingle();
    if (!error && est) {
      const row = est as { tax_rate: number | null; discount_percent: number | null };
      taxRate = Number(row.tax_rate ?? 0);
      discountPct = Number(row.discount_percent ?? 0);
    }
  } catch {
    // Column missing — fall back to tax_rate only.
    const { data: est } = await supa
      .from("estimates")
      .select("tax_rate")
      .eq("id", estimateId)
      .maybeSingle();
    if (est) taxRate = Number((est as { tax_rate: number | null }).tax_rate ?? 0);
  }
  const itemsTyped = (items as Array<{ total: number }> | null) ?? [];
  const subtotal = itemsTyped.reduce((s, r) => s + Number(r.total ?? 0), 0);
  const afterDiscount = subtotal * (1 - discountPct / 100);
  const total = afterDiscount * (1 + taxRate);
  const { error } = await supa
    .from("estimates")
    .update({ subtotal, total })
    .eq("id", estimateId);
  if (error) throw new Error(error.message);
  return { subtotal, total };
}

export interface ScopeItemInput {
  category: string;
  description: string;
  qty?: number;
  unit?: string;
  unit_price?: number;
  is_optional?: boolean;
  position?: number;
}

export async function addScopeItemAction(estimateId: string, item: ScopeItemInput) {
  const supa = await createClient();
  const { data: existing, error: posErr } = await supa
    .from("scope_items")
    .select("position")
    .eq("estimate_id", estimateId)
    .order("position", { ascending: false })
    .limit(1);
  if (posErr) throw new Error(`Looking up next position: ${posErr.message}`);
  // `data` is `[]` (not null) when there are no rows; the old `?? []` fallback
  // doesn't fire and `[0].position` would throw.
  const rows = (existing as Array<{ position: number }> | null) ?? [];
  const nextPos = rows.length > 0 ? Number(rows[0].position) + 1 : 0;
  const { data, error } = await supa
    .from("scope_items")
    .insert({
      estimate_id: estimateId,
      category: item.category,
      description: item.description,
      qty: item.qty ?? 1,
      unit: item.unit ?? "ea",
      unit_price: item.unit_price ?? 0,
      is_optional: item.is_optional ?? false,
      position: item.position ?? nextPos,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await recomputeEstimateTotalsAction(estimateId);
  return data as ScopeItem;
}

export async function updateScopeItemAction(
  itemId: string,
  patch: Partial<ScopeItemInput>,
) {
  const supa = await createClient();
  const { data: row, error } = await supa
    .from("scope_items")
    .update(patch)
    .eq("id", itemId)
    .select("estimate_id")
    .single();
  if (error) throw new Error(error.message);
  await recomputeEstimateTotalsAction((row as { estimate_id: string }).estimate_id);
  return { ok: true };
}

export async function deleteScopeItemAction(itemId: string) {
  const supa = await createClient();
  const { data: row } = await supa
    .from("scope_items")
    .select("estimate_id")
    .eq("id", itemId)
    .maybeSingle();
  const { error } = await supa.from("scope_items").delete().eq("id", itemId);
  if (error) throw new Error(error.message);
  if (row) await recomputeEstimateTotalsAction((row as { estimate_id: string }).estimate_id);
  return { ok: true };
}

export interface BillToValues {
  bill_to_name: string | null;
  bill_to_email: string | null;
  bill_to_phone: string | null;
  bill_to_address: string | null;
}

export async function syncBillToFromClientAction(
  estimateId: string,
): Promise<{ ok: boolean; values: BillToValues | null; reason?: string }> {
  const supa = await createClient();
  const { data: est, error: estErr } = await supa
    .from("estimates")
    .select("project_id")
    .eq("id", estimateId)
    .maybeSingle();
  if (estErr) throw new Error(`estimate lookup: ${estErr.message}`);
  if (!est) return { ok: false, values: null, reason: "Estimate not found" };

  const { data: project, error: projErr } = await supa
    .from("projects")
    .select("client_id")
    .eq("id", (est as { project_id: string }).project_id)
    .maybeSingle();
  if (projErr) throw new Error(`project lookup: ${projErr.message}`);
  if (!project) return { ok: false, values: null, reason: "Project not found" };

  const { data: client, error: cliErr } = await supa
    .from("clients")
    .select("full_name, email, phone, address_street, address_city, address_state, address_zip")
    .eq("id", (project as { client_id: string }).client_id)
    .maybeSingle();
  if (cliErr) throw new Error(`client lookup: ${cliErr.message}`);
  if (!client) return { ok: false, values: null, reason: "Linked client not found" };

  const c = client as {
    full_name: string;
    email: string | null;
    phone: string | null;
    address_street: string | null;
    address_city: string | null;
    address_state: string | null;
    address_zip: string | null;
  };
  const addr =
    [c.address_street, [c.address_city, c.address_state, c.address_zip].filter(Boolean).join(", ")]
      .filter(Boolean)
      .join("\n") || null;

  const values: BillToValues = {
    bill_to_name: c.full_name,
    bill_to_email: c.email,
    bill_to_phone: c.phone,
    bill_to_address: addr,
  };

  const { error: upErr } = await supa.from("estimates").update(values).eq("id", estimateId);
  if (upErr) {
    // The most likely cause is migration 0002_estimate_extras.sql not being
    // run yet (bill_to_* columns missing). Surface a precise message instead
    // of leaking a Postgres-y "column ... does not exist".
    const msg =
      upErr.message.includes("column") && upErr.message.includes("does not exist")
        ? "Estimate columns missing — run supabase/migrations/0002_estimate_extras.sql in the Supabase SQL editor, then try again."
        : `update bill_to: ${upErr.message}`;
    throw new Error(msg);
  }
  return { ok: true, values };
}

export async function updateEstimateStatusAction(
  estimateId: string,
  status: EstimateStatus,
) {
  const supa = await createClient();
  const patch: Partial<Estimate> = { status };
  if (status === "sent") patch.sent_at = new Date().toISOString();
  if (status === "accepted") patch.accepted_at = new Date().toISOString();
  const { error } = await supa.from("estimates").update(patch).eq("id", estimateId);
  if (error) throw new Error(error.message);
  return { ok: true };
}
