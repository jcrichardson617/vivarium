// Fetches the full text of open-access papers whose license allows reuse
// (queued by harvest-research topic sweeps) and adds full-text passages after
// their abstract passages. A few papers per run, up to FULLTEXT_CAP in total.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { chunk, decodeEntities } from "./text.ts";

const PER_RUN = 4;
// Storage budget on the free plan: a full paper is ~65 passages (~300 KB).
const FULLTEXT_CAP = 1000;

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

Deno.serve(async (req) => {
  const { data: ok } = await admin.rpc("fn45_check_cron_secret", { p_secret: req.headers.get("x-cron-secret") ?? "" });
  if (!ok) return new Response("Unauthorized", { status: 401 });

  const { count: stored } = await admin
    .from("research_documents")
    .select("id", { count: "exact", head: true })
    .eq("content_rights", "full_text");
  if ((stored ?? 0) >= FULLTEXT_CAP) return Response.json({ capped: true, stored });

  // Most-cited papers first.
  const { data: docs, error } = await admin
    .from("research_documents")
    .select("id, title, pmcid")
    .eq("fulltext_status", "pending")
    .order("cited_by_count", { ascending: false, nullsFirst: false })
    .order("created_at")
    .limit(Math.min(PER_RUN, FULLTEXT_CAP - (stored ?? 0)));
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const results = [];
  for (const doc of docs ?? []) {
    try {
      const res = await fetch(`https://www.ebi.ac.uk/europepmc/webservices/rest/${doc.pmcid}/fullTextXML`, {
        headers: { "User-Agent": "HerpAtlas/1.0 (reptilytics.com; info@reptilytics.com)" },
      });
      if (res.status === 404) {
        await settle(doc.id, { fulltext_status: "unavailable" });
        results.push({ id: doc.id, status: "unavailable" });
        continue;
      }
      if (!res.ok) throw new Error(`Europe PMC ${res.status}`);
      const sections = parseBody(await res.text());
      const text = sections.map((s) => [s.heading, ...s.paragraphs].filter(Boolean).join("\n\n")).join("\n\n");
      if (text.length < 1500) {
        await settle(doc.id, { fulltext_status: "unavailable" });
        results.push({ id: doc.id, status: "unavailable" });
        continue;
      }

      // Keep the abstract passages (chunk_index from 0) and add body passages after them.
      const { count } = await admin.from("research_chunks").select("id", { count: "exact", head: true }).eq("document_id", doc.id);
      const passages = chunk(doc.title, sections).map((content, i) => ({
        document_id: doc.id,
        chunk_index: (count ?? 0) + i,
        content,
      }));
      for (let i = 0; i < passages.length; i += 200) {
        const { error: insertError } = await admin.from("research_chunks").insert(passages.slice(i, i + 200));
        if (insertError) throw new Error(insertError.message);
      }
      const { error: updateError } = await admin
        .from("research_documents")
        .update({ content: text, content_rights: "full_text", fulltext_status: "done" })
        .eq("id", doc.id);
      if (updateError) throw new Error(updateError.message);
      results.push({ id: doc.id, status: "done", passages: passages.length });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      await settle(doc.id, { fulltext_status: "error", ingest_error: message });
      results.push({ id: doc.id, status: "error", message });
    }
  }
  return Response.json({ processed: results.length, results });
});

// No full text after all: the abstract passages are what we have. If they are
// already embedded the document is ready now; otherwise embed-chunks finishes it.
async function settle(id: string, fields: Record<string, string>) {
  const { count } = await admin.from("research_chunks").select("id", { count: "exact", head: true }).eq("document_id", id).is("embedding", null);
  await admin
    .from("research_documents")
    .update(count === 0 ? { ...fields, ingest_status: "ready" } : fields)
    .eq("id", id);
}

// Body sections of a JATS article as plain-text paragraphs. Figures, tables,
// citation markers and references are dropped.
function parseBody(xml: string) {
  const start = xml.indexOf("<body");
  const end = xml.indexOf("</body>", start);
  if (start < 0 || end < 0) return [];
  let body = xml.slice(start, end);
  body = body
    .replace(/<(table-wrap|fig|supplementary-material|disp-formula|media|graphic)\b[\s\S]*?<\/\1>/g, " ")
    .replace(/<xref\b[^>]*>[\s\S]*?<\/xref>/g, "")
    .replace(/<title\b[^>]*>([\s\S]*?)<\/title>/g, "\u0001$1\u0002")
    .replace(/<\/p>/g, "\u0003")
    .replace(/<[^>]+>/g, " ");
  body = decodeEntities(body)
    .replace(/\[\s*[,–\-\s]*\]/g, "")
    .replace(/\(\s*[,;–\-\s]*\)/g, "")
    .replace(/[ \t\r\n]+/g, " ")
    .replace(/ ([.,;:])/g, "$1");

  const sections: { heading?: string; paragraphs: string[] }[] = [];
  let current: { heading?: string; paragraphs: string[] } = { paragraphs: [] };
  for (const token of body.split(/(\u0001[^\u0002]*\u0002|\u0003)/)) {
    if (token.startsWith("\u0001")) {
      if (current.paragraphs.length) sections.push(current);
      current = { heading: token.slice(1, -1).trim() || undefined, paragraphs: [] };
    } else if (token !== "\u0003" && token.trim().length > 30) {
      current.paragraphs.push(token.trim());
    }
  }
  if (current.paragraphs.length) sections.push(current);
  return sections;
}
