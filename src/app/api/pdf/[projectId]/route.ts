import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, env } from "@/lib/env";
import { aiSummarize, buildLocalSummary } from "@/lib/ai/summarize";
import type {
  Project,
  Client,
  Answer,
  Estimate,
  ScopeItem,
} from "@/lib/supabase/database.types";

/**
 * Print-ready HTML report. Two modes:
 *   /api/pdf/<projectId>                    -> discovery report
 *   /api/pdf/<projectId>?estimate=<id>      -> formal estimate
 *
 * The HTML is designed to print cleanly to PDF via the browser's
 * "Save as PDF" dialog — we avoid native PDF deps so the app stays
 * portable across Vercel / Cloudflare / Bun.
 */
export async function GET(req: Request, ctx: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await ctx.params;
  if (!isSupabaseConfigured()) {
    return new NextResponse("Supabase not configured", { status: 503 });
  }
  const url = new URL(req.url);
  const estimateId = url.searchParams.get("estimate");
  const origin = `${url.protocol}//${url.host}`;

  const supa = await createClient();
  const { data: project } = await supa.from("projects").select("*").eq("id", projectId).maybeSingle();
  if (!project) return new NextResponse("Not found", { status: 404 });
  const p = project as Project;
  const { data: client } = await supa.from("clients").select("*").eq("id", p.client_id).maybeSingle();
  const c = client as Client | null;

  const html = estimateId
    ? await buildEstimateHtml(supa, p, c, estimateId, origin)
    : await buildDiscoveryHtml(supa, p, c, projectId, origin);

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

// =============================================================
// Discovery report
// =============================================================

async function buildDiscoveryHtml(
  supa: Awaited<ReturnType<typeof createClient>>,
  p: Project,
  c: Client | null,
  projectId: string,
  origin: string,
): Promise<string> {
  const { data: answersRows } = await supa.from("answers").select("*").eq("project_id", projectId);
  const answersBySet: Record<string, Record<string, unknown>> = {};
  for (const a of (answersRows ?? []) as Answer[]) {
    const key = a.room_id ? `${a.question_set_slug}::${a.room_id}` : a.question_set_slug;
    answersBySet[key] = { ...(answersBySet[key] ?? {}), [a.question_id]: a.value };
  }

  const summary =
    (await aiSummarize({ project: p, client: c, answersBySet })) ??
    buildLocalSummary({ project: p, client: c, answersBySet });

  const logoUrl = `${origin}/brand/icon.png`;
  const companyName = env.NEXT_PUBLIC_COMPANY_NAME;

  return wrap({
    title: `${p.title} — Discovery report`,
    body: `
      ${header({ logoUrl, companyName, eyebrow: "Discovery report", title: p.title, subtitle: clientLine(c) })}

      <section class="card">
        <h2>Client summary</h2>
        <p class="lede">${escapeHtml(summary.client_summary)}</p>
      </section>

      <div class="cols">
        <section class="card">
          <h2>Pain points</h2>
          ${summary.pain_points.length
            ? `<ul>${summary.pain_points.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`
            : `<p class="muted">None recorded.</p>`}
        </section>
        <section class="card">
          <h2>Design direction</h2>
          <p>${escapeHtml(summary.design_direction)}</p>
        </section>
      </div>

      <section class="card">
        <h2>Scope draft</h2>
        ${summary.scope_draft
          .map(
            (s) => `
              <h3>${escapeHtml(s.category)}</h3>
              <ul>${s.items.map((it) => `<li>${escapeHtml(it)}</li>`).join("")}</ul>
            `,
          )
          .join("") || `<p class="muted">No items yet.</p>`}
      </section>

      ${summary.suggested_materials.length
        ? `<section class="card">
            <h2>Suggested materials</h2>
            <div class="cols">
              ${summary.suggested_materials
                .map(
                  (m) => `<div>
                    <h3>${escapeHtml(m.category)}</h3>
                    <ul>${m.suggestions.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>
                  </div>`,
                )
                .join("")}
            </div>
          </section>`
        : ""}

      <div class="cols">
        <section class="card">
          <h2>Budget overview</h2>
          <table class="kv">
            <tr><td>Minimum</td><td>${money(p.budget_min)}</td></tr>
            <tr><td>Ideal</td><td>${money(p.budget_ideal)}</td></tr>
            <tr><td>Maximum</td><td>${money(p.budget_max)}</td></tr>
            <tr><td>Expected value</td><td>${money(p.expected_value)}</td></tr>
          </table>
        </section>
        <section class="card">
          <h2>Timeline</h2>
          <table class="kv">
            <tr><td>Desired completion</td><td>${escapeHtml(p.desired_completion ?? "—")}</td></tr>
            <tr><td>Hard deadline</td><td>${escapeHtml(p.hard_deadline ?? "—")}</td></tr>
            <tr><td>Start flexibility</td><td>${escapeHtml(p.start_flexibility ?? "—")}</td></tr>
          </table>
        </section>
      </div>

      ${summary.missing_information.length
        ? `<section class="card">
            <h2>Open items</h2>
            ${summary.missing_information.map((m) => `<span class="badge">${escapeHtml(m)}</span>`).join("")}
          </section>`
        : ""}

      ${signatureBlock(companyName)}

      ${footer(companyName, p.id)}
    `,
  });
}

// =============================================================
// Estimate report
// =============================================================

async function buildEstimateHtml(
  supa: Awaited<ReturnType<typeof createClient>>,
  p: Project,
  c: Client | null,
  estimateId: string,
  origin: string,
): Promise<string> {
  const { data: est } = await supa
    .from("estimates")
    .select("*")
    .eq("id", estimateId)
    .maybeSingle();
  if (!est) return wrap({ title: "Not found", body: "<p>Estimate not found.</p>" });
  const e = est as Estimate;
  const { data: itemsRows } = await supa
    .from("scope_items")
    .select("*")
    .eq("estimate_id", estimateId)
    .order("position", { ascending: true });
  const items = (itemsRows as ScopeItem[] | null) ?? [];

  const subtotal = items.reduce((s, r) => s + Number(r.qty ?? 0) * Number(r.unit_price ?? 0), 0);
  const discount = subtotal * (Number(e.discount_percent ?? 0) / 100);
  const taxBase = subtotal - discount;
  const tax = taxBase * Number(e.tax_rate ?? 0);
  const total = taxBase + tax;

  const billTo = {
    name: e.bill_to_name ?? c?.full_name ?? "",
    email: e.bill_to_email ?? c?.email ?? "",
    phone: e.bill_to_phone ?? c?.phone ?? "",
    address:
      e.bill_to_address ??
      [c?.address_street, [c?.address_city, c?.address_state, c?.address_zip].filter(Boolean).join(", ")]
        .filter(Boolean)
        .join("\n"),
  };

  const logoUrl = `${origin}/brand/icon.png`;
  const companyName = env.NEXT_PUBLIC_COMPANY_NAME;

  // Group items by category
  const byCat = items.reduce<Record<string, ScopeItem[]>>((acc, r) => {
    (acc[r.category] ||= []).push(r);
    return acc;
  }, {});

  return wrap({
    title: `${p.title} — Estimate ${e.id.slice(0, 8).toUpperCase()}`,
    body: `
      ${header({
        logoUrl,
        companyName,
        eyebrow: `Estimate · ${e.status.toUpperCase()}`,
        title: p.title,
        subtitle: `#${e.id.slice(0, 8).toUpperCase()} · ${new Date(e.created_at).toLocaleDateString()}`,
      })}

      <section class="card">
        <div class="cols">
          <div>
            <div class="eyebrow">Bill to</div>
            <div class="strong">${escapeHtml(billTo.name)}</div>
            ${billTo.email ? `<div>${escapeHtml(billTo.email)}</div>` : ""}
            ${billTo.phone ? `<div>${escapeHtml(billTo.phone)}</div>` : ""}
            ${billTo.address ? `<div class="muted" style="white-space:pre-line">${escapeHtml(billTo.address)}</div>` : ""}
          </div>
          <div>
            <div class="eyebrow">Project</div>
            <div class="strong">${escapeHtml(p.title)}</div>
            <div class="muted">${escapeHtml(p.type.replace("_", " "))}</div>
            ${p.rooms.length ? `<div class="muted">${p.rooms.map((r) => escapeHtml(r.replace("_", " "))).join(" · ")}</div>` : ""}
          </div>
        </div>
      </section>

      <section class="card">
        <h2>Scope of work</h2>
        ${items.length === 0
          ? `<p class="muted">No line items yet.</p>`
          : Object.entries(byCat)
              .map(
                ([cat, rows]) => `
                  <h3>${escapeHtml(cat)}</h3>
                  <table class="items">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th style="text-align:right;width:50pt">Qty</th>
                        <th style="width:36pt">Unit</th>
                        <th style="text-align:right;width:80pt">Unit price</th>
                        <th style="text-align:right;width:80pt">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${rows
                        .map(
                          (r) => `
                            <tr>
                              <td>${escapeHtml(r.description)}${r.is_optional ? `<span class="badge">Optional</span>` : ""}</td>
                              <td style="text-align:right">${Number(r.qty)}</td>
                              <td>${escapeHtml(r.unit)}</td>
                              <td style="text-align:right">${money(Number(r.unit_price))}</td>
                              <td style="text-align:right">${money(Number(r.qty) * Number(r.unit_price))}</td>
                            </tr>
                          `,
                        )
                        .join("")}
                    </tbody>
                  </table>
                `,
              )
              .join("")}
      </section>

      <section class="card">
        <div class="totals">
          <table class="kv">
            <tr><td>Subtotal</td><td>${money(subtotal)}</td></tr>
            ${Number(e.discount_percent ?? 0) > 0
              ? `<tr><td>Discount (${Number(e.discount_percent).toFixed(2)}%)</td><td>${money(-discount)}</td></tr>`
              : ""}
            <tr><td>Tax (${(Number(e.tax_rate ?? 0) * 100).toFixed(2)}%)</td><td>${money(tax)}</td></tr>
            <tr class="total-row"><td>Total</td><td>${money(total)}</td></tr>
          </table>
        </div>
      </section>

      ${e.notes
        ? `<section class="card">
            <h2>Notes</h2>
            <p style="white-space:pre-line">${escapeHtml(e.notes)}</p>
          </section>`
        : ""}

      ${e.terms
        ? `<section class="card">
            <h2>Terms</h2>
            <p style="white-space:pre-line" class="muted">${escapeHtml(e.terms)}</p>
          </section>`
        : ""}

      ${signatureBlock(companyName)}
      ${footer(companyName, p.id)}
    `,
  });
}

// =============================================================
// Shared layout helpers
// =============================================================

function wrap({ title, body }: { title: string; body: string }): string {
  return `<!doctype html>
<html><head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
  :root {
    --ink: #0b0b0b;
    --muted: #6b7280;
    --line: #e5e7eb;
    --gold: #a3741b;
    --gold-light: #d4a73d;
    --bg: #ffffff;
  }
  @page { size: Letter; margin: 0.55in; }
  * { box-sizing: border-box; }
  body {
    font: 10.5pt/1.55 "Helvetica Neue", -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
    color: var(--ink);
    background: var(--bg);
    margin: 0;
  }
  h1 { font-family: Georgia, "Times New Roman", serif; font-size: 28pt; margin: 0 0 4pt; letter-spacing: -0.5pt; color: var(--ink); }
  h2 { font-family: Georgia, "Times New Roman", serif; font-size: 13pt; margin: 0 0 8pt; color: var(--ink); letter-spacing: 0.2pt; }
  h3 { font-size: 9pt; text-transform: uppercase; letter-spacing: 1.5pt; margin: 14pt 0 6pt; color: var(--gold); }
  p { margin: 0 0 6pt; }
  ul { padding-left: 16pt; margin: 4pt 0 0; }
  li { margin: 2pt 0; }
  .muted { color: var(--muted); }
  .strong { font-weight: 600; }
  .lede { font-size: 11pt; }
  .eyebrow { font-size: 8.5pt; text-transform: uppercase; letter-spacing: 1.5pt; color: var(--muted); margin-bottom: 4pt; }

  /* Header */
  .top {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    border-bottom: 2pt solid var(--gold);
    padding-bottom: 14pt;
    margin-bottom: 18pt;
  }
  .brand { display: flex; align-items: center; gap: 12pt; }
  .brand img { width: 56pt; height: 56pt; object-fit: contain; border-radius: 8pt; background: #0b0b0b; }
  .brand-text .name { font-family: Georgia, "Times New Roman", serif; font-size: 13pt; font-weight: 700; letter-spacing: 1pt; }
  .brand-text .name span { color: var(--gold); }
  .brand-text .tag { font-size: 8.5pt; letter-spacing: 2pt; text-transform: uppercase; color: var(--muted); margin-top: 2pt; }
  .header-meta { text-align: right; }
  .header-meta .eyebrow { color: var(--gold); }

  /* Sections / cards */
  .card {
    border: 1px solid var(--line);
    border-radius: 8pt;
    padding: 14pt 16pt;
    margin: 10pt 0;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 12pt; }

  /* Key-value table */
  table.kv { width: 100%; border-collapse: collapse; }
  table.kv td { padding: 5pt 0; border-bottom: 1px dashed var(--line); }
  table.kv td:first-child { color: var(--muted); }
  table.kv td:last-child { text-align: right; font-weight: 600; }
  table.kv tr:last-child td { border-bottom: 0; }

  /* Itemized table */
  table.items { width: 100%; border-collapse: collapse; margin: 6pt 0 12pt; }
  table.items th { font-size: 8.5pt; text-transform: uppercase; letter-spacing: 1pt; color: var(--muted); padding: 4pt 6pt; border-bottom: 1pt solid var(--line); text-align: left; }
  table.items td { padding: 6pt; border-bottom: 1px solid var(--line); vertical-align: top; }
  table.items tr:last-child td { border-bottom: 0; }

  /* Totals */
  .totals { display: flex; justify-content: flex-end; }
  .totals table.kv { max-width: 280pt; }
  .totals tr.total-row td { border-bottom: 0; border-top: 2pt solid var(--gold); font-size: 13pt; padding-top: 8pt; }

  /* Misc */
  .badge { display: inline-block; background: #fdf8e6; color: var(--gold); border: 1px solid #f3df85; border-radius: 9999px; padding: 1pt 8pt; font-size: 8.5pt; margin: 0 4pt 4pt 0; }
  .signature-row { display: grid; grid-template-columns: 1fr 1fr; gap: 24pt; margin-top: 28pt; page-break-inside: avoid; break-inside: avoid; }
  .signbox { border-top: 1.5pt solid var(--ink); padding-top: 6pt; min-height: 60pt; }
  .signbox .eyebrow { color: var(--muted); }

  .footer { margin-top: 24pt; padding-top: 10pt; border-top: 1px solid var(--line); font-size: 8.5pt; color: var(--muted); display: flex; justify-content: space-between; }

  .toolbar {
    background: #fdf8e6;
    border: 1px solid #f3df85;
    color: #8b6b1c;
    padding: 8pt 12pt;
    border-radius: 8pt;
    margin-bottom: 16pt;
    font-size: 9.5pt;
  }
  @media print { .toolbar { display: none; } }
</style>
</head><body>
<div class="toolbar">
  <strong>Save as PDF:</strong> use your browser's print dialog (⌘/Ctrl + P) and choose <em>Save as PDF</em>.
</div>
${body}
</body></html>`;
}

function header(args: {
  logoUrl: string;
  companyName: string;
  eyebrow: string;
  title: string;
  subtitle: string;
}): string {
  return `
    <div class="top">
      <div class="brand">
        <img src="${escapeHtml(args.logoUrl)}" alt="">
        <div class="brand-text">
          <div class="name">${escapeHtml(args.companyName)}</div>
          <div class="tag">Kitchen · Bath · Full Home</div>
        </div>
      </div>
      <div class="header-meta">
        <div class="eyebrow">${escapeHtml(args.eyebrow)}</div>
        <h1>${escapeHtml(args.title)}</h1>
        <div class="muted">${escapeHtml(args.subtitle)}</div>
      </div>
    </div>
  `;
}

function signatureBlock(companyName: string): string {
  return `
    <div class="signature-row">
      <div class="signbox"><div class="eyebrow">Client signature & date</div></div>
      <div class="signbox"><div class="eyebrow">${escapeHtml(companyName)} representative</div></div>
    </div>
  `;
}

function footer(companyName: string, projectId: string): string {
  return `
    <div class="footer">
      <span>${escapeHtml(companyName)}</span>
      <span>Project · ${escapeHtml(projectId.slice(0, 8))}</span>
      <span>${new Date().toLocaleDateString()}</span>
    </div>
  `;
}

function clientLine(c: Client | null): string {
  if (!c) return "";
  const parts = [c.full_name, [c.address_city, c.address_state].filter(Boolean).join(", ")].filter(Boolean);
  return parts.join(" · ");
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
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(n));
}
