import type { Metadata } from "next";
import Link from "next/link";
import { SignupCta } from "@/components/signup-cta";
import { GeneticsCalculator, type CalcAnimal } from "@/components/genetics-calculator";
import type { GeneStatus } from "@/lib/genetics";
import { loadCalculatorSpecies } from "@/lib/genetics-data";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Morph Genetics Calculator: Ball Python, Leopard Gecko, Corn Snake & More | Reptilytics",
  description:
    "Free reptile morph genetics calculator for ball pythons, leopard geckos, corn snakes, boas, hognoses and more: pick two parents and see every possible offspring morph with its odds, including supers, allelic combos and possible hets.",
  alternates: { canonical: "/genetics" },
};

export default async function GeneticsPage({
  searchParams,
}: {
  searchParams: Promise<{ species?: string; male?: string; female?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const species = await loadCalculatorSpecies(supabase);

  let animals: CalcAnimal[] = [];
  if (user && species.length) {
    const { data } = await supabase
      .from("animals")
      .select("id, name, sex, species_id, animal_genes(gene_id, status, het_probability), animal_ownership!inner(user_id)")
      .eq("animal_ownership.user_id", user.id)
      .eq("animal_ownership.is_current_owner", true)
      .eq("status", "active")
      .in("species_id", species.map((s) => s.id))
      .order("name");
    animals = (data ?? []).map((a) => ({
      id: a.id,
      name: a.name ?? "Unnamed",
      sex: a.sex,
      speciesId: a.species_id!,
      genes: a.animal_genes.map((g) => ({
        geneId: g.gene_id,
        status: g.status as GeneStatus,
        hetProbability: g.het_probability === null ? null : Number(g.het_probability),
      })),
    }));
  }

  const fromAnimal = animals.find((a) => a.id === params.male || a.id === params.female);
  const initial =
    fromAnimal?.speciesId ?? species.find((s) => s.slug === params.species || s.id === params.species)?.id ?? species[0]?.id;

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Genetics calculator</h1>
        <p className="text-muted">
          Pick the genes each parent carries and see every possible baby with its odds, including supers, allelic combos
          (like BEL) and possible hets.
          {!user && (
            <>
              {" "}
              <Link href="/signup" className="text-brand hover:underline">Create a free account</Link> to run pairings on
              your own animals and keep their genetics on file.
            </>
          )}
        </p>
      </div>
      {species.length ? (
        <GeneticsCalculator
          species={species}
          animals={animals}
          initialSpeciesId={initial}
          initialA={params.male}
          initialB={params.female}
        />
      ) : (
        <p className="text-muted">No species have genes yet.</p>
      )}
      {!user && (
        <SignupCta
          title="Planning a pairing?"
          body="Save your animals with their genes, run them through the calculator in one click, and track clutches and hatch rates when the eggs come."
        />
      )}
    </section>
  );
}
