"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface CreateAppointmentInput {
  starts_at: string; // ISO
  ends_at: string; // ISO
  kind: string;
  project_id?: string | null;
  client_id?: string | null;
  staff_id?: string | null;
  location?: string | null;
  notes?: string | null;
}

export async function createAppointmentAction(input: CreateAppointmentInput) {
  if (!input.starts_at) throw new Error("Start time is required");
  if (!input.ends_at) throw new Error("End time is required");
  if (new Date(input.ends_at) <= new Date(input.starts_at)) {
    throw new Error("End time must be after start time");
  }

  const supa = await createClient();
  const { data: { user } } = await supa.auth.getUser();

  const { data, error } = await supa
    .from("appointments")
    .insert({
      starts_at: input.starts_at,
      ends_at: input.ends_at,
      kind: input.kind,
      project_id: input.project_id ?? null,
      client_id: input.client_id ?? null,
      staff_id: input.staff_id ?? user?.id ?? null,
      location: input.location ?? null,
      notes: input.notes ?? null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  if (input.project_id) {
    await supa.from("activities").insert({
      project_id: input.project_id,
      actor_id: user?.id ?? null,
      kind: "consultation_logged",
      payload: { appointment_id: (data as { id: string }).id, kind: input.kind },
    });
  }

  revalidatePath("/calendar");
  if (input.project_id) revalidatePath(`/projects/${input.project_id}`);
  return { id: (data as { id: string }).id };
}

export async function deleteAppointmentAction(id: string, projectId?: string | null) {
  const supa = await createClient();
  const { error } = await supa.from("appointments").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/calendar");
  if (projectId) revalidatePath(`/projects/${projectId}`);
}
