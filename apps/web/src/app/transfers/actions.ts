"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function back(path: string, error: { message: string } | null, saved: string) {
  revalidatePath("/", "layout");
  redirect(`${path}?${error ? `error=${encodeURIComponent(error.message)}` : `saved=${encodeURIComponent(saved)}`}`);
}

export async function requestTransfer(formData: FormData) {
  const supabase = await createClient();
  const animalId = String(formData.get("animal_id"));
  const { error } = await supabase.rpc("fn63_request_transfer", {
    p_animal_id: animalId,
    p_username: String(formData.get("username") ?? ""),
    p_note: String(formData.get("note") ?? "").slice(0, 500),
  });
  back(`/animals/${animalId}`, error, "Transfer sent. We'll email them");
}

export async function acceptTransfer(formData: FormData) {
  const supabase = await createClient();
  const animalId = String(formData.get("animal_id"));
  const { error } = await supabase.rpc("fn01_accept_ownership_transfer", { transfer_uuid: String(formData.get("id")) });
  if (error) back("/transfers", error, "");
  revalidatePath("/", "layout");
  redirect(`/animals/${animalId}?saved=${encodeURIComponent("Welcome home. This animal is now in your collection")}`);
}

export async function declineTransfer(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn04_decline_ownership_transfer", { p_transfer_id: String(formData.get("id")) });
  back("/transfers", error, "Transfer declined");
}

export async function cancelTransfer(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn03_cancel_ownership_transfer", { p_transfer_id: String(formData.get("id")) });
  const from = String(formData.get("back") ?? "");
  back(/^\/animals\/[0-9a-f-]+$/.test(from) ? from : "/transfers", error, "Transfer cancelled");
}
