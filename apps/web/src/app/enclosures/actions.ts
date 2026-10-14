"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toC, toCm, unitSystemFor } from "@/lib/units";

function num(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value === "" ? null : Number(value);
}
function text(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value === "" ? null : value;
}

async function units() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("unit_system, country").eq("id", user!.id).single();
  return { supabase, user: user!, u: unitSystemFor(profile) };
}

const cm = (v: number | null, u: "metric" | "imperial") => (v === null ? null : Math.round(toCm(v, u) * 10) / 10);
const c = (v: number | null, u: "metric" | "imperial") => (v === null ? null : Math.round(toC(v, u) * 10) / 10);

export async function createEnclosure(formData: FormData) {
  const { supabase, u } = await units();
  const { data, error } = await supabase
    .from("enclosures")
    .insert({
      name: text(formData, "name") ?? "Enclosure",
      enclosure_type: text(formData, "enclosure_type"),
      length_cm: cm(num(formData, "length"), u),
      width_cm: cm(num(formData, "width"), u),
      height_cm: cm(num(formData, "height"), u),
      substrate: text(formData, "substrate"),
      heat_source: text(formData, "heat_source"),
      uvb_type: text(formData, "uvb_type"),
      target_hot_temp_c: c(num(formData, "target_hot"), u),
      target_cool_temp_c: c(num(formData, "target_cool"), u),
      target_humidity_pct: num(formData, "target_humidity"),
      notes: text(formData, "notes"),
    })
    .select("id")
    .single();
  if (error) redirect(`/enclosures/new?error=${encodeURIComponent(error.message)}`);
  redirect(`/enclosures/${data.id}`);
}

export async function logEnvironment(formData: FormData) {
  const { supabase, u } = await units();
  const enclosureId = String(formData.get("enclosure_id"));
  const { error } = await supabase.from("environment_logs").insert({
    enclosure_id: enclosureId,
    temperature_hot_c: c(num(formData, "hot"), u),
    temperature_cool_c: c(num(formData, "cool"), u),
    humidity_pct: num(formData, "humidity"),
    uv_index: num(formData, "uv_index"),
    notes: text(formData, "notes"),
  });
  if (error) redirect(`/enclosures/${enclosureId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/enclosures/${enclosureId}`);
  redirect(`/enclosures/${enclosureId}?saved=Reading+logged`);
}

export async function deleteEnvironmentLog(formData: FormData) {
  const { supabase } = await units();
  const enclosureId = String(formData.get("enclosure_id"));
  await supabase.from("environment_logs").delete().eq("id", String(formData.get("id"))).eq("enclosure_id", enclosureId);
  revalidatePath(`/enclosures/${enclosureId}`);
  redirect(`/enclosures/${enclosureId}`);
}

// Move an animal into an enclosure (or out of all of them when enclosure_id is empty).
export async function moveAnimal(formData: FormData) {
  const { supabase } = await units();
  const animalId = String(formData.get("animal_id"));
  const enclosureId = text(formData, "enclosure_id");
  const back = String(formData.get("back") ?? `/animals/${animalId}`);
  const now = new Date().toISOString();

  const { error: endError } = await supabase
    .from("animal_enclosures")
    .update({ end_date: now })
    .eq("animal_id", animalId)
    .is("end_date", null);
  if (endError) redirect(`${back}?error=${encodeURIComponent(endError.message)}`);

  if (enclosureId) {
    const { error } = await supabase.from("animal_enclosures").insert({ animal_id: animalId, enclosure_id: enclosureId, start_date: now });
    if (error) redirect(`${back}?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath(back);
  redirect(`${back}?saved=${enclosureId ? "Moved" : "Removed+from+enclosure"}`);
}
