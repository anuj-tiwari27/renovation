"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Plus, Trash2, FileDown, Send, CheckCheck, Copy, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BrandMark } from "@/components/brand";
import { env } from "@/lib/env";
import { formatCurrency, cn } from "@/lib/utils";
import type { Estimate, ScopeItem, EstimateStatus, Project } from "@/lib/supabase/database.types";
import {
  addScopeItemAction,
  deleteScopeItemAction,
  syncBillToFromClientAction,
  updateEstimateAction,
  updateEstimateStatusAction,
  updateScopeItemAction,
} from "@/lib/actions/estimates";

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

const UNITS = ["ea", "lf", "sf", "sqft", "hr", "day", "lot"];

interface Props {
  estimate: Estimate;
  project: Project;
  items: ScopeItem[];
}

type Draft = Pick<
  Estimate,
  | "tax_rate"
  | "discount_percent"
  | "notes"
  | "terms"
  | "bill_to_name"
  | "bill_to_email"
  | "bill_to_phone"
  | "bill_to_address"
>;

export function EstimateEditor({ estimate, project, items: initialItems }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [items, setItems] = React.useState<ScopeItem[]>(initialItems);
  const [draft, setDraft] = React.useState<Draft>({
    tax_rate: Number(estimate.tax_rate ?? 0),
    discount_percent: Number(estimate.discount_percent ?? 0),
    notes: estimate.notes,
    terms: estimate.terms,
    bill_to_name: estimate.bill_to_name,
    bill_to_email: estimate.bill_to_email,
    bill_to_phone: estimate.bill_to_phone,
    bill_to_address: estimate.bill_to_address,
  });
  const [status, setStatus] = React.useState<EstimateStatus>(estimate.status);

  const setField = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
  };

  // ---------- totals ----------
  const subtotal = items.reduce((s, r) => s + Number(r.qty ?? 0) * Number(r.unit_price ?? 0), 0);
  const discountAmt = subtotal * (Number(draft.discount_percent ?? 0) / 100);
  const taxableBase = subtotal - discountAmt;
  const taxAmt = taxableBase * Number(draft.tax_rate ?? 0);
  const total = taxableBase + taxAmt;

  // ---------- mutations ----------
  const addRow = () => {
    startTransition(async () => {
      const row = await addScopeItemAction(estimate.id, {
        category: "Labor",
        description: "New line item",
        qty: 1,
        unit: "ea",
        unit_price: 0,
      });
      setItems((curr) => [...curr, row].sort((a, b) => a.position - b.position));
    });
  };

  const updateRow = (id: string, patch: Partial<ScopeItem>) => {
    setItems((curr) => curr.map((r) => (r.id === id ? { ...r, ...patch, total: (patch.qty ?? r.qty) * (patch.unit_price ?? r.unit_price) } : r)));
  };

  const saveRow = (id: string) => {
    const row = items.find((r) => r.id === id);
    if (!row) return;
    startTransition(async () => {
      await updateScopeItemAction(id, {
        category: row.category,
        description: row.description,
        qty: Number(row.qty),
        unit: row.unit,
        unit_price: Number(row.unit_price),
        is_optional: row.is_optional,
      });
    });
  };

  const removeRow = (id: string) => {
    if (!confirm("Remove this line item?")) return;
    startTransition(async () => {
      await deleteScopeItemAction(id);
      setItems((curr) => curr.filter((r) => r.id !== id));
    });
  };

  const saveHeader = () => {
    startTransition(async () => {
      await updateEstimateAction(estimate.id, {
        tax_rate: Number(draft.tax_rate),
        discount_percent: Number(draft.discount_percent),
        notes: draft.notes ?? null,
        terms: draft.terms ?? null,
        bill_to_name: draft.bill_to_name ?? null,
        bill_to_email: draft.bill_to_email ?? null,
        bill_to_phone: draft.bill_to_phone ?? null,
        bill_to_address: draft.bill_to_address ?? null,
      });
      toast.success("Saved");
    });
  };

  const importCustomer = () => {
    startTransition(async () => {
      await syncBillToFromClientAction(estimate.id);
      router.refresh();
      toast.success("Imported customer details");
    });
  };

  const changeStatus = (next: EstimateStatus) => {
    setStatus(next);
    startTransition(async () => {
      await updateEstimateStatusAction(estimate.id, next);
      toast.success(`Marked as ${next}`);
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/projects/${project.id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to project: {project.title}
        </Link>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Estimate</h1>
            <p className="text-sm text-muted-foreground sm:text-base">{project.title}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="capitalize">{status}</Badge>
            <Select value={status} onValueChange={(v) => changeStatus(v as EstimateStatus)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="revised">Revised</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Header — branding + bill-to */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Header</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-[auto_1fr_1fr]">
            <div className="flex items-start gap-3">
              <BrandMark size={56} />
              <div className="text-sm">
                <div className="font-semibold">{env.NEXT_PUBLIC_COMPANY_NAME}</div>
                <div className="text-muted-foreground">Estimate #{estimate.id.slice(0, 8).toUpperCase()}</div>
                <div className="text-muted-foreground">{new Date(estimate.created_at).toLocaleDateString()}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Bill to</Label>
                <Button variant="ghost" size="sm" onClick={importCustomer} disabled={isPending}>
                  <Copy className="h-3 w-3" /> Use client info
                </Button>
              </div>
              <Input
                placeholder="Customer name"
                value={draft.bill_to_name ?? ""}
                onChange={(e) => setField("bill_to_name", e.target.value)}
              />
              <Input
                placeholder="customer@example.com"
                value={draft.bill_to_email ?? ""}
                onChange={(e) => setField("bill_to_email", e.target.value)}
              />
              <Input
                placeholder="Phone"
                value={draft.bill_to_phone ?? ""}
                onChange={(e) => setField("bill_to_phone", e.target.value)}
              />
              <Textarea
                placeholder="Service address"
                rows={2}
                value={draft.bill_to_address ?? ""}
                onChange={(e) => setField("bill_to_address", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Notes & terms</Label>
              <Textarea
                placeholder="Public notes the customer will see"
                rows={3}
                value={draft.notes ?? ""}
                onChange={(e) => setField("notes", e.target.value)}
              />
              <Textarea
                placeholder="Terms (payment schedule, exclusions…)"
                rows={3}
                value={draft.terms ?? ""}
                onChange={(e) => setField("terms", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Line items</CardTitle>
          <Button size="sm" onClick={addRow} disabled={isPending}>
            <Plus className="h-4 w-4" /> Add line
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No line items yet. Click <strong>Add line</strong> to create one.
            </div>
          ) : (
            <table className="w-full min-w-[720px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium">Description</th>
                  <th className="pb-2 font-medium text-right">Qty</th>
                  <th className="pb-2 font-medium">Unit</th>
                  <th className="pb-2 font-medium text-right">Unit price</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id} className="border-t align-top">
                    <td className="py-2 pr-2">
                      <Select
                        value={r.category}
                        onValueChange={(v) => updateRow(r.id, { category: v })}
                      >
                        <SelectTrigger className="h-9 w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-2 pr-2">
                      <Input
                        value={r.description}
                        onChange={(e) => updateRow(r.id, { description: e.target.value })}
                        onBlur={() => saveRow(r.id)}
                        className="h-9"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <Input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        value={r.qty}
                        onChange={(e) => updateRow(r.id, { qty: Number(e.target.value) })}
                        onBlur={() => saveRow(r.id)}
                        className="h-9 w-20 text-right"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <Select value={r.unit} onValueChange={(v) => { updateRow(r.id, { unit: v }); }}>
                        <SelectTrigger className="h-9 w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-2 pr-2">
                      <Input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        value={r.unit_price}
                        onChange={(e) => updateRow(r.id, { unit_price: Number(e.target.value) })}
                        onBlur={() => saveRow(r.id)}
                        className="h-9 w-28 text-right"
                      />
                    </td>
                    <td className="py-2 pr-2 text-right font-medium">{formatCurrency(Number(r.qty) * Number(r.unit_price))}</td>
                    <td className="py-2 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRow(r.id)}
                        disabled={isPending}
                        aria-label="Delete line"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Totals */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <div className="w-full max-w-sm space-y-2">
              <Row label="Subtotal" value={formatCurrency(subtotal)} />
              <div className="flex items-center justify-between gap-3 text-sm">
                <Label htmlFor="disc" className="flex items-center gap-2 text-muted-foreground">
                  Discount
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="disc"
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={draft.discount_percent}
                    onChange={(e) => setField("discount_percent", Number(e.target.value))}
                    onBlur={saveHeader}
                    className="h-9 w-20 text-right"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                  <span className="w-24 text-right text-muted-foreground">
                    {formatCurrency(-discountAmt)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <Label htmlFor="tax" className="text-muted-foreground">Tax</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="tax"
                    type="number"
                    step="0.001"
                    inputMode="decimal"
                    value={(draft.tax_rate * 100).toFixed(2)}
                    onChange={(e) => setField("tax_rate", Number(e.target.value) / 100)}
                    onBlur={saveHeader}
                    className="h-9 w-20 text-right"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                  <span className="w-24 text-right text-muted-foreground">
                    {formatCurrency(taxAmt)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between border-t pt-2 text-base font-semibold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action bar */}
      <div
        className={cn(
          "sticky bottom-0 -mx-3 flex flex-wrap items-center justify-end gap-2 border-t bg-background/90 px-3 py-3 backdrop-blur",
          "sm:relative sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none",
        )}
      >
        <Button variant="outline" onClick={saveHeader} disabled={isPending}>
          {isPending ? <RotateCw className="h-4 w-4 animate-spin" /> : null}
          Save
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/api/pdf/${project.id}?estimate=${estimate.id}`} target="_blank">
            <FileDown className="h-4 w-4" /> Preview / print
          </Link>
        </Button>
        {status === "draft" && (
          <Button onClick={() => changeStatus("sent")} disabled={isPending}>
            <Send className="h-4 w-4" /> Mark as sent
          </Button>
        )}
        {status === "sent" && (
          <Button onClick={() => changeStatus("accepted")} disabled={isPending}>
            <CheckCheck className="h-4 w-4" /> Mark as accepted
          </Button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
