"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function text(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value === "" ? null : value;
}

function back(animalId: string, params: string) {
  revalidatePath(`/animals/${animalId}`);
  revalidatePath(`/animals/${animalId}/edit`);
  redirect(`/animals/${animalId}/edit?${params}`);
}

export async function updateDetails(formData: FormData) {
  const supabase = await createClient();
  const animalId = String(formData.get("animal_id"));
  const status = text(formData, "status") ?? "active";

  const { error } = await supabase
    .from("animals")
    .update({
      name: text(formData, "name"),
      sex: text(formData, "sex") ?? "unknown",
      hatch_date: text(formData, "hatch_date"),
      status,
      status_date: status === "active" ? null : text(formData, "status_date"),
      visibility: formData.get("public") === "on" ? "public" : "private",
      sire_id: text(formData, "sire_id"),
      dam_id: text(formData, "dam_id"),
    })
    .eq("id", animalId);
  if (error) back(animalId, `error=${encodeURIComponent(error.message)}`);

  // Acquisition details are private, one row per owner.
  const acquired = text(formData, "acquired_date");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error: acqError } = await supabase
    .from("animal_acquisitions")
    .upsert({ animal_id: animalId, user_id: user!.id, acquired_date: acquired }, { onConflict: "animal_id,user_id" });
  if (acqError) back(animalId, `error=${encodeURIComponent(acqError.message)}`);

  back(animalId, "saved=Details+saved");
}

export async function addGene(formData: FormData) {
  const supabase = await createClient();
  const animalId = String(formData.get("animal_id"));
  const status = String(formData.get("gene_status"));
  const pct = text(formData, "het_probability");
  const { error } = await supabase.from("animal_genes").upsert(
    {
      animal_id: animalId,
      gene_id: String(formData.get("gene_id")),
      status,
      het_probability: status === "possible_het" ? Number(pct ?? 50) : null,
    },
    { onConflict: "animal_id,gene_id" },
  );
  back(animalId, error ? `error=${encodeURIComponent(error.message)}` : "saved=Gene+saved");
}

export async function removeGene(formData: FormData) {
  const supabase = await createClient();
  const animalId = String(formData.get("animal_id"));
  const { error } = await supabase.from("animal_genes").delete().eq("id", String(formData.get("id"))).eq("animal_id", animalId);
  back(animalId, error ? `error=${encodeURIComponent(error.message)}` : "saved=Gene+removed");
}

export async function deleteAnimal(formData: FormData) {
  const supabase = await createClient();
  const animalId = String(formData.get("animal_id"));
  if (String(formData.get("confirm") ?? "").trim().toLowerCase() !== "delete") {
    back(animalId, `error=${encodeURIComponent('Type "delete" to confirm.')}`);
  }

  // Remove photo files first; the database rows go with the animal.
  const { data: photos } = await supabase.from("animal_photos").select("storage_path").eq("animal_id", animalId);
  if (photos?.length) await supabase.storage.from("animal-photos").remove(photos.map((p) => p.storage_path));

  const { error } = await supabase.rpc("fn40_delete_animal", { p_animal_id: animalId });
  if (error) back(animalId, `error=${encodeURIComponent(error.message)}`);
  revalidatePath("/animals");
  redirect("/animals?deleted=1");
}
