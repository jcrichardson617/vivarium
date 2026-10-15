import type { Metadata } from "next";
import { EmbedResizer } from "@/components/embed-resizer";
import { GeneticsCalculator } from "@/components/genetics-calculator";
import { loadCalculatorSpecies } from "@/lib/genetics-data";
import { SITE_URL } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

// Embedded on breeders' sites; the canonical calculator lives at /genetics.
export const metadata: Metadata = {
  title: "Morph genetics calculator | Reptilytics",
  robots: { index: false, follow: true },
  alternates: { canonical: "/genetics" },
};

export default async function EmbedGeneticsPage({ searchParams }: { searchParams: Promise<{ species?: string }> }) {
  const { species: wanted } = await searchParams;
  const supabase = await createClient();
  const species = await loadCalculatorSpecies(supabase);
  const initial = species.find((s) => s.slug === wanted) ?? species.find((s) => s.slug === "ball-python") ?? species[0];

  return (
    <div className="bg-background p-3">
      <EmbedResizer />
      {initial ? (
        <GeneticsCalculator species={species} animals={[]} initialSpeciesId={initial.id} />
      ) : (
        <p className="text-muted">Calculator unavailable.</p>
      )}
      <p className="mt-3 text-center text-xs text-muted">
        <a href={`${SITE_URL}/genetics`} target="_blank" rel="noopener" className="text-brand hover:underline">
          Genetics calculator by Reptilytics
        </a>
      </p>
    </div>
  );
}
