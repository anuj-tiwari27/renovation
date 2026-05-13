import { IntakeWizard } from "@/components/intake/wizard";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { Project, ProjectType, Answer, Room, Client } from "@/lib/supabase/database.types";
import type { Answers } from "@/lib/intake/types";

interface Props {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ type?: string; rooms?: string }>;
}

export const dynamic = "force-dynamic";
export const metadata = { title: "Intake" };

export default async function IntakePage({ params, searchParams }: Props) {
  const { projectId } = await params;
  const sp = await searchParams;

  // Defaults from URL — used only when the project hasn't been persisted yet
  // (e.g. `new:<uuid>` scratch IDs created by the legacy `/intake/new` form).
  let projectType: ProjectType = (sp.type as ProjectType) ?? "kitchen";
  let selectedRooms = (sp.rooms ?? "").split(",").filter(Boolean);
  let clientId: string | null = null;
  const roomIdByKind: Record<string, string> = {};
  let initialAnswers: Record<string, Answers> | undefined;

  // For real (persisted) projects we hydrate everything from the database so
  // "Continue intake" and "Edit response" actually show what was filled in.
  const isPersisted = !projectId.startsWith("new:") && isSupabaseConfigured();
  if (isPersisted) {
    const supa = await createClient();

    const { data: project } = await supa
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .maybeSingle();

    if (project) {
      const p = project as Project;
      projectType = p.type;
      selectedRooms = p.rooms ?? [];
    }

    const { data: rooms } = await supa.from("rooms").select("*").eq("project_id", projectId);
    for (const r of (rooms as Room[] | null) ?? []) {
      roomIdByKind[r.kind] = r.id;
    }

    if (project) {
      const { data: clientRow } = await supa
        .from("clients")
        .select("*")
        .eq("id", (project as Project).client_id)
        .maybeSingle();
      if (clientRow) clientId = (clientRow as Client).id;

      // Hydrate answers: build the same `${slug}::${roomKind ?? '_'}` keys the
      // wizard / Zustand store use, then dump previously-saved values in.
      const { data: answers } = await supa.from("answers").select("*").eq("project_id", projectId);
      const grouped: Record<string, Answers> = {};
      const roomKindById = Object.fromEntries(Object.entries(roomIdByKind).map(([k, v]) => [v, k]));
      for (const a of (answers as Answer[] | null) ?? []) {
        const roomKind = a.room_id ? roomKindById[a.room_id] ?? "_" : "_";
        const key = `${a.question_set_slug}::${roomKind}`;
        grouped[key] = { ...(grouped[key] ?? {}), [a.question_id]: a.value };
      }

      // Also seed answers from the canonical columns so the wizard shows the
      // fields the user typed during the very first intake (those went into
      // projects/clients but the answers table might be empty if they signed
      // up before the bound-field sync shipped).
      const p = project as Project;
      const c = clientRow as Client | null;
      const seed = (slug: string, roomKind: string | null, kv: Record<string, unknown>) => {
        const key = `${slug}::${roomKind ?? "_"}`;
        const next = { ...(grouped[key] ?? {}) };
        for (const [k, v] of Object.entries(kv)) {
          if (next[k] == null && v != null && v !== "") next[k] = v;
        }
        grouped[key] = next;
      };
      if (c) {
        seed("client_info_v1", null, {
          full_name: c.full_name,
          email: c.email,
          phone: c.phone,
          address_street: c.address_street,
          address_city: c.address_city,
          address_state: c.address_state,
          address_zip: c.address_zip,
          preferred_comm: c.preferred_comm,
          best_time_to_contact: c.best_time_to_contact,
          referral_source: c.referral_source,
        });
      }
      seed("project_overview_v1", null, {
        desired_completion: p.desired_completion,
        start_flexibility: p.start_flexibility,
        function_vs_aesthetic: p.function_vs_aesthetic,
        luxury_level: p.luxury_level,
        budget_flexibility: p.budget_flexibility,
        timeline_urgency: p.timeline_urgency,
        design_boldness: p.design_boldness,
        accessibility_needs: p.accessibility_needs,
        aging_in_place: p.aging_in_place,
        child_pet_considerations: p.child_pet_considerations,
      });
      seed("budget_v1", null, {
        budget_min: p.budget_min,
        budget_ideal: p.budget_ideal,
        budget_max: p.budget_max,
        budget_financing: p.budget_financing,
      });
      seed("timeline_v1", null, {
        hard_deadline: p.hard_deadline,
        vacation_schedule: p.vacation_schedule,
        temporary_relocation: p.temporary_relocation,
        hoa_restrictions: p.hoa_restrictions,
        permit_concerns: p.permit_concerns,
      });
      for (const r of (rooms as Room[] | null) ?? []) {
        seed(
          r.kind === "kitchen" ? "kitchen_v1" : "bathroom_v1",
          r.kind,
          {
            length_in: r.length_in,
            width_in: r.width_in,
            ceiling_in: r.ceiling_in,
            layout_type: r.layout_type,
          },
        );
      }

      initialAnswers = grouped;
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <IntakeWizard
        projectId={projectId}
        projectType={projectType}
        selectedRooms={selectedRooms.length ? selectedRooms : ["kitchen"]}
        clientId={clientId}
        roomIdByKind={roomIdByKind}
        initialAnswers={initialAnswers}
      />
    </div>
  );
}
