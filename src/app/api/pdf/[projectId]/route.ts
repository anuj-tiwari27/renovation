import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, env } from "@/lib/env";
import { aiSummarize, buildLocalSummary } from "@/lib/ai/summarize";
import type { Project, Client, Answer } from "@/lib/supabase/database.types";

/**
 * Returns a print-ready HTML report. The user (or a headless print service)
 * can save it to PDF — we deliberately avoid heavy server-side PDF deps so
 * the app stays portable across deployment targets.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await ctx.params;
  if (!isSupabaseConfigured()) {
    return new NextResponse("Supabase not configured", { status: 503 });
  }
  const supa = await createClient();
  const { data: project } = await supa.from("projects").select("*").eq("id", projectId).maybeSingle();
  if (!project) return new NextResponse("Not found", { status: 404 });
  const p = project as Project;
  const { data: client } = await supa.from("clients").select("*").eq("id", p.client_id).maybeSingle();
  const { data: answersRows } = await supa.from("answers").select("*").eq("project_id", projectId);

  const answersBySet: Record<string, Record<string, unknown>> = {};
  for (const a of (answersRows ?? []) as Answer[]) {
    const key = a.room_id ? `${a.question_set_slug}::${a.room_id}` : a.question_set_slug;
    answersBySet[key] = { ...(answersBySet[key] ?? {}), [a.question_id]: a.value };
  }

  const summary =
    (await aiSummarize({ project: p, client: client as Client | null, answersBySet })) ??
    buildLocalSummary({ project: p, client: client as Client | null, answersBySet });

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(p.title)} — Discovery report</title>
<style>
  @page { size: Letter; margin: 0.75in; }
  body { font: 11pt/1.45 -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #111827; }
  h1, h2, h3 { color: #1d2666; }
  h1 { font-size: 24pt; margin: 0 0 4pt; }
  h2 { font-size: 14pt; margin: 22pt 0 6pt; border-bottom: 1px solid #e5e7eb; padding-bottom: 4pt; }
  h3 { font-size: 11pt; margin: 12pt 0 4pt; }
  .muted { color: #6b7280; }
  .row { display: flex; gap: 12pt; }
  .col { flex: 1 1 0; }
  .badge { display: inline-block; background: #eef2ff; color: #312e81; border-radius: 9999px; padding: 1pt 8pt; font-size: 9pt; margin: 0 4pt 4pt 0; }
  .header { display: flex; justify-content: space-between; align-items: flex-end; }
  ul { padding-left: 18pt; margin: 4pt 0; }
  table { width: 100%; border-collapse: collapse; }
  td, th { padding: 4pt 6pt; border-bottom: 1px solid #e5e7eb; text-align: left; vertical-align: top; }
  .signbox { margin-top: 24pt; border-top: 1px solid #d1d5db; padding-top: 8pt; height: 60pt; }
  .footer { margin-top: 32pt; font-size: 9pt; color: #6b7280; }
  @media print { .noprint { display: none !important; } }
</style></head><body>
<div class="noprint" style="background:#eef2ff;border:1px solid #c7d2fe;padding:8pt 12pt;border-radius:8pt;margin-bottom:16pt;font-size:10pt;">
  Tip: use your browser's <strong>Save as PDF</strong> from the print dialog (⌘/Ctrl+P).
</div>
<div class="header">
  <div>
    <div class="muted" style="font-size:10pt;letter-spacing:.06em;text-transform:uppercase;">${escapeHtml(env.NEXT_PUBLIC_COMPANY_NAME)} · Discovery report</div>
    <h1>${escapeHtml(p.title)}</h1>
    <div class="muted">${escapeHtml((client as Client | null)?.full_name ?? "")} · ${escapeHtml((client as Client | null)?.address_city ?? "")}, ${escapeHtml((client as Client | null)?.address_state ?? "")}</div>
  </div>
  <div style="text-align:right" class="muted">${new Date().toLocaleDateString()}</div>
</div>

<h2>Client summary</h2>
<p>${escapeHtml(summary.client_summary)}</p>

<div class="row">
  <div class="col">
    <h2>Pain points</h2>
    <ul>${summary.pain_points.map((x) => `<li>${escapeHtml(x)}</li>`).join("") || "<li class='muted'>None recorded</li>"}</ul>
  </div>
  <div class="col">
    <h2>Design direction</h2>
    <p>${escapeHtml(summary.design_direction)}</p>
  </div>
</div>

<h2>Scope draft</h2>
${summary.scope_draft
  .map(
    (s) => `<h3>${escapeHtml(s.category)}</h3><ul>${s.items.map((it) => `<li>${escapeHtml(it)}</li>`).join("")}</ul>`,
  )
  .join("")}

<h2>Budget overview</h2>
<table>
  <tr><th>Minimum</th><th>Ideal</th><th>Maximum</th><th>Expected value</th></tr>
  <tr>
    <td>${money(p.budget_min)}</td>
    <td>${money(p.budget_ideal)}</td>
    <td>${money(p.budget_max)}</td>
    <td>${money(p.expected_value)}</td>
  </tr>
</table>

<h2>Timeline</h2>
<table>
  <tr><th>Desired completion</th><th>Hard deadline</th><th>Start flexibility</th></tr>
  <tr>
    <td>${escapeHtml(p.desired_completion ?? "—")}</td>
    <td>${escapeHtml(p.hard_deadline ?? "—")}</td>
    <td>${escapeHtml(p.start_flexibility ?? "—")}</td>
  </tr>
</table>

${summary.missing_information.length
  ? `<h2>Open items</h2>${summary.missing_information.map((m) => `<span class="badge">${escapeHtml(m)}</span>`).join("")}`
  : ""}

<div class="row" style="margin-top:36pt">
  <div class="col"><div class="signbox"></div><div class="muted" style="font-size:9pt">Client signature & date</div></div>
  <div class="col"><div class="signbox"></div><div class="muted" style="font-size:9pt">${escapeHtml(env.NEXT_PUBLIC_COMPANY_NAME)} representative</div></div>
</div>

<div class="footer">${escapeHtml(env.NEXT_PUBLIC_APP_NAME)} · Project ${p.id}</div>
</body></html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function escapeHtml(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function money(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(n));
}
