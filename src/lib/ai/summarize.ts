import type { Project, Client } from "@/lib/supabase/database.types";
import type { Answers } from "@/lib/intake/types";

export interface ProjectSummaryInput {
  project: Project;
  client: Client | null;
  answersBySet: Record<string, Answers>; // keyed by set slug (and optional ::roomKind)
}

export interface ProjectSummary {
  client_summary: string;
  pain_points: string[];
  design_direction: string;
  scope_draft: { category: string; items: string[] }[];
  suggested_materials: { category: string; suggestions: string[] }[];
  missing_information: string[];
}

/**
 * Deterministic, no-network fallback summary so the app produces useful output
 * even before an AI provider is wired up. When OPENAI_API_KEY is set, we call
 * the API for a richer narrative; otherwise we ship this rule-based version.
 */
export function buildLocalSummary(input: ProjectSummaryInput): ProjectSummary {
  const { project: p, client: c, answersBySet } = input;

  const overview = answersBySet["project_overview_v1"] ?? {};
  const kitchen = answersBySet["kitchen_v1::kitchen"] ?? answersBySet["kitchen_v1"] ?? {};
  const primaryBath = answersBySet["bathroom_v1::primary_bath"] ?? {};
  const fullHome = answersBySet["full_home_v1"] ?? {};

  // Only use the actual style / palette tokens the user picked. No silent
  // defaults — those leaked "transitional / warm neutrals" into reports
  // for clients who never specified them.
  const styleArr = Array.isArray(kitchen.style) ? (kitchen.style as string[]) : [];
  const paletteArr = Array.isArray(kitchen.palette) ? (kitchen.palette as string[]) : [];
  const styleTokens = styleArr.length > 0 ? styleArr.join(", ") : null;
  const palette = paletteArr.length > 0 ? paletteArr.join(", ") : null;

  const client_summary = [
    `${c?.full_name ?? "Client"} — ${p.title}.`,
    p.motivation
      ? `Motivation: ${p.motivation}.`
      : overview.motivation
        ? `Motivation: ${overview.motivation}.`
        : "",
    `Top priorities: ${p.top_priorities ?? overview.top_priorities ?? "TBD"}.`,
    p.budget_ideal != null
      ? `Budget around $${Math.round(p.budget_ideal).toLocaleString()} (range $${Math.round(p.budget_min ?? 0).toLocaleString()} – $${Math.round(p.budget_max ?? p.budget_ideal).toLocaleString()}).`
      : "Budget TBD.",
  ]
    .filter(Boolean)
    .join(" ");

  const pain_points = [
    p.pain_points,
    kitchen.what_frustrates as string,
    kitchen.storage_issues as string,
    primaryBath.current_issues as string,
  ]
    .filter((s): s is string => !!s)
    .map((s) => s.trim());

  const design_direction =
    [
      styleTokens ? `Style: ${styleTokens}.` : "",
      palette ? `Palette: ${palette}.` : "",
      p.design_boldness != null ? `Boldness ${p.design_boldness}/100.` : "",
      p.luxury_level != null ? `Luxury ${p.luxury_level}/100.` : "",
    ]
      .filter(Boolean)
      .join(" ") || "Style and palette not yet captured — confirm with the client before sharing.";

  const scope_draft: ProjectSummary["scope_draft"] = [];
  if (p.type === "kitchen" || p.rooms.includes("kitchen")) {
    scope_draft.push({
      category: "Kitchen",
      items: [
        kitchen.cabinet_make ? `${kitchen.cabinet_make} cabinets, ${kitchen.cabinet_door ?? "shaker"} door, ${kitchen.cabinet_finish ?? "painted"}` : "Cabinetry per scope",
        kitchen.counter_material ? `${kitchen.counter_material} countertops${kitchen.waterfall ? " with waterfall edge" : ""}` : "Countertops",
        kitchen.ventilation ? `Ventilation: ${kitchen.ventilation}` : "Ventilation per code",
        kitchen.new_flooring ? `Flooring: ${kitchen.new_flooring}` : "Flooring",
      ],
    });
  }
  if (p.rooms.some((r) => r.includes("bath"))) {
    scope_draft.push({
      category: "Bathroom",
      items: [
        primaryBath.shower_type ? `Shower: ${primaryBath.shower_type}${primaryBath.frameless_glass ? ", frameless glass" : ""}` : "Shower",
        primaryBath.tub_type && primaryBath.tub_type !== "none" ? `Tub: ${primaryBath.tub_type}` : "—",
        primaryBath.heated_floors ? "Heated floors" : "",
        primaryBath.steam ? "Steam shower w/ generator" : "",
      ].filter(Boolean) as string[],
    });
  }
  if (p.type === "full_home") {
    scope_draft.push({
      category: "Whole-home program",
      items: [
        fullHome.wall_removal ? "Selected wall removal" : "",
        fullHome.electrical_rewire ? "Electrical rewiring" : "",
        fullHome.plumbing_replace ? "Plumbing replacement" : "",
        fullHome.hvac_concerns ? "HVAC scope per concerns" : "",
      ].filter(Boolean) as string[],
    });
  }

  // Only suggest materials when the client actually picked something — otherwise
  // the report makes brand-specific recommendations the consultant never
  // discussed. The category-by-category fallbacks live inside each branch
  // so we never invent a counter_material the user didn't choose.
  const suggested_materials: ProjectSummary["suggested_materials"] = [];
  if (kitchen.counter_material) {
    const m = kitchen.counter_material as string;
    const list =
      m === "marble"
        ? ["Honed Carrara", "Calacatta Gold (book-matched)"]
        : m === "quartzite"
          ? ["Taj Mahal", "Mont Blanc"]
          : m === "quartz"
            ? ["Calacatta Nuvo Quartz", "Statuario Maximus Quartz"]
            : null;
    if (list) suggested_materials.push({ category: `Countertop · ${m}`, suggestions: list });
  }
  if (kitchen.cabinet_door) {
    const door = kitchen.cabinet_door as string;
    const list =
      door === "slab"
        ? ["Walnut veneer slab", "Rift white oak slab"]
        : door === "shaker"
          ? ["Inset shaker — painted (BM White Dove)", "Beaded inset — soft white"]
          : null;
    if (list) suggested_materials.push({ category: `Cabinetry · ${door}`, suggestions: list });
  }

  const missing_information: string[] = [];
  if (p.budget_ideal == null) missing_information.push("Budget — ideal target");
  if (!p.desired_completion) missing_information.push("Desired completion date");
  if (!c?.address_street) missing_information.push("Property address");
  if ((p.type === "kitchen" || p.rooms.includes("kitchen")) && !kitchen.layout_type) {
    missing_information.push("Kitchen layout");
  }

  return {
    client_summary,
    pain_points,
    design_direction,
    scope_draft,
    suggested_materials,
    missing_information,
  };
}

/**
 * Optional OpenAI-backed summarizer. Returns null if no key is configured —
 * the caller should fall back to {@link buildLocalSummary}.
 */
export async function aiSummarize(input: ProjectSummaryInput): Promise<ProjectSummary | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const local = buildLocalSummary(input);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              "You are a senior remodeling consultant. Improve the provided structured summary with sharper language, but keep the same JSON shape and keys. Do not invent facts.",
          },
          {
            role: "user",
            content: JSON.stringify({
              project: input.project,
              client: input.client,
              answers: input.answersBySet,
              draft_summary: local,
            }),
          },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!response.ok) return local;
    const data = (await response.json()) as { output_text?: string };
    if (!data.output_text) return local;
    const parsed = JSON.parse(data.output_text) as ProjectSummary;
    return parsed;
  } catch {
    return local;
  }
}
