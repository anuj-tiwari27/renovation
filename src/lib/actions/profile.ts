"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ProfilePatch {
  full_name?: string;
  phone?: string | null;
}

export async function updateProfileAction(patch: ProfilePatch) {
  const supa = await createClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) throw new Error("Not signed in");

  if (patch.full_name !== undefined && patch.full_name.trim().length < 2) {
    throw new Error("Name must be at least 2 characters");
  }

  const { error } = await supa
    .from("profiles")
    .update({
      full_name: patch.full_name?.trim(),
      phone: patch.phone?.trim() || null,
    })
    .eq("id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateEmailAction(newEmail: string) {
  const email = newEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address");
  }
  const supa = await createClient();
  const { error } = await supa.auth.updateUser({ email });
  if (error) throw new Error(error.message);
  // Supabase sends a confirmation email; the change isn't live until the
  // user clicks the link from BOTH the old and new mailboxes.
  return { ok: true, requiresConfirmation: true };
}

export async function updatePasswordAction(newPassword: string) {
  if (newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  const supa = await createClient();
  const { error } = await supa.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
  return { ok: true };
}
