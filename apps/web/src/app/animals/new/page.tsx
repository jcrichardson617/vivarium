import { SpeciesPicker } from "@/components/species-picker";
import { createAnimal } from "./actions";

export default async function NewAnimalPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <section className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold">Add animal</h1>
      {error && <p className="mb-4 rounded-md bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}
      <form action={createAnimal} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Name / ID
          <input name="name" required maxLength={80} placeholder="e.g. Monty or BP-24-07" className="field" />
        </label>
        <SpeciesPicker />
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
        <label className="flex flex-col gap-1 text-sm">
          Acquisition date (optional)
          <input name="acquired_date" type="date" className="field" />
        </label>
        <button className="btn-primary mt-2">Save animal</button>
      </form>
    </section>
  );
}
