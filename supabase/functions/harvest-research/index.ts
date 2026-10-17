// Pulls papers from Europe PMC into the research library, alternating between
// the next species (papers tagged with it) and the next topic sweep (general
// literature, left untagged). Called by pg_cron every 10 minutes; authenticated
// with the shared cron secret.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { chunk, plain } from "./text.ts";

const SEARCH = "https://www.ebi.ac.uk/europepmc/webservices/rest/search";
const PAGE_SIZE = 100;
const MAX_PAGES = 5;
// Stop adding papers well before the free plan's 500 MB database limit.
const DB_CAP_MB = 420;
// Licenses that allow storing full text in a commercial product. Full text is
// only queued for papers found by topic sweeps (husbandry, veterinary, disease…),
// which keeps storage within the free plan; fetch-fulltext also enforces a cap.
const REUSABLE = /^cc(0| by| by-sa)$/;

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

type Result = Record<string, any>;

type Target = { kind: "species" | "topic"; id: string; name: string; query: string };

Deno.serve(async (req) => {
  const { data: ok } = await admin.rpc("fn45_check_cron_secret", { p_secret: req.headers.get("x-cron-secret") ?? "" });
  if (!ok) return new Response("Unauthorized", { status: 401 });

  const { data: sizeMb } = await admin.rpc("fn63_database_size_mb");
  if ((sizeMb ?? 0) >= DB_CAP_MB) return Response.json({ capped: true, size_mb: sizeMb });

  const target = await nextTarget();
  if (!target) return Response.json({ done: true, message: "Everything harvested recently" });
  const stateTable = target.kind === "species" ? "research_harvest_state" : "research_harvest_topics";
  const key = target.kind === "species" ? { species_id: target.id } : { id: target.id };
  const record = async (fields: Record<string, unknown>) => {
    const row = { ...key, last_harvested_at: new Date().toISOString(), ...fields };
    const { error } =
      target.kind === "species"
        ? await admin.from(stateTable).upsert(row)
        : await admin.from(stateTable).update(row).eq("id", target.id);
    if (error) console.error(error.message);
  };

  try {
    let cursor = "*";
    let hitCount = 0;
    let added = 0;
    for (let page = 0; page < MAX_PAGES; page++) {
      const url = `${SEARCH}?${new URLSearchParams({ query: target.query, format: "json", resultType: "core", pageSize: String(PAGE_SIZE), cursorMark: cursor })}`;
      const res = await fetch(url, { headers: { "User-Agent": "HerpAtlas/1.0 (reptilytics.com; info@reptilytics.com)" } });
      if (!res.ok) throw new Error(`Europe PMC ${res.status}`);
      const body = await res.json();
      hitCount = body.hitCount ?? 0;
      const results: Result[] = body.resultList?.result ?? [];
      added += await save(results, target.kind === "species" ? target.id : null, target.kind === "topic");
      if (!body.nextCursorMark || body.nextCursorMark === cursor || results.length < PAGE_SIZE) break;
      cursor = body.nextCursorMark;
    }
    await record({ last_status: "ok", last_error: null, hit_count: hitCount, docs_added: added });
    return Response.json({ [target.kind]: target.name, hitCount, added });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await record({ last_status: "error", last_error: message });
    return Response.json({ [target.kind]: target.name, error: message }, { status: 500 });
  }
});

