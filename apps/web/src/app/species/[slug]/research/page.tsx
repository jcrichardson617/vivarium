import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pager, PaperList } from "@/components/paper-list";
import { newestPapers } from "@/lib/research";
import { speciesSlug } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

async function findSpecies(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("species").select("id, common_name, scientific_name").eq("active", true);
  const species = data?.find((s) => speciesSlug(s) === slug);
  return { supabase, species, name: species ? (species.common_name ?? species.scientific_name) : "" };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const { supabase, species, name } = await findSpecies(slug);
  if (!species) return { title: "Species not found | Reptilytics" };
  const { papers } = await newestPapers(supabase, 1, species.id);
  return {
    title: `Latest ${name} Research${page > 1 ? ` (page ${page})` : ""} | Reptilytics`,
    description: `Newly published scientific papers on the ${name.toLowerCase()} (${species.scientific_name}): husbandry, health, genetics, breeding and behaviour.`,
    alternates: { canonical: page > 1 ? `/species/${slug}/research?page=${page}` : `/species/${slug}/research` },
    robots: papers.length ? undefined : { index: false, follow: true },
  };
}

export default async function SpeciesResearchPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const { supabase, species, name } = await findSpecies(slug);
  if (!species) notFound();
  const { papers, hasMore } = await newestPapers(supabase, page, species.id);

  return (
    <section className="flex flex-col gap-6">
      <div>
        <nav className="text-sm text-muted">
          <Link href="/species" className="hover:text-foreground">Species</Link> ›{" "}
          <Link href={`/species/${slug}`} className="hover:text-foreground">{name}</Link>
        </nav>
        <h1 className="mt-2 text-3xl font-bold">Latest {name.toLowerCase()} research</h1>
        <p className="text-muted">
          Newest papers on <i>{species.scientific_name}</i> in the HerpAtlas research library, updated automatically.
        </p>
      </div>
      <PaperList papers={papers} />
      {!papers.length && <p className="text-muted">No papers for this species yet. The library checks for new ones every month.</p>}
      <Pager base={`/species/${slug}/research`} page={page} hasMore={hasMore} />
    </section>
  );
}
