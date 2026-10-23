"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim() || null;

function back(formData: FormData, params: string): never {
  revalidatePath("/admin/genes");
  const qs = new URLSearchParams(String(formData.get("return") ?? ""));
  for (const [k, v] of new URLSearchParams(params)) qs.set(k, v);
  redirect(`/admin/genes?${qs}`);
}

export async function saveGene(formData: FormData) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("genes")
    .update({
      name: String(formData.get("name") ?? "").trim(),
      inheritance: String(formData.get("inheritance")),
      allelic_group: text(formData, "allelic_group"),
      super_name: text(formData, "super_name"),
      aliases: String(formData.get("aliases") ?? "")
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
      notes: text(formData, "notes"),
      health_note: text(formData, "health_note"),
      super_health_note: text(formData, "super_health_note"),
      super_lethal: formData.get("super_lethal") === "on",
      active: formData.get("active") === "on",
      // "Save & verify" sends verify=1; plain Save keeps the checkbox value.
      verified: formData.get("verify") === "1" || formData.get("verified") === "on",
    })
    .eq("id", String(formData.get("id")))
    .select("id");
  // RLS turns a disallowed update into zero rows rather than an error.
  const message = error?.message ?? (data?.length ? null : "Not saved: you don't have permission to edit genes.");
  back(formData, message ? `error=${encodeURIComponent(message)}` : "saved=1");
}
