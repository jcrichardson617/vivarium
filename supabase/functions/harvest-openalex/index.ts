// Pulls papers from OpenAlex into the research library, one species per run.
// Asks only for works without a PubMed id: those are the herpetology journals
// Europe PMC misses (harvest-research covers the rest). Abstracts only; no full
// text. Called by pg_cron every 20 minutes with the shared cron secret.
// Set the OPENALEX_API_KEY secret for OpenAlex's larger per-key daily budget.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { chunk, plain } from "./text.ts";

const WORKS = "https://api.openalex.org/works";
const PAGE_SIZE = 100;
const MAX_PAGES = 3;
const DB_CAP_MB = 420;
const TYPES = "article|review|book-chapter|dissertation|letter";
const SELECT =
  "id,doi,title,type,publication_date,cited_by_count,authorships,primary_location,open_access,abstract_inverted_index";

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

type Work = Record<string, any>;
type Species = { id: string; scientific_name: string; common_name: string | null; synonyms: string[] };

Deno.serve(async (req) => {
  const { data: ok } = await admin.rpc("fn45_check_cron_secret", { p_secret: req.headers.get("x-cron-secret") ?? "" });
  if (!ok) return new Response("Unauthorized", { status: 401 });

  const { data: sizeMb } = await admin.rpc("fn63_database_size_mb");
  if ((sizeMb ?? 0) >= DB_CAP_MB) return Response.json({ capped: true, size_mb: sizeMb });

  const { data } = await admin.rpc("fn74_next_openalex_species").maybeSingle();
  const species = data as Species | null;
  if (!species) return Response.json({ done: true, message: "Everything harvested recently" });

  const record = async (fields: Record<string, unknown>) => {
    const { error } = await admin
      .from("research_harvest_openalex")
      .upsert({ species_id: species.id, last_harvested_at: new Date().toISOString(), ...fields });
    if (error) console.error(error.message);
  };

  const names = [...new Set([species.scientific_name, species.common_name, ...species.synonyms].filter(Boolean))]
    .map((n) => `"${String(n).replace(/["|,]/g, "")}"`)
    .join("|");
  const filter = `title_and_abstract.search:${names},has_pmid:false,has_abstract:true,language:en,type:${TYPES}`;
  const key = Deno.env.get("OPENALEX_API_KEY");

  try {
    let cursor = "*";
    let hitCount = 0;
    let added = 0;
    for (let page = 0; page < MAX_PAGES; page++) {
      const params = new URLSearchParams({ filter, select: SELECT, per_page: String(PAGE_SIZE), cursor, sort: "cited_by_count:desc" });
      if (key) params.set("api_key", key);
      const res = await fetch(`${WORKS}?${params}`, { headers: { "User-Agent": "HerpAtlas/1.0 (reptilytics.com; info@reptilytics.com)" } });
      // Out of budget (401 without a key on a shared IP, 429 with one): leave this
      // species for the next run instead of marking it done.
      if (res.status === 401 || res.status === 429) {
        return Response.json({ species: species.scientific_name, rateLimited: res.status, hasKey: !!key, added });
      }
      if (!res.ok) throw new Error(`OpenAlex ${res.status}`);
      const body = await res.json();
      hitCount = body.meta?.count ?? 0;
      const results: Work[] = body.results ?? [];
      added += await save(results, species.id);
      if (!body.meta?.next_cursor || results.length < PAGE_SIZE) break;
      cursor = body.meta.next_cursor;
    }
    await record({ last_status: "ok", last_error: null, hit_count: hitCount, docs_added: added });
    return Response.json({ species: species.scientific_name, hitCount, added });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await record({ last_status: "error", last_error: message });
    return Response.json({ species: species.scientific_name, error: message }, { status: 500 });
  }
});

// OpenAlex ships abstracts as {word: [positions]}.
function abstractText(index: Record<string, number[]> | null) {
  if (!index) return "";
  const words: string[] = [];
  for (const [word, positions] of Object.entries(index)) for (const p of positions) words[p] = word;
  return words.filter(Boolean).join(" ");
}

