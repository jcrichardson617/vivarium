"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const password = String(formData.get("password") ?? "");

  if (password !== String(formData.get("confirm") ?? "")) {
    redirect(`/reset-password?error=${encodeURIComponent("The two passwords don't match.")}`);
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    // No session means the reset link expired or was opened in another browser.
    if (error.name === "AuthSessionMissingError") {
      redirect(`/forgot-password?error=${encodeURIComponent("Your reset link expired. Request a new one.")}`);
    }
    redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/dashboard");
}
