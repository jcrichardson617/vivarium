"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function submitFeatureRequest(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("feature_requests").insert({
    title: String(formData.get("title") ?? "").trim(),
    details: String(formData.get("details") ?? "").trim() || null,
  });
  if (error) redirect(`/feedback?error=${encodeURIComponent(error.message)}`);
  redirect("/feedback?saved=1");
}