const bareDoi = (doi: string | null) => (doi ? doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "") : null);

async function save(results: Work[], speciesId: string) {
  const rows = results
    .map((w) => ({ w, abstract: plain(abstractText(w.abstract_inverted_index)), doi: bareDoi(w.doi) }))
    .filter(({ w, abstract }) => w.title && abstract.length > 100)
    .map(({ w, abstract, doi }) => {
      const loc = w.primary_location ?? {};
      return {
        external_source: "openalex",
        external_id: String(w.id).replace("https://openalex.org/", ""),
        title: plain(w.title).slice(0, 1000),
        source_url: doi ? `https://doi.org/${doi}` : loc.landing_page_url ?? String(w.id),
        source_type: "journal_article",
        content_rights: "abstract",
        content: abstract,
        evidence_level: w.type === "dissertation" ? "grey_literature" : "peer_reviewed",
        open_access: !!w.open_access?.is_oa,
        license: loc.license ? String(loc.license).replace(/-/g, " ") : null,
        authors: (w.authorships ?? []).map((a: Work) => a.author?.display_name).filter(Boolean).slice(0, 50),
        publisher: plain(loc.source?.display_name ?? "") || null,
        doi,
        published_date: /^\d{4}-\d{2}-\d{2}$/.test(w.publication_date ?? "") ? w.publication_date : null,
        cited_by_count: w.cited_by_count ?? null,
        retrieved_at: new Date().toISOString(),
        ingest_status: "processing",
      };
    });
  if (!rows.length) return 0;

  // Papers Europe PMC already brought in (same DOI) just get this species tag.
  const dois = rows.map((r) => r.doi).filter((d): d is string => !!d);
  const { data: existing, error: existingError } = dois.length
    ? await admin.from("research_documents").select("id, doi").in("doi", [...new Set([...dois, ...dois.map((d) => d.toLowerCase())])])
    : { data: [], error: null };
  if (existingError) throw new Error(existingError.message);
  const known = new Set((existing ?? []).map((d) => String(d.doi).toLowerCase()));
  const fresh = rows.filter((r) => !r.doi || !known.has(r.doi.toLowerCase()));

  let inserted: { id: string; title: string; content: string | null }[] = [];
  const { data, error } = await admin
    .from("research_documents")
    .upsert(fresh, { onConflict: "external_source,external_id", ignoreDuplicates: true })
    .select("id, title, content");
  if (!error) inserted = data ?? [];
  else if (error.code === "23505") {
    // A DOI or URL clash with a paper from another source: insert one by one, skipping clashes.
    for (const row of fresh) {
      const { data: one } = await admin
        .from("research_documents")
        .upsert(row, { onConflict: "external_source,external_id", ignoreDuplicates: true })
        .select("id, title, content");
      inserted.push(...(one ?? []));
    }
  } else throw new Error(error.message);

  const { data: ours, error: oursError } = await admin
    .from("research_documents")
    .select("id")
    .eq("external_source", "openalex")
    .in("external_id", rows.map((r) => r.external_id));
  if (oursError) throw new Error(oursError.message);
  const tagIds = [...(ours ?? []).map((d) => d.id), ...(existing ?? []).map((d) => d.id)];
  if (tagIds.length) {
    await admin
      .from("research_document_species")
      .upsert(tagIds.map((id) => ({ document_id: id, species_id: speciesId })), { ignoreDuplicates: true });
  }

  const chunks = inserted.flatMap((d) =>
    chunk(d.title, [{ heading: "Abstract", paragraphs: [d.content ?? ""] }]).map((content, i) => ({
      document_id: d.id,
      chunk_index: i,
      content,
    })),
  );
  for (let i = 0; i < chunks.length; i += 500) {
    const { error: chunkError } = await admin.from("research_chunks").insert(chunks.slice(i, i + 500));
    if (chunkError) throw new Error(chunkError.message);
  }
  return inserted.length;
}
