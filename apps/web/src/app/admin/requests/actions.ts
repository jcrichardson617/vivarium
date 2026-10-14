"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateRequest(formData: FormData) {
  const supabase = await createClient();
  await supabase
    .from("feature_requests")
    .update({
      status: String(formData.get("status")),
      admin_notes: String(formData.get("admin_notes") ?? "").trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", String(formData.get("id")));
  revalidatePath("/admin/requests");
}
