"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Share an animal by username, or change the role of an existing share. Owner only (checked in the database).
export async function shareAnimal(formData: FormData) {
  const supabase = await createClient();
  const animalId = String(formData.get("animal_id"));
  const username = String(formData.get("username") ?? "").trim();
  const role = formData.get("role") === "viewer" ? "viewer" : "caretaker";
  const { error } = await supabase.rpc("fn68_share_animal", { p_animal_id: animalId, p_username: username, p_role: role });
  if (error) redirect(`/animals/${animalId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/animals/${animalId}`);
  redirect(`/animals/${animalId}?saved=${encodeURIComponent(`Shared with @${username.replace(/^@/, "")}`)}`);
}

// The owner removes someone, or a keeper leaves an animal shared with them.
export async function removeShare(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const animalId = String(formData.get("animal_id"));
  const userId = String(formData.get("user_id"));
  const { error } = await supabase.from("animal_shares").delete().eq("animal_id", animalId).eq("user_id", userId);
  if (error) redirect(`/animals/${animalId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/animals");
  if (userId === user?.id) redirect("/animals");
  revalidatePath(`/animals/${animalId}`);
  redirect(`/animals/${animalId}?saved=${encodeURIComponent("Access removed")}`);
}
