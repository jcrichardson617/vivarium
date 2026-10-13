import { createClient } from "@/lib/supabase/server";
import { createAnimal } from "./actions";

export default async function NewAnimalPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: species } = await supabase
    .from("species")
    .select("id, common_name, scientific_name")
    .eq("active", true)
    .order("common_name");

  return (
    <section className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold">Add animal</h1>
      {error && <p className="mb-4 rounded-md bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}
      <form action={createAnimal} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Name
          <input name="name" required maxLength={80} className="field" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Species
          <select name="species_id" required defaultValue="" className="field">
            <option value="" disabled>
              Choose a species
            </option>
            {species?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.common_name} ({s.scientific_name})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Sex
          <select name="sex" defaultValue="unknown" className="field">
            <option value="unknown">Unknown</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Hatch date (optional)
          <input name="hatch_date" type="date" className="field" />
        </label>
        <button className="btn-primary mt-2">Save animal</button>
      </form>
    </section>
  );
}
