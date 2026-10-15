import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { INDEXNOW_KEY } from "@/lib/indexnow";
import { SITE_URL } from "@/lib/site";
import { speciesSlug } from "@/lib/slug";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

// Daily (Vercel cron): tells IndexNow search engines (Bing, Yandex, Seznam…)
// which pages changed, mainly species pages that gained new research.
// Only ever submits our own public URLs, so an extra call is harmless.
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  const since = new Date(Date.now() - 2 * 86400000).toISOString();
  const { data } = await supabase
    .from("research_document_species")
    .select("species(common_name, scientific_name), research_documents!inner(created_at)")
    .gte("research_documents.created_at", since)
    .limit(5000);

  const slugs = new Set<string>();
  for (const row of data ?? []) if (row.species) slugs.add(speciesSlug(row.species));

  const urlList = [
    `${SITE_URL}/research`,
    ...[...slugs].flatMap((s) => [`${SITE_URL}/species/${s}`, `${SITE_URL}/species/${s}/research`]),
  ].slice(0, 10000);

  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: new URL(SITE_URL).host,
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList,
    }),
  });
  return Response.json({ submitted: urlList.length, status: res.status });
}
