"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Queues the email; the send-emails edge function sends it from info@ within seconds.
export async function sendEmail(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn60_send_email", {
    p_to: String(formData.get("to") ?? ""),
    p_subject: String(formData.get("subject") ?? ""),
    p_body: String(formData.get("body") ?? ""),
  });
  revalidatePath("/admin/email");
  redirect(error ? `/admin/email?error=${encodeURIComponent(error.message)}` : "/admin/email?sent=1");
}
