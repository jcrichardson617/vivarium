"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const url = (formData: FormData, key: string) => {
  const v = String(formData.get(key) ?? "").trim();
  return v.startsWith("https://") ? v : null;
};

function back(params: string): never {
  revalidatePath("/admin/products");
  redirect(`/admin/products?${params}`);
}

export async function saveProduct(formData: FormData) {
  const supabase = await createClient();
  const blocked = formData.get("blocked") === "on";
  const { error } = await supabase
    .from("products")
    .update({
      name: String(formData.get("name") ?? "").trim(),
      brand: String(formData.get("brand") ?? "").trim() || null,
      category: String(formData.get("category")),
      status: String(formData.get("status")),
      note: String(formData.get("note") ?? "").trim() || null,
      blocked,
      block_reason: blocked ? String(formData.get("block_reason") ?? "").trim() || null : null,
      amazon_url: url(formData, "amazon_url"),
      chewy_url: url(formData, "chewy_url"),
      other_url: url(formData, "other_url"),
    })
    .eq("id", String(formData.get("id")));
  back(error ? `error=${encodeURIComponent(error.message)}` : "saved=1");
}

export async function mergeProduct(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn52_merge_product", {
    p_from: String(formData.get("id")),
    p_into: String(formData.get("into")),
  });
  back(error ? `error=${encodeURIComponent(error.message)}` : "saved=1");
}
