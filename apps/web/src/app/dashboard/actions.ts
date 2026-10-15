"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// One-tap feeding from the dashboard: repeats the animal's last meal type and
// size, logged now as eaten or refused.
export async function quickFeed(formData: FormData) {
  const animalId = String(formData.get("animal_id"));
  const accepted = formData.get("result") !== "refused";
  const supabase = await createClient();
  const { data: last } = await supabase
    .from("feedings")
    .select("feeder_type, feeder_size")
    .eq("animal_id", animalId)
    .order("fed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  await supabase.from("feedings").insert({
    animal_id: animalId,
    fed_at: new Date().toISOString(),
    feeder_type: last?.feeder_type ?? "Other",
    feeder_size: last?.feeder_size ?? null,
    quantity: 1,
    accepted,
  });
  revalidatePath("/dashboard");
  revalidatePath("/animals");
}
