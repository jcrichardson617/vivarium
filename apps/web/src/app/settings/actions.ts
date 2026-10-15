"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function saveSettings(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const unit = String(formData.get("unit_system") ?? "");

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      display_name: String(formData.get("display_name") ?? "").trim() || username,
      country: String(formData.get("country") ?? "").trim().toUpperCase() || null,
      unit_system: unit === "metric" || unit === "imperial" ? unit : null,
      share_gear: formData.get("share_gear") === "on",
    })
    .eq("id", user!.id);

  if (error) {
    const message = error.code === "23505" ? `The username "${username}" is taken.` : error.message;
    redirect(`/settings?error=${encodeURIComponent(message)}`);
  }
  revalidatePath("/", "layout");
  redirect("/settings?saved=1");
}

export async function deleteAccount(formData: FormData) {
  const supabase = await createClient();
  if (String(formData.get("confirm") ?? "").trim().toLowerCase() !== "delete my account") {
    redirect(`/settings?error=${encodeURIComponent('Type "delete my account" to confirm.')}`);
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Remove photo files for animals they own; the rest is deleted in the database.
  const { data: owned } = await supabase
    .from("animal_ownership")
    .select("animal_id")
    .eq("user_id", user!.id)
    .eq("is_current_owner", true);
  const ids = (owned ?? []).map((o) => o.animal_id).filter((v): v is string => !!v);
  if (ids.length) {
    const { data: photos } = await supabase.from("animal_photos").select("storage_path").in("animal_id", ids);
    if (photos?.length) await supabase.storage.from("animal-photos").remove(photos.map((p) => p.storage_path));
  }

  const { error } = await supabase.rpc("fn41_delete_my_account");
  if (error) redirect(`/settings?error=${encodeURIComponent(error.message)}`);
  await supabase.auth.signOut();
  redirect("/?account_deleted=1");
}
