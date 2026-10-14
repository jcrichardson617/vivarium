"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function runJob(formData: FormData) {
  const supabase = await createClient();
  const job = String(formData.get("job"));
  const { error } = await supabase.rpc("fn44_run_research_job", { p_job: job });
  revalidatePath("/admin/library");
  redirect(`/admin/library?${error ? `error=${encodeURIComponent(error.message)}` : `started=${encodeURIComponent(job)}`}`);
}
