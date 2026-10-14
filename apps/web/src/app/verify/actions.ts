"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/animals";
}

function verifyUrl(email: string, extra: string) {
  return `/verify?email=${encodeURIComponent(email)}&${extra}`;
}

export async function verifyCode(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "");
  const token = String(formData.get("code") ?? "").replace(/\s/g, "");
  const next = safeNext(formData.get("next"));

  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });

  if (error) {
    redirect(verifyUrl(email, `error=${encodeURIComponent("That code is incorrect or has expired.")}&next=${encodeURIComponent(next)}`));
  }
  redirect(next);
}

export async function resendCode(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "");
  const next = safeNext(formData.get("next"));

  const { error } = await supabase.auth.resend({ type: "signup", email });

  const status = error
    ? `error=${encodeURIComponent(error.message)}`
    : `message=${encodeURIComponent("A new code is on its way.")}`;
  redirect(verifyUrl(email, `${status}&next=${encodeURIComponent(next)}`));
}
