import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/lib/supabase/config";
import { SITE_URL } from "@/lib/site";
import { speciesSlug } from "@/lib/slug";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Anonymous client: only public data ends up in the sitemap.
  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  const [{ data: species }, { data: animals }] = await Promise.all([
    supabase.from("species").select("common_name, scientific_name").eq("active", true),
    supabase.from("animals").select("id, created_at").eq("visibility", "public").limit(5000),
  ]);

  const pages = ["", "/features", "/species", "/about", "/contact", "/terms", "/privacy", "/login"].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.6,
  }));

  return [
    ...pages,
    ...(species ?? []).map((s) => ({ url: `${SITE_URL}/species/${speciesSlug(s)}`, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...(animals ?? []).map((a) => ({ url: `${SITE_URL}/a/${a.id}`, lastModified: a.created_at ?? undefined, priority: 0.3 })),
  ];
}
