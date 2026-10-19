import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { createClient } from "@/lib/supabase/server";
import { HR_PAGE } from "@/lib/herp-review";
import { speciesSlug } from "@/lib/slug";
import { addNotes, deleteNote, saveNote } from "./actions";

export const metadata: Metadata = { title: "Natural history notes | Reptilytics" };

export default async function NotesAdminPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string; todo?: string }> }) {
  const { error, saved, todo } = await searchParams;
  const supabase = await createClient();
  const { data: me } = await supabase.rpc("fn72_my_profile").single();
  if (!me || !["moderator", "admin"].includes(me.role)) notFound();

  let query = supabase
    .from("research_documents")
    .select("id, title, authors, published_date, citation, summary, source_url, external_id, research_document_species(species(common_name, scientific_name))", {
      count: "exact",
    })
    .eq("external_source", "herp_review")
    .order("created_at", { ascending: false })
    .limit(100);
  if (todo) query = query.is("summary", null);
  const [{ data: notes, count }, { count: unsummarized }] = await Promise.all([
    query,
    supabase.from("research_documents").select("id", { count: "exact", head: true }).eq("external_source", "herp_review").is("summary", null),
  ]);

  return (
    <section className="flex flex-col gap-6">
      <div>
        <AdminNav current="/admin/notes" />
        <h1 className="text-2xl font-bold">Natural history notes</h1>
        <p className="text-muted">
          Notes from <a href={HR_PAGE} target="_blank" rel="noreferrer" className="text-brand hover:underline">Herpetological Review</a>.
          We keep the citation, a link to SSAR&apos;s PDF and our own one- or two-sentence summary, never the note&apos;s text.
          They show on species pages and Monty can search them.
        </p>
      </div>
      {error && <p className="whitespace-pre-line rounded-md bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}
      {saved && <p className="rounded-md bg-brand/10 p-3 text-sm text-brand-dark">{saved} ✓</p>}

      <form action={addNotes} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
        <h2 className="font-semibold">Add notes</h2>
        <textarea
          name="citations"
          rows={6}
          required
          className="field font-mono text-xs"
          placeholder={"One citation per line, e.g.\nSmith, J. A. 2015. Crotalus horridus (Timber Rattlesnake). Diet. Herpetological Review 46(2):235–236."}
        />
        <input name="pdf_url" type="url" placeholder="PDF link for these notes (optional, https://ssarherps.org/…)" className="field" />
        <p className="text-xs text-muted">Species must already be in our list (scientific name or synonym). Re-adding a note updates it.</p>
        <button className="btn-primary self-start">Add notes</button>
      </form>

      <p className="text-sm">
        {count ?? 0} {todo ? "without a summary" : "notes"} ·{" "}
        {todo ? (
          <Link href="/admin/notes" className="text-brand hover:underline">Show all</Link>
        ) : (
          <Link href="/admin/notes?todo=1" className="text-brand hover:underline">{unsummarized ?? 0} need a summary</Link>
        )}
      </p>

      <ul className="flex flex-col gap-3">
        {notes?.map((n) => {
          const sp = n.research_document_species[0]?.species;
          return (
            <li key={n.id} className="rounded-lg border border-border bg-card p-4 text-sm">
              <p className="font-medium">{n.title}</p>
              <p className="text-xs text-muted">
                {[n.authors[0], n.published_date?.slice(0, 4), n.citation].filter(Boolean).join(" · ")}
                {sp && (
                  <>
                    {" · "}
                    <Link href={`/species/${speciesSlug(sp)}`} className="hover:text-foreground">{sp.common_name ?? sp.scientific_name}</Link>
                  </>
                )}
                {" · "}
                <a href={n.source_url} target="_blank" rel="noreferrer" className="hover:text-foreground">PDF</a>
              </p>
              <form action={saveNote} className="mt-3 flex flex-col gap-2">
                <input type="hidden" name="id" value={n.id} />
                <input type="hidden" name="key" value={n.external_id ?? ""} />
                <textarea name="summary" rows={2} maxLength={1500} defaultValue={n.summary ?? ""} placeholder="Our summary: what was observed, where, and why it matters" className="field" />
                <div className="flex flex-wrap gap-2">
                  <input name="pdf_url" type="url" placeholder="Replace PDF link (optional)" className="field min-w-0 flex-1" />
                  <button className="btn-secondary">Save</button>
                </div>
              </form>
              <form action={deleteNote} className="mt-2">
                <input type="hidden" name="id" value={n.id} />
                <button className="text-xs text-muted hover:text-red-600">Delete note</button>
              </form>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
