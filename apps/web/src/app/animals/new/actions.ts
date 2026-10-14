"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createAnimal(formData: FormData) {
  const supabase = await createClient();
  const hatchDate = String(formData.get("hatch_date") ?? "");
  const acquiredDate = String(formData.get("acquired_date") ?? "");

  const name = String(formData.get("name"));
  const sex = String(formData.get("sex"));

  // Either a listed species, or a request for a new one that a moderator approves later.
  const { data: animalId, error } =
    formData.get("mode") === "request"
      ? await supabase.rpc("fn34_create_animal_with_species_request", {
          p_scientific_name: String(formData.get("request_scientific_name") ?? ""),
          p_common_name: String(formData.get("request_common_name") ?? ""),
          p_taxon_class: String(formData.get("request_taxon_class") ?? "Reptilia"),
          p_name: name,
          p_sex: sex,
          p_hatch_date: hatchDate || undefined,
        })
      : await supabase.rpc("fn19_create_animal", {
          p_species_id: String(formData.get("species_id")),
          p_name: name,
          p_sex: sex,
          p_hatch_date: hatchDate || undefined,
        });

  if (error) {
    redirect(`/animals/new?error=${encodeURIComponent(error.message)}`);
  }

  // Acquisition details are private to the owner, so they live in their own table.
  if (acquiredDate) {
    const { error: acquisitionError } = await supabase
      .from("animal_acquisitions")
      .insert({ animal_id: animalId, acquired_date: acquiredDate });
    if (acquisitionError) {
      redirect(`/animals?error=${encodeURIComponent(`Animal saved, but the acquisition date was not: ${acquisitionError.message}`)}`);
    }
  }
  redirect("/animals");
}
