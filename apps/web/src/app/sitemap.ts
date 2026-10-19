import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/lib/supabase/config";
import type { Database } from "@/lib/database.types";
import { SITE_URL } from "@/lib/site";
import { geneSlug } from "@/lib/morphs";
import { speciesSlug } from "@/lib/slug";
import { TOOLS } from "@/lib/tools";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Anonymous client: only public data ends up in the sitemap.
  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  const [{ data: species }, { data: counts }, { data: animals }, { data: genes }, { data: care }] = await Promise.all([
    supabase.from("species").select("id, common_name, scientific_name").eq("active", true),
    supabase.rpc("fn48_species_content_counts"),
    supabase.from("animals").select("id, created_at").eq("visibility", "public").limit(5000),
    supabase.from("genes").select("name, species(common_name, scientific_name)").eq("active", true),
    supabase.from("species_care").select("species_id"),
  ]);
  const withCare = new Set((care ?? []).map((c) => c.species_id));

  const pages = ["", "/features", "/species", "/genetics", "/research", "/tools", "/compare/reptile-husbandry-apps", "/glossary", "/about", "/contact", "/terms", "/privacy", "/login"].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.6,
  }));

  return [
    ...pages,
    // Only species pages with genes or research; the rest are noindex until they have content.
    ...(species ?? [])
      .filter((s) => withCare.has(s.id) || (counts ?? []).some((c) => c.species_id === s.id && (c.gene_count > 0 || c.paper_count > 0)))
      .map((s) => ({ url: `${SITE_URL}/species/${speciesSlug(s)}`, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...(species ?? [])
      .filter((s) => (counts ?? []).some((c) => c.species_id === s.id && c.paper_count > 0))
      .map((s) => ({ url: `${SITE_URL}/species/${speciesSlug(s)}/research`, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...(genes ?? [])
      .filter((g) => g.species)
      .map((g) => ({
        url: `${SITE_URL}/species/${speciesSlug(g.species!)}/morphs/${geneSlug(g.name)}`,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    ...TOOLS.map((t) => ({ url: `${SITE_URL}${t.href}`, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...(animals ?? []).map((a) => ({ url: `${SITE_URL}/a/${a.id}`, lastModified: a.created_at ?? undefined, priority: 0.3 })),
  ];
}
