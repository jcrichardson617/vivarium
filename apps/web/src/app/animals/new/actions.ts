"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createAnimal(formData: FormData) {
  const supabase = await createClient();
  const hatchDate = String(formData.get("hatch_date") ?? "");

  const { error } = await supabase.rpc("fn19_create_animal", {
    p_species_id: String(formData.get("species_id")),
    p_name: String(formData.get("name")),
    p_sex: String(formData.get("sex")),
    p_hatch_date: hatchDate || undefined,
  });

  if (error) {
    redirect(`/animals/new?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/animals");
}
