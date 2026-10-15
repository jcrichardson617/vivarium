"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const STEPS = ["animal", "enclosure", "reminder", "all"];

// Skip one getting-started step, or "all" to hide the checklist for good.
export async function skipOnboarding(formData: FormData) {
  const step = String(formData.get("step"));
  if (!STEPS.includes(step)) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("onboarding_skipped").eq("id", user!.id).single();
  const skipped = [...new Set([...(profile?.onboarding_skipped ?? []), step])];
  await supabase.from("profiles").update({ onboarding_skipped: skipped }).eq("id", user!.id);
  revalidatePath("/animals");
}
