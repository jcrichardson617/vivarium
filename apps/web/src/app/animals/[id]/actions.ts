"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function text(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value === "" ? null : value;
}

function num(formData: FormData, key: string) {
  const value = text(formData, key);
  return value === null ? null : Number(value);
}

// "2026-10-14" from a date input becomes a timestamp; empty means now.
function when(formData: FormData) {
  const value = text(formData, "date");
  return value ? new Date(`${value}T12:00:00`).toISOString() : new Date().toISOString();
}

async function done(animalId: string, error: { message: string } | null, what: string) {
  if (error) redirect(`/animals/${animalId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/animals/${animalId}`);
  redirect(`/animals/${animalId}?saved=${encodeURIComponent(what)}`);
}

export async function logFeeding(formData: FormData) {
  const supabase = await createClient();
  const animalId = String(formData.get("animal_id"));
  const { error } = await supabase.from("feedings").insert({
    animal_id: animalId,
    fed_at: when(formData),
    feeder_type: text(formData, "feeder_type") ?? "Other",
    feeder_size: text(formData, "feeder_size"),
    quantity: num(formData, "quantity") ?? 1,
    accepted: formData.get("refused") !== "on",
    notes: text(formData, "notes"),
  });
  await done(animalId, error, "Feeding logged");
}

export async function logWeight(formData: FormData) {
  const supabase = await createClient();
  const animalId = String(formData.get("animal_id"));
  const { error } = await supabase.from("weight_logs").insert({
    animal_id: animalId,
    recorded_at: when(formData),
    weight_grams: num(formData, "weight_grams"),
    notes: text(formData, "notes"),
  });
  await done(animalId, error, "Weight logged");
}

export async function logLength(formData: FormData) {
  const supabase = await createClient();
  const animalId = String(formData.get("animal_id"));
  const { error } = await supabase.from("length_logs").insert({
    animal_id: animalId,
    recorded_at: when(formData),
    length_cm: num(formData, "length_cm") ?? 0,
    notes: text(formData, "notes"),
  });
  await done(animalId, error, "Length logged");
}

export async function logShed(formData: FormData) {
  const supabase = await createClient();
  const animalId = String(formData.get("animal_id"));
  const { error } = await supabase.from("sheds").insert({
    animal_id: animalId,
    shed_date: when(formData),
    complete_shed: formData.get("incomplete") !== "on",
    retained_eye_caps: formData.get("retained_eye_caps") === "on",
    retained_tail_tip: formData.get("retained_tail_tip") === "on",
    notes: text(formData, "notes"),
  });
  await done(animalId, error, "Shed logged");
}

export async function logHealth(formData: FormData) {
  const supabase = await createClient();
  const animalId = String(formData.get("animal_id"));
  const { error } = await supabase.from("health_events").insert({
    animal_id: animalId,
    event_date: when(formData),
    event_type: text(formData, "event_type") ?? "Other",
    severity: text(formData, "severity"),
    notes: text(formData, "notes"),
  });
  await done(animalId, error, "Health event logged");
}

export async function addNote(formData: FormData) {
  const supabase = await createClient();
  const animalId = String(formData.get("animal_id"));
  const { error } = await supabase.from("animal_notes").insert({
    animal_id: animalId,
    note_text: text(formData, "note_text") ?? "",
  });
  await done(animalId, error, "Note added");
}

const LOG_TABLES = ["feedings", "weight_logs", "length_logs", "sheds", "health_events", "animal_notes"] as const;

export async function deleteEntry(formData: FormData) {
  const supabase = await createClient();
  const animalId = String(formData.get("animal_id"));
  const table = String(formData.get("table")) as (typeof LOG_TABLES)[number];
  if (!LOG_TABLES.includes(table)) redirect(`/animals/${animalId}`);
  const { error } = await supabase.from(table).delete().eq("id", String(formData.get("id"))).eq("animal_id", animalId);
  await done(animalId, error, "Entry deleted");
}

export async function deletePhoto(formData: FormData) {
  const supabase = await createClient();
  const animalId = String(formData.get("animal_id"));
  const photoId = String(formData.get("photo_id"));
  const path = String(formData.get("storage_path"));
  const { error } = await supabase.from("animal_photos").delete().eq("id", photoId).eq("animal_id", animalId);
  if (!error) await supabase.storage.from("animal-photos").remove([path]);
  await done(animalId, error, "Photo deleted");
}

export async function makePrimaryPhoto(formData: FormData) {
  const supabase = await createClient();
  const animalId = String(formData.get("animal_id"));
  await supabase.from("animal_photos").update({ is_primary: false }).eq("animal_id", animalId).eq("is_primary", true);
  const { error } = await supabase
    .from("animal_photos")
    .update({ is_primary: true })
    .eq("id", String(formData.get("photo_id")))
    .eq("animal_id", animalId);
  await done(animalId, error, "Main photo updated");
}
