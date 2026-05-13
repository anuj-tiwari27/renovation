"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { ProjectStatus } from "@/lib/supabase/database.types";

export interface CreateSignatureInput {
  projectId: string;
  estimateId?: string | null;
  signerName: string;
  signerEmail?: string | null;
  /** SVG XML (already decoded from any data: URL on the client). */
  signatureSvg: string;
  /** When true, also bump the project status to discovery_completed. */
  advanceStatus?: boolean;
}

export async function createSignatureAction(input: CreateSignatureInput): Promise<{ id: string }> {
  if (!input.signerName.trim()) throw new Error("Signer name is required");
  if (!input.signatureSvg.trim()) throw new Error("Signature is required");

  const supa = await createClient();
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
  const ua = h.get("user-agent") ?? null;

  const { data, error } = await supa
    .from("signatures")
    .insert({
      project_id: input.projectId,
      estimate_id: input.estimateId ?? null,
      signer_name: input.signerName.trim(),
      signer_email: input.signerEmail?.trim() || null,
      signature_svg: input.signatureSvg,
      ip_address: ip,
      user_agent: ua,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  if (input.advanceStatus) {
    const nextStatus: ProjectStatus = "discovery_completed";
    await supa.from("projects").update({ status: nextStatus }).eq("id", input.projectId);
  }

  await supa.from("activities").insert({
    project_id: input.projectId,
    kind: "estimate_signed", // closest existing enum; reused for any signed event
    payload: {
      kind: input.estimateId ? "estimate" : "requirements",
      signer_name: input.signerName.trim(),
    },
  });

  revalidatePath(`/projects/${input.projectId}`);
  revalidatePath("/leads");
  revalidatePath("/projects");
  return { id: (data as { id: string }).id };
}
