import type { Paper } from "@/components/paper-list";
import { speciesSlug } from "@/lib/slug";
import type { createClient } from "@/lib/supabase/server";

export const PAGE_SIZE = 25;

// Newest papers first, optionally for one species. Fetches one extra row to know if there's a next page.
export async function newestPapers(supabase: Awaited<ReturnType<typeof createClient>>, page: number, speciesId?: string) {
  const { data } = await supabase.rpc("fn50_newest_papers", {
    p_species_id: speciesId,
    p_limit: PAGE_SIZE + 1,
    p_offset: (page - 1) * PAGE_SIZE,
  });
  const rows = data ?? [];
  const papers: Paper[] = rows.slice(0, PAGE_SIZE).map((r) => ({
    id: r.id,
    title: r.title,
    source_url: r.source_url,
    publisher: r.publisher,
    published_date: r.published_date,
    authors: r.authors ?? [],
    license: r.license,
    excerpt: r.excerpt,
    species: ((r.species ?? []) as { common_name: string | null; scientific_name: string }[]).map((s) => ({
      name: s.common_name ?? s.scientific_name,
      slug: speciesSlug(s),
    })),
  }));
  return { papers, hasMore: rows.length > PAGE_SIZE };
}
