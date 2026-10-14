"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toC, unitSystemFor } from "@/lib/units";

function text(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value === "" ? null : value;
}
function num(formData: FormData, key: string) {
  const value = text(formData, key);
  return value === null ? null : Number(value);
}

function back(pairingId: string, params: string): never {
  revalidatePath(`/breeding/${pairingId}`);
  revalidatePath("/breeding");
  redirect(`/breeding/${pairingId}?${params}`);
}

export async function createPairing(formData: FormData) {
  const supabase = await createClient();
  const maleId = text(formData, "male_id");
  const femaleId = text(formData, "female_id");
  if (!maleId && !femaleId) redirect("/breeding?error=Pick+at+least+one+of+your+animals");

  const ids = [maleId, femaleId].filter((v): v is string => !!v);
  const { data: parents } = await supabase.from("animals").select("id, species_id").in("id", ids);
  if (ids.length === 2 && new Set(parents?.map((p) => p.species_id)).size > 1) {
    redirect("/breeding?error=Male+and+female+must+be+the+same+species");
  }

  const pairedOn = text(formData, "pairing_date");
  const { data, error } = await supabase
    .from("breeding_pairings")
    .insert({
      male_id: maleId,
      female_id: femaleId,
      pairing_date: pairedOn ? new Date(`${pairedOn}T12:00:00`).toISOString() : undefined,
      notes: text(formData, "notes"),
    })
    .select("id")
    .single();
  if (error) redirect(`/breeding?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/breeding");
  redirect(`/breeding/${data.id}`);
}

export async function updatePairingNotes(formData: FormData) {
  const supabase = await createClient();
  const pairingId = String(formData.get("pairing_id"));
  const { error } = await supabase.from("breeding_pairings").update({ notes: text(formData, "notes") }).eq("id", pairingId);
  back(pairingId, error ? `error=${encodeURIComponent(error.message)}` : "saved=Notes+saved");
}

async function removeClutches(supabase: Awaited<ReturnType<typeof createClient>>, clutchIds: string[]) {
  if (!clutchIds.length) return null;
  const { data: eggs } = await supabase.from("eggs").select("id").in("clutch_id", clutchIds);
  const eggIds = eggs?.map((e) => e.id) ?? [];
  // Hatched animals stay; only the breeding records go.
  if (eggIds.length) {
    const { error } = await supabase.from("hatchlings").delete().in("egg_id", eggIds);
    if (error) return error;
    const { error: eggError } = await supabase.from("eggs").delete().in("id", eggIds);
    if (eggError) return eggError;
  }
  const { error } = await supabase.from("clutches").delete().in("id", clutchIds);
  return error;
}

export async function deletePairing(formData: FormData) {
  const supabase = await createClient();
  const pairingId = String(formData.get("pairing_id"));
  const { data: clutches } = await supabase.from("clutches").select("id").eq("pairing_id", pairingId);
  const clutchError = await removeClutches(supabase, clutches?.map((c) => c.id) ?? []);
  if (clutchError) back(pairingId, `error=${encodeURIComponent(clutchError.message)}`);
  const { error } = await supabase.from("breeding_pairings").delete().eq("id", pairingId);
  if (error) back(pairingId, `error=${encodeURIComponent(error.message)}`);
  revalidatePath("/breeding");
  redirect("/breeding?deleted=1");
}

export async function addClutch(formData: FormData) {
  const supabase = await createClient();
  const pairingId = String(formData.get("pairing_id"));
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("unit_system, country").eq("id", user!.id).single();
  const u = unitSystemFor(profile);

  const eggCount = num(formData, "egg_count");
  const fertile = num(formData, "fertile_count");
  if (eggCount !== null && (eggCount < 0 || eggCount > 200)) back(pairingId, "error=Egg+count+must+be+0-200");
  if (fertile !== null && eggCount !== null && fertile > eggCount) back(pairingId, "error=Fertile+eggs+can%27t+exceed+total+eggs");

  const laid = text(formData, "laid_date");
  const temp = num(formData, "incubation_temp");
  const { data: clutch, error } = await supabase
    .from("clutches")
    .insert({
      pairing_id: pairingId,
      laid_date: laid ? new Date(`${laid}T12:00:00`).toISOString() : null,
      egg_count: eggCount,
      fertile_count: fertile,
      expected_hatch_date: text(formData, "expected_hatch_date"),
      incubation_temp_c: temp === null ? null : Math.round(toC(temp, u) * 10) / 10,
      notes: text(formData, "notes"),
    })
    .select("id")
    .single();
  if (error) back(pairingId, `error=${encodeURIComponent(error.message)}`);

  // One row per egg so each can be tracked to hatching.
  if (eggCount) {
    const good = fertile ?? eggCount;
    const { error: eggError } = await supabase.from("eggs").insert(
      Array.from({ length: eggCount }, (_, i) => ({
        clutch_id: clutch.id,
        egg_number: i + 1,
        laid_date: laid ? new Date(`${laid}T12:00:00`).toISOString() : null,
        incubation_start: laid ? new Date(`${laid}T12:00:00`).toISOString() : null,
        status: i < good ? "incubating" : "infertile",
      })),
    );
    if (eggError) back(pairingId, `error=${encodeURIComponent(eggError.message)}`);
  }
  back(pairingId, "saved=Clutch+added");
}

export async function deleteClutch(formData: FormData) {
  const supabase = await createClient();
  const pairingId = String(formData.get("pairing_id"));
  const error = await removeClutches(supabase, [String(formData.get("clutch_id"))]);
  back(pairingId, error ? `error=${encodeURIComponent(error.message)}` : "saved=Clutch+deleted");
}

export async function setEggStatus(formData: FormData) {
  const supabase = await createClient();
  const pairingId = String(formData.get("pairing_id"));
  const { error } = await supabase
    .from("eggs")
    .update({ status: String(formData.get("status")) })
    .eq("id", String(formData.get("egg_id")))
    .neq("status", "hatched");
  back(pairingId, error ? `error=${encodeURIComponent(error.message)}` : "saved=Egg+updated");
}

export async function hatchEgg(formData: FormData) {
  const supabase = await createClient();
  const pairingId = String(formData.get("pairing_id"));
  const weight = num(formData, "hatch_weight_g");
  const { error } = await supabase.rpc("fn42_hatch_egg", {
    p_egg_id: String(formData.get("egg_id")),
    p_name: text(formData, "name") ?? "",
    p_sex: text(formData, "sex") ?? "unknown",
    p_hatch_date: text(formData, "hatch_date") ?? new Date().toISOString().slice(0, 10),
    p_weight_g: weight ?? undefined,
  });
  revalidatePath("/animals");
  back(pairingId, error ? `error=${encodeURIComponent(error.message)}` : "saved=Hatched!+Added+to+My+animals");
}
