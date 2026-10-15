import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/lib/supabase/config";
import type { Database } from "@/lib/database.types";
import { SITE_URL } from "@/lib/site";
import { speciesSlug } from "@/lib/slug";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Anonymous client: only public data ends up in the sitemap.
  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  const [{ data: species }, { data: counts }, { data: animals }] = await Promise.all([
    supabase.from("species").select("id, common_name, scientific_name").eq("active", true),
    supabase.rpc("fn48_species_content_counts"),
    supabase.from("animals").select("id, created_at").eq("visibility", "public").limit(5000),
  ]);

  const pages = ["", "/features", "/species", "/genetics", "/about", "/contact", "/terms", "/privacy", "/login"].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.6,
  }));

  return [
    ...pages,
    // Only species pages with genes or research; the rest are noindex until they have content.
    ...(species ?? [])
      .filter((s) => (counts ?? []).some((c) => c.species_id === s.id && (c.gene_count > 0 || c.paper_count > 0)))
      .map((s) => ({ url: `${SITE_URL}/species/${speciesSlug(s)}`, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...(animals ?? []).map((a) => ({ url: `${SITE_URL}/a/${a.id}`, lastModified: a.created_at ?? undefined, priority: 0.3 })),
  ];
}
