import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { speciesSlug } from "@/lib/slug";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Reptile & Amphibian Species | Reptilytics",
  description:
    "Browse commonly kept reptiles and amphibians: pythons, boas, geckos, monitors, tortoises, frogs and more. Track yours with Reptilytics.",
  alternates: { canonical: "/species" },
};

export default async function SpeciesIndexPage() {
  const supabase = await createClient();
  const { data: species } = await supabase
    .from("species")
    .select("common_name, scientific_name, family, taxon_class")
    .eq("active", true)
    .order("common_name");

  const groups = new Map<string, NonNullable<typeof species>>();
  for (const s of species ?? []) {
    const key = s.taxon_class === "Amphibia" ? "Amphibians" : "Reptiles";
    groups.set(key, [...(groups.get(key) ?? []), s]);
  }

  return (
    <section>
      <h1 className="mb-2 text-3xl font-bold">Species</h1>
      <p className="mb-8 text-muted">
        {species?.length ?? 0} commonly kept reptiles and amphibians. Don&apos;t see yours? Request it when you add an animal.
      </p>
      {["Reptiles", "Amphibians"].map((group) => (
        <div key={group} className="mb-10">
          <h2 className="mb-3 text-xl font-semibold">{group}</h2>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(groups.get(group) ?? []).map((s) => (
              <li key={s.scientific_name}>
                <Link href={`/species/${speciesSlug(s)}`} className="block rounded-md border border-border bg-card px-3 py-2 hover:border-brand">
                  <span className="font-medium">{s.common_name ?? s.scientific_name}</span>
                  <span className="block text-xs italic text-muted">{s.scientific_name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
