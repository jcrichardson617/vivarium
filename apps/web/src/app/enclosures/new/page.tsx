import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { lengthUnit, tempUnit, unitSystemFor } from "@/lib/units";
import { createEnclosure } from "../actions";

export const metadata: Metadata = { title: "Add enclosure | Reptilytics" };

const TYPES = ["Tank / terrarium", "PVC enclosure", "Front-opening glass", "Rack tub", "Bioactive vivarium", "Screen enclosure", "Tortoise table", "Outdoor pen", "Aquarium / paludarium", "Other"];

export default async function NewEnclosurePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("unit_system, country").eq("id", user!.id).single();
  const u = unitSystemFor(profile);
  const L = lengthUnit(u);
  const T = tempUnit(u);

  return (
    <section className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold">Add enclosure</h1>
      {error && <p className="mb-4 rounded-md bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}
      <form action={createEnclosure} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Name / ID
          <input name="name" required maxLength={80} placeholder="e.g. Rack A, tub 3" className="field" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Type
          <select name="enclosure_type" className="field">
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <fieldset className="grid grid-cols-3 gap-2">
          <legend className="mb-1 text-sm">Size ({L}, optional)</legend>
          <input name="length" type="number" step="0.1" min={0.1} placeholder="Length" className="field" />
          <input name="width" type="number" step="0.1" min={0.1} placeholder="Width" className="field" />
          <input name="height" type="number" step="0.1" min={0.1} placeholder="Height" className="field" />
        </fieldset>
        <label className="flex flex-col gap-1 text-sm">
          Substrate
          <input name="substrate" placeholder="e.g. Cypress mulch" className="field" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Heat source
            <input name="heat_source" placeholder="e.g. Heat tape" className="field" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            UVB
            <input name="uvb_type" placeholder="e.g. T5 HO 6%" className="field" />
          </label>
        </div>
        <fieldset className="grid grid-cols-3 gap-2">
          <legend className="mb-1 text-sm">Targets (optional)</legend>
          <input name="target_hot" type="number" step="0.1" placeholder={`Hot ${T}`} className="field" />
          <input name="target_cool" type="number" step="0.1" placeholder={`Cool ${T}`} className="field" />
          <input name="target_humidity" type="number" min={0} max={100} placeholder="RH %" className="field" />
        </fieldset>
        <textarea name="notes" rows={2} placeholder="Notes (optional)" className="field" />
        <button className="btn-primary mt-2">Save enclosure</button>
      </form>
    </section>
  );
}
