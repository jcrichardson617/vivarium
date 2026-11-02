import type { Metadata } from "next";
import Link from "next/link";
import { SignupCta } from "@/components/signup-cta";
import { Pager, PaperList } from "@/components/paper-list";
import { newestPapers } from "@/lib/research";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 3600;

type Props = { searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const page = Math.max(1, Number((await searchParams).page) || 1);
  return {
    title: `Latest Reptile & Amphibian Research${page > 1 ? ` (page ${page})` : ""} | Reptilytics`,
    description:
      "Newly published scientific papers on reptiles and amphibians: husbandry, veterinary care, disease, genetics and breeding, collected by the HerpAtlas research library.",
    alternates: { canonical: page > 1 ? `/research?page=${page}` : "/research" },
  };
}

export default async function ResearchPage({ searchParams }: Props) {
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const supabase = await createClient();
  const { papers, hasMore } = await newestPapers(supabase, page);

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Latest research</h1>
        <p className="text-muted">
          Newly published papers on reptiles and amphibians from the HerpAtlas research library, updated automatically.
          Browse by animal on the <Link href="/species" className="text-brand hover:underline">species pages</Link>.
        </p>
      </div>
      <PaperList papers={papers} />
      {!papers.length && <p className="text-muted">No papers yet.</p>}
      <Pager base="/research" page={page} hasMore={hasMore} />
      {/* Shown to everyone: reading the session would stop this page being cached. */}
      <SignupCta
        title="Put the research to work"
        body="Log weights, feedings and sheds for your own animals, chart their growth, and see how they compare with other keepers' animals of the same species."
      />
    </section>
  );
}
