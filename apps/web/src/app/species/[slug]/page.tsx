import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { speciesSlug } from "@/lib/slug";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

const INHERITANCE: Record<string, string> = {
  recessive: "Recessive",
  incomplete_dominant: "Co-dominant",
  dominant: "Dominant",
  polygenic: "Line-bred",
};

async function findSpecies(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("species")
    .select("id, common_name, scientific_name, genus, family, taxon_class, species_synonyms(synonym_name)")
    .eq("active", true);
  return { supabase, species: data?.find((s) => speciesSlug(s) === slug) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { species } = await findSpecies(slug);
  if (!species) return { title: "Species not found | Reptilytics" };
  const name = species.common_name ?? species.scientific_name;
  return {
    title: `${name} (${species.scientific_name}) | Reptilytics`,
    description: `${name} (${species.scientific_name}): family ${species.family ?? "—"}. Track your ${name.toLowerCase()}'s feedings, weights, sheds, genetics and breeding with Reptilytics.`,
    alternates: { canonical: `/species/${slug}` },
  };
}

export default async function SpeciesPage({ params }: Props) {
  const { slug } = await params;
  const { supabase, species } = await findSpecies(slug);
  if (!species) notFound();
  const name = species.common_name ?? species.scientific_name;

  const { data: genes } = await supabase
    .from("genes")
    .select("name, inheritance, super_name, aliases")
    .eq("species_id", species.id)
    .eq("active", true)
    .order("name");

  const byType = new Map<string, NonNullable<typeof genes>>();
  for (const g of genes ?? []) byType.set(g.inheritance, [...(byType.get(g.inheritance) ?? []), g]);
  const aliases = species.species_synonyms?.map((s) => s.synonym_name) ?? [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Taxon",
    name: species.scientific_name,
    alternateName: [species.common_name, ...aliases].filter(Boolean),
    taxonRank: "species",
    parentTaxon: species.genus ? { "@type": "Taxon", name: species.genus, taxonRank: "genus" } : undefined,
  };

  return (
    <article className="flex flex-col gap-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header>
        <Link href="/species" className="text-sm text-muted hover:text-foreground">← All species</Link>
        <h1 className="mt-2 text-3xl font-bold">{name}</h1>
        <p className="text-lg italic text-muted">{species.scientific_name}</p>
      </header>

      <dl className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-card p-4 text-sm sm:grid-cols-4">
        <div><dt className="text-xs uppercase tracking-wide text-muted">Class</dt><dd className="font-medium">{species.taxon_class === "Amphibia" ? "Amphibian" : "Reptile"}</dd></div>
        <div><dt className="text-xs uppercase tracking-wide text-muted">Family</dt><dd className="font-medium">{species.family ?? "—"}</dd></div>
        <div><dt className="text-xs uppercase tracking-wide text-muted">Genus</dt><dd className="font-medium italic">{species.genus ?? "—"}</dd></div>
        <div><dt className="text-xs uppercase tracking-wide text-muted">Also known as</dt><dd className="font-medium">{aliases.length ? aliases.join(", ") : "—"}</dd></div>
      </dl>

      {!!genes?.length && (
        <section>
          <h2 className="mb-1 text-2xl font-semibold">{name} morphs and genes</h2>
          <p className="mb-4 text-sm text-muted">
            {genes.length} genes in our list. Log your animal&apos;s genetics and Reptilytics builds its morph name for you.
          </p>
          {["recessive", "incomplete_dominant", "dominant", "polygenic"].map((type) =>
            byType.get(type)?.length ? (
              <div key={type} className="mb-5">
                <h3 className="mb-2 font-semibold">{INHERITANCE[type]}</h3>
                <ul className="flex flex-wrap gap-2">
                  {byType.get(type)!.map((g) => (
                    <li key={g.name} className="rounded-full border border-border bg-card px-3 py-1 text-sm">
                      {g.name}
                      {g.super_name && <span className="text-muted"> · super: {g.super_name}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null,
          )}
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card p-6 text-center">
        <h2 className="mb-2 text-xl font-semibold">Keep a {name.toLowerCase()}?</h2>
        <p className="mx-auto mb-4 max-w-md text-muted">
          Log feedings, weights and sheds in seconds, track genetics and lineage, and see how your animal compares with
          other keepers.
        </p>
        <Link href="/login" className="btn-primary inline-block px-6 py-3">Start tracking free</Link>
      </section>
    </article>
  );
}
