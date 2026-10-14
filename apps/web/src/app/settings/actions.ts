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
    })
    .eq("id", user!.id);

  if (error) {
    const message = error.code === "23505" ? `The username "${username}" is taken.` : error.message;
    redirect(`/settings?error=${encodeURIComponent(message)}`);
  }
  revalidatePath("/", "layout");
  redirect("/settings?saved=1");
}
