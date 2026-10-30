"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function forgotUrl(email: string, extra: string) {
  return `/forgot-password?email=${encodeURIComponent(email)}&${extra}`;
}

export async function requestReset(formData: FormData) {
  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "";
  const email = String(formData.get("email") ?? "").trim();

  // The emailed link goes through the normal callback, which signs the user in
  // and then lands on the page that sets the new password.
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
  });

  if (error) {
    redirect(forgotUrl(email, `error=${encodeURIComponent(error.message)}`));
  }
  // Same response whether or not the address has an account, so the form can't be used to probe emails.
  redirect(forgotUrl(email, "sent=1"));
}

export async function verifyResetCode(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "");
  const token = String(formData.get("code") ?? "").replace(/\s/g, "");

  const { error } = await supabase.auth.verifyOtp({ email, token, type: "recovery" });

  if (error) {
    redirect(forgotUrl(email, `sent=1&error=${encodeURIComponent("That code is incorrect or has expired.")}`));
  }
  redirect("/reset-password");
}
