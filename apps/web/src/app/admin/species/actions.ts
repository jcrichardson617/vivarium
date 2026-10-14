"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function approveSpecies(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn15_approve_species_submission", {
    p_submission_id: String(formData.get("id")),
  });
  if (error) redirect(`/admin/species?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/species");
}

export async function rejectSpecies(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn16_reject_species_submission", {
    p_submission_id: String(formData.get("id")),
  });
  if (error) redirect(`/admin/species?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/species");
}
