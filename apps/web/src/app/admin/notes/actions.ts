"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HR_PAGE, parseHrCitation } from "@/lib/herp-review";

function back(params: string): never {
  revalidatePath("/admin/notes");
  redirect(`/admin/notes?${params}`);
}

const pdfUrl = (formData: FormData) => {
  const v = String(formData.get("pdf_url") ?? "").trim().split("#")[0];
  return v.startsWith("https://") ? v : null;
};

// The note's searchable passage: its title plus our summary (never the note's own text).
async function writeChunk(supabase: Awaited<ReturnType<typeof createClient>>, id: string, title: string, summary: string | null) {
  await supabase.from("research_chunks").delete().eq("document_id", id);
  const { error } = await supabase
    .from("research_chunks")
    .insert({ document_id: id, chunk_index: 0, content: summary ? `${title} ${summary}` : title });
  if (!error) await supabase.from("research_documents").update({ chunk_count: 1, ingest_status: "ready" }).eq("id", id);
  return error;
}

// Bulk add: one citation per line. Lines whose species isn't in our list are reported, not saved.
export async function addNotes(formData: FormData) {
  const supabase = await createClient();
  const pdf = pdfUrl(formData);
  const lines = String(formData.get("citations") ?? "").split("\n").map((l) => l.trim()).filter(Boolean);

  const [{ data: species }, { data: synonyms }] = await Promise.all([
    supabase.from("species").select("id, scientific_name"),
    supabase.from("species_synonyms").select("species_id, synonym_name"),
  ]);
  const byName = new Map<string, string>();
  for (const s of species ?? []) byName.set(s.scientific_name.toLowerCase(), s.id);
  for (const s of synonyms ?? []) if (!byName.has(s.synonym_name.toLowerCase())) byName.set(s.synonym_name.toLowerCase(), s.species_id);

  let added = 0;
  const skipped: string[] = [];
  for (const line of lines) {
    const note = parseHrCitation(line);
    if (!note) {
      skipped.push(`Couldn't read: ${line.slice(0, 80)}`);
      continue;
    }
    const speciesId = byName.get(note.taxon.toLowerCase()) ?? byName.get(note.binomial);
    if (!speciesId) {
      skipped.push(`Species not in our list: ${note.taxon}`);
      continue;
    }
    const { data: doc, error } = await supabase
      .from("research_documents")
      .upsert(
        {
          title: note.title,
          source_url: `${pdf ?? HR_PAGE}#${encodeURIComponent(note.key)}`,
          source_type: "journal_article",
          content_rights: "summary_only",
          evidence_level: "grey_literature",
          open_access: true,
          authors: note.authors ? [note.authors] : [],
          publisher: "Herpetological Review",
          published_date: `${note.year}-01-01`,
          external_source: "herp_review",
          external_id: note.key,
          note_topic: note.topic,
          citation: note.citation,
          retrieved_at: new Date().toISOString(),
        },
        { onConflict: "external_source,external_id" },
      )
      .select("id, summary")
      .single();
    if (error) {
      skipped.push(`${note.title}: ${error.message}`);
      continue;
    }
    await supabase.from("research_document_species").upsert({ document_id: doc.id, species_id: speciesId });
    await writeChunk(supabase, doc.id, note.title, doc.summary);
    added++;
  }
  back(`saved=${encodeURIComponent(`${added} note${added === 1 ? "" : "s"} saved`)}${skipped.length ? `&error=${encodeURIComponent(skipped.join("\n"))}` : ""}`);
}

export async function saveNote(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const summary = String(formData.get("summary") ?? "").trim() || null;
  const pdf = pdfUrl(formData);
  const { data: doc, error } = await supabase
    .from("research_documents")
    .update({
      summary,
      ...(pdf ? { source_url: `${pdf}#${encodeURIComponent(String(formData.get("key")))}` } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("title")
    .single();
  if (error) back(`error=${encodeURIComponent(error.message)}`);
  const chunkError = await writeChunk(supabase, id, doc.title, summary);
  back(chunkError ? `error=${encodeURIComponent(chunkError.message)}` : "saved=Note+saved");
}

export async function deleteNote(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("research_documents").delete().eq("id", String(formData.get("id"))).eq("external_source", "herp_review");
  back(error ? `error=${encodeURIComponent(error.message)}` : "saved=Note+deleted");
}
