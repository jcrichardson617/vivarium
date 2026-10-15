import type { CalcSpecies } from "@/components/genetics-calculator";
import { speciesSlug } from "@/lib/slug";
import type { createClient } from "@/lib/supabase/server";

// Species that have morph genes, with their genes, for the calculator.
export async function loadCalculatorSpecies(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: genes } = await supabase
    .from("genes")
    .select("id, name, inheritance, allelic_group, super_name, health_note, super_health_note, super_lethal, species_id, species(common_name, scientific_name)")
    .eq("active", true)
    .order("name");

  const speciesMap = new Map<string, CalcSpecies & { slug: string }>();
  for (const g of genes ?? []) {
    const s = g.species;
    if (!speciesMap.has(g.species_id))
      speciesMap.set(g.species_id, {
        id: g.species_id,
        name: s?.common_name ?? s?.scientific_name ?? "Unknown",
        slug: s ? speciesSlug(s) : g.species_id,
        genes: [],
      });
    speciesMap.get(g.species_id)!.genes.push(g);
  }
  return [...speciesMap.values()].sort((a, b) => a.name.localeCompare(b.name));
}
