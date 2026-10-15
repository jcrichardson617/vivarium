import type { Metadata } from "next";
import { SpeciesDirectory, type DirectoryEntry } from "@/components/species-directory";
import { createClient } from "@/lib/supabase/server";
import { speciesSlug } from "@/lib/slug";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Reptile & Amphibian Species: Morphs & Research | Reptilytics",
  description:
    "Commonly kept reptiles and amphibians with morph genetics and published research: pythons, boas, geckos, monitors, tortoises, frogs and more.",
  alternates: { canonical: "/species" },
};

export default async function SpeciesIndexPage() {
  const supabase = await createClient();
  const [{ data: species }, { data: counts }] = await Promise.all([
    supabase
      .from("species")
      .select("id, common_name, scientific_name, taxon_class, species_synonyms(synonym_name)")
      .eq("active", true)
      .order("common_name"),
    supabase.rpc("fn48_species_content_counts"),
  ]);
  const countFor = new Map((counts ?? []).map((c) => [c.species_id, c]));

  const entries: DirectoryEntry[] = (species ?? []).map((s) => ({
    slug: speciesSlug(s),
    name: s.common_name ?? s.scientific_name,
    scientific: s.scientific_name,
    group: s.taxon_class === "Amphibia" ? "Amphibians" : "Reptiles",
    aliases: s.species_synonyms.map((x) => x.synonym_name),
    genes: Number(countFor.get(s.id)?.gene_count ?? 0),
    papers: Number(countFor.get(s.id)?.paper_count ?? 0),
  }));

  return (
    <section>
      <h1 className="mb-2 text-3xl font-bold">Species</h1>
      <p className="mb-6 text-muted">
        {entries.length} commonly kept reptiles and amphibians. Don&apos;t see yours? Request it when you add an animal.
      </p>
      <SpeciesDirectory entries={entries} />
    </section>
  );
}
