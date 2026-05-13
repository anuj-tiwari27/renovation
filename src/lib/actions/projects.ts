"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function deleteProjectAction(projectId: string): Promise<void> {
  const supa = await createClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) throw new Error("UNAUTHENTICATED");

  // Cascading deletes are configured in the schema (rooms, answers, media…),
  // so removing the project tears down everything connected. We keep the
  // client row in case there are other projects for them.
  const { error } = await supa.from("projects").delete().eq("id", projectId);
  if (error) throw new Error(error.message);

  revalidatePath("/projects");
  revalidatePath("/leads");
  redirect("/projects");
}

export async function updateProjectStatusAction(
  projectId: string,
  status: string,
): Promise<void> {
  const supa = await createClient();
  const { error } = await supa.from("projects").update({ status }).eq("id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath("/leads");
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
}
