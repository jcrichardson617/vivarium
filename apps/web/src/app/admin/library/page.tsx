import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { createClient } from "@/lib/supabase/server";
import { runJob } from "./actions";

export const metadata: Metadata = { title: "Research library | Reptilytics" };

const JOBS = [
  { job: "harvest-research", label: "Harvest next", hint: "every 10 min" },
  { job: "fetch-fulltext", label: "Fetch full text", hint: "every 2 min" },
  { job: "embed-chunks", label: "Embed passages", hint: "every 20 s" },
];

const RIGHTS: Record<string, string> = { full_text: "Full text", abstract: "Abstract", summary_only: "Summary" };

const ago = (d: string | null) => {
  if (!d) return "never";
  const mins = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  return mins < 60 ? `${mins}m ago` : mins < 2880 ? `${Math.round(mins / 60)}h ago` : `${Math.round(mins / 1440)}d ago`;
};

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ error?: string; started?: string; q?: string }> }) {
  const { error, started, q } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  if (!me || !["moderator", "admin"].includes(me.role)) notFound();

  const docCount = (build: (q: ReturnType<typeof docsHead>) => ReturnType<typeof docsHead> = (q) => q) =>
    build(docsHead()).then((r) => r.count ?? 0);
  const docsHead = () => supabase.from("research_documents").select("id", { count: "exact", head: true });
  const chunksHead = () => supabase.from("research_chunks").select("id", { count: "exact", head: true });

  let docsQuery = supabase
    .from("research_documents")
    .select("id, title, publisher, published_date, source_url, content_rights, ingest_status, fulltext_status, chunk_count, research_document_species(species(common_name))")
    .order("created_at", { ascending: false })
    .limit(30);
  if (q) docsQuery = docsQuery.ilike("title", `%${q}%`);

  const [docs, ready, fullText, ftPending, passages, embedded, speciesTotal, { data: speciesRuns }, { data: topics }, { data: recent }] =
    await Promise.all([
      docCount(),
      docCount((q) => q.eq("ingest_status", "ready")),
      docCount((q) => q.eq("content_rights", "full_text")),
      docCount((q) => q.eq("fulltext_status", "pending")),
      chunksHead().then((r) => r.count ?? 0),
      chunksHead().not("embedding", "is", null).then((r) => r.count ?? 0),
      supabase.from("species").select("id", { count: "exact", head: true }).eq("active", true).then((r) => r.count ?? 0),
      supabase
        .from("research_harvest_state")
        .select("last_harvested_at, last_status, last_error, hit_count, docs_added, species(common_name, scientific_name)")
        .order("last_harvested_at", { ascending: false }),
      supabase.from("research_harvest_topics").select("label, last_harvested_at, last_status, last_error, hit_count, docs_added").order("label"),
      docsQuery,
    ]);

  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
  const stats = [
    { label: "Papers", value: docs.toLocaleString(), sub: `${ready.toLocaleString()} searchable` },
    { label: "Full text", value: fullText.toLocaleString(), sub: `${ftPending.toLocaleString()} queued` },
    { label: "Passages", value: passages.toLocaleString(), sub: `${pct(embedded, passages)}% embedded` },
    { label: "Species covered", value: `${speciesRuns?.length ?? 0} / ${speciesTotal}`, sub: `${topics?.filter((t) => t.last_harvested_at).length ?? 0} / ${topics?.length ?? 0} topics` },
  ];

  return (
    <section className="flex flex-col gap-8">
      <div>
        <AdminNav current="/admin/library" />
        <h1 className="text-2xl font-bold">Research library</h1>
        <p className="text-muted">
          HerpAtlas pulls papers from Europe PMC automatically: species by species plus topic sweeps. Open-access papers
          under CC BY / CC BY-SA / CC0 get full text; everything else keeps its abstract.
        </p>
      </div>

      {error && <p className="rounded-md bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}
      {started && <p className="rounded-md bg-brand/10 p-3 text-sm text-brand-dark">Started {started}. Refresh in a moment.</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold">{s.value}</p>
            <p className="text-xs text-muted">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {JOBS.map((j) => (
          <form key={j.job} action={runJob}>
            <input type="hidden" name="job" value={j.job} />
            <button className="btn-secondary text-sm">
              {j.label} <span className="text-xs text-muted">({j.hint})</span>
            </button>
          </form>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Recent harvests</h2>
        <ul className="divide-y divide-border rounded-lg border border-border bg-card text-sm">
          {[
            ...(speciesRuns ?? []).map((r) => ({ name: r.species?.common_name ?? r.species?.scientific_name ?? "—", kind: "Species", ...r })),
            ...(topics ?? []).filter((t) => t.last_harvested_at).map((t) => ({ name: t.label, kind: "Topic", ...t })),
          ]
            .sort((a, b) => (b.last_harvested_at ?? "").localeCompare(a.last_harvested_at ?? ""))
            .slice(0, 12)
            .map((r, i) => (
              <li key={i} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
                <span>
                  <span className="mr-2 text-xs uppercase tracking-wide text-muted">{r.kind}</span>
                  {r.name}
                </span>
                <span className={r.last_status === "error" ? "text-red-600" : "text-muted"}>
                  {r.last_status === "error" ? r.last_error : `${r.docs_added} new of ${r.hit_count ?? 0} found`} · {ago(r.last_harvested_at)}
                </span>
              </li>
            ))}
          {!speciesRuns?.length && <li className="px-4 py-3 text-muted">Nothing harvested yet.</li>}
        </ul>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Papers</h2>
          <form className="flex gap-2">
            <input name="q" defaultValue={q ?? ""} placeholder="Search titles" className="field py-1 text-sm" />
            <button className="btn-secondary py-1 text-sm">Search</button>
          </form>
        </div>
        <ul className="flex flex-col gap-2">
          {recent?.map((d) => (
            <li key={d.id} className="rounded-lg border border-border bg-card p-3 text-sm">
              <a href={d.source_url} target="_blank" rel="noreferrer" className="font-medium hover:text-brand">
                {d.title}
              </a>
              <p className="mt-1 text-xs text-muted">
                {[d.publisher, d.published_date?.slice(0, 4)].filter(Boolean).join(" · ")}
                {" · "}
                {RIGHTS[d.content_rights] ?? d.content_rights}
                {d.fulltext_status === "pending" ? " (full text queued)" : ""}
                {" · "}
                {d.ingest_status === "ready" ? `${d.chunk_count} passages` : d.ingest_status}
                {d.research_document_species.length > 0 &&
                  ` · ${d.research_document_species.map((s) => s.species?.common_name).filter(Boolean).join(", ")}`}
              </p>
            </li>
          ))}
          {!recent?.length && <li className="rounded-lg border border-dashed border-border p-6 text-center text-muted">No papers yet.</li>}
        </ul>
      </section>
    </section>
  );
}