// Alternate between species runs and topic sweeps (topics catch literature that
// is not about one named species). Either list may be exhausted for the month.
async function nextTarget(): Promise<Target | null> {
  const [{ data: species }, { data: topic }] = await Promise.all([
    admin.rpc("fn46_next_harvest_species").maybeSingle(),
    admin.rpc("fn47_next_harvest_topic").maybeSingle(),
  ]);
  const s = species as { id: string; scientific_name: string; common_name: string | null; synonyms: string[] } | null;
  const t = topic as { id: string; label: string; query: string } | null;
  const speciesTarget: Target | null = s && {
    kind: "species",
    id: s.id,
    name: s.scientific_name,
    query: `TITLE_ABS:(${[...new Set([s.scientific_name, s.common_name, ...s.synonyms].filter(Boolean))]
      .map((term) => `"${String(term).replace(/"/g, "")}"`)
      .join(" OR ")}) AND LANG:"eng"`,
  };
  const topicTarget: Target | null = t && { kind: "topic", id: t.id, name: t.label, query: t.query };
  const topicTurn = Math.floor(Date.now() / 600_000) % 2 === 1;
  return (topicTurn ? topicTarget ?? speciesTarget : speciesTarget ?? topicTarget) ?? null;
}

async function save(results: Result[], speciesId: string | null, queueFullText: boolean) {
  const seen = new Set<string>();
  const rows = results
    .filter((r) => r.title && r.abstractText && !seen.has(`${r.source}:${r.id}`) && seen.add(`${r.source}:${r.id}`))
    .map((r) => {
      const license = (r.license ?? "").toLowerCase().trim() || null;
      const openAccess = r.isOpenAccess === "Y";
      const fullTextEligible = openAccess && r.inEPMC === "Y" && !!r.pmcid && !!license && REUSABLE.test(license);
      const authors: string[] =
        r.authorList?.author?.map((a: Result) => a.fullName ?? a.collectiveName).filter(Boolean) ??
        (r.authorString ? String(r.authorString).replace(/\.$/, "").split(", ") : []);
      return {
        external_source: "europepmc",
        external_id: `${r.source}:${r.id}`,
        title: plain(r.title).slice(0, 1000),
        source_url: r.doi
          ? `https://doi.org/${r.doi}`
          : r.pmcid
            ? `https://europepmc.org/article/PMC/${r.pmcid}`
            : `https://europepmc.org/article/${r.source}/${r.id}`,
        source_type: "journal_article",
        content_rights: "abstract",
        content: plain(r.abstractText),
        evidence_level: r.source === "PPR" ? "grey_literature" : "peer_reviewed",
        open_access: openAccess,
        license,
        authors: authors.slice(0, 50),
        publisher: plain(r.journalInfo?.journal?.title ?? r.bookOrReportDetails?.publisher ?? "") || null,
        doi: r.doi ?? null,
        pmcid: r.pmcid ?? null,
        published_date: /^\d{4}-\d{2}-\d{2}$/.test(r.firstPublicationDate ?? "") ? r.firstPublicationDate : null,
        cited_by_count: r.citedByCount ?? null,
        retrieved_at: new Date().toISOString(),
        fulltext_status: queueFullText && fullTextEligible ? "pending" : null,
        full_text_eligible: fullTextEligible,
        ingest_status: "processing",
      };
    });
  if (!rows.length) return 0;
  const eligibleIds = rows.filter((r) => r.full_text_eligible).map((r) => r.external_id);
  const docs = rows.map(({ full_text_eligible: _, ...doc }) => doc);

  // Insert new papers only; papers already in the library just get this species tag.
  const { data: inserted, error } = await admin
    .from("research_documents")
    .upsert(docs, { onConflict: "external_source,external_id", ignoreDuplicates: true })
    .select("id, title, content");
  if (error) throw new Error(error.message);

  // Papers already in the library (found earlier by a species run) get queued too.
  if (queueFullText && eligibleIds.length) {
    const { error: queueError } = await admin
      .from("research_documents")
      .update({ fulltext_status: "pending" })
      .eq("external_source", "europepmc")
      .in("external_id", eligibleIds)
      .is("fulltext_status", null);
    if (queueError) throw new Error(queueError.message);
  }

  if (speciesId) {
    const { data: all, error: allError } = await admin
      .from("research_documents")
      .select("id")
      .eq("external_source", "europepmc")
      .in("external_id", rows.map((r) => r.external_id));
    if (allError) throw new Error(allError.message);
    await admin
      .from("research_document_species")
      .upsert(all!.map((d) => ({ document_id: d.id, species_id: speciesId })), { ignoreDuplicates: true });
  }

  const chunks = (inserted ?? []).flatMap((d) =>
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
  return inserted?.length ?? 0;
}
