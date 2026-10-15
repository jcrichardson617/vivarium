"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Add or remove one tag on the animals ticked in table view.
export async function bulkTag(formData: FormData) {
  const supabase = await createClient();
  const ids = formData.getAll("ids").map(String);
  const tag = String(formData.get("tag") ?? "").trim();
  const back = String(formData.get("back") ?? "/animals");
  const safeBack = back.startsWith("/animals") ? back : "/animals";
  const sep = safeBack.includes("?") ? "&" : "?";
  if (!ids.length || !tag) redirect(`${safeBack}${sep}error=${encodeURIComponent("Tick some animals and enter a tag.")}`);
  const add = formData.get("op") !== "remove";
  const { data, error } = await supabase.rpc("fn59_tag_animals", { p_animal_ids: ids, p_tag: tag, p_add: add });
  if (error) redirect(`${safeBack}${sep}error=${encodeURIComponent(error.message)}`);
  redirect(`${safeBack}${sep}notice=${encodeURIComponent(`${add ? "Tagged" : "Untagged"} ${data} animal${data === 1 ? "" : "s"}.`)}`);
}
