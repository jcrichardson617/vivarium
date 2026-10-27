import Link from "next/link";
import { AnimalFilters } from "@/components/animal-filters";
import { GettingStarted } from "@/components/getting-started";
import { DUE_TONE_CLASS, feedingDue, feedingSchedulesOn, type FeedingDue } from "@/lib/feeding";
import { createClient } from "@/lib/supabase/server";
import { bulkTag } from "./list-actions";

const PAGE_SIZE = { cards: 48, table: 100 };
const FILTER_KEYS = ["q", "species", "sex", "status", "enclosure", "tag", "due", "sort", "view", "group"] as const;

type Params = Partial<Record<(typeof FILTER_KEYS)[number] | "page" | "error" | "deleted" | "notice", string>>;

export default async function AnimalsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const { error: pageError, deleted, notice } = params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: rows, error }, { count: enclosureCount }, { data: profile }, schedules] = await Promise.all([
    supabase.rpc("fn67_my_animals"),
    supabase.from("enclosures").select("id", { count: "exact", head: true }).eq("owner_id", user!.id),
    supabase.rpc("fn72_my_profile").single(),
    feedingSchedulesOn(supabase),
  ]);
  const all = (rows ?? []).map((a) => ({
    ...a,
    speciesLabel:
      a.species_common_name ??
      (a.pending_species
        ? `${a.pending_species} (${a.pending_species_status === "rejected" ? "species request rejected" : "species pending review"})`
        : "Unknown species"),
    due: schedules && a.status === "active" ? feedingDue(a.last_fed_at, a.feeding_interval_days) : null,
  }));
  const dueCount = all.filter((a) => a.due && a.due.days <= 0).length;

  // Filter options come from the keeper's own collection.
  const speciesOptions = uniqueOptions(all.map((a) => [a.speciesLabel, a.speciesLabel]));
  const enclosureOptions = uniqueOptions(all.filter((a) => a.enclosure_id).map((a) => [a.enclosure_id!, a.enclosure_name ?? "Enclosure"]));
  const tagOptions = [...new Set(all.flatMap((a) => a.tags ?? []))].sort((x, y) => x.localeCompare(y));

  const q = params.q?.trim().toLowerCase();
  const status = params.status ?? "";
  const filtered = all.filter((a) => {
    if (status !== "all" && a.status !== (status || "active")) return false;
    if (params.species && a.speciesLabel !== params.species) return false;
    if (params.sex && (a.sex ?? "unknown") !== params.sex) return false;
    if (params.enclosure === "none" ? a.enclosure_id : params.enclosure && a.enclosure_id !== params.enclosure) return false;
    if (params.tag && !a.tags?.includes(params.tag)) return false;
    if (params.due === "1" && !(a.due && a.due.days <= 0)) return false;
    if (q) {
      const hay = [a.name, a.animal_code, a.speciesLabel, a.species_scientific_name, a.enclosure_name, a.owner_username, ...(a.tags ?? [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const byName = (x: (typeof all)[number], y: (typeof all)[number]) =>
    (x.name ?? "").localeCompare(y.name ?? "", undefined, { numeric: true, sensitivity: "base" });
  const sorters: Record<string, (x: (typeof all)[number], y: (typeof all)[number]) => number> = {
    code: (x, y) => (x.animal_code ?? "￿").localeCompare(y.animal_code ?? "￿", undefined, { numeric: true }) || byName(x, y),
    newest: (x, y) => (y.created_at ?? "").localeCompare(x.created_at ?? "") || byName(x, y),
    age: (x, y) => (x.hatch_date ?? "9999").localeCompare(y.hatch_date ?? "9999") || byName(x, y),
    due: (x, y) => (x.due?.days ?? 1e6) - (y.due?.days ?? 1e6) || byName(x, y),
  };
  const sort = sorters[params.sort ?? ""] ?? byName;
  const grouped = params.group === "species";
  filtered.sort((x, y) => (grouped ? x.speciesLabel.localeCompare(y.speciesLabel) : 0) || sort(x, y));

  const view = params.view === "table" ? "table" : "cards";
  const size = PAGE_SIZE[view];
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const page = Math.min(pages, Math.max(1, Number(params.page) || 1));
  const shown = filtered.slice((page - 1) * size, page * size);

  // Signed photo URLs only for the animals on this page.
  const paths = shown.filter((a) => a.photo_path).map((a) => a.photo_path!);
  const { data: signed } = view === "cards" && paths.length
    ? await supabase.storage.from("animal-photos").createSignedUrls(paths, 3600)
    : { data: [] };
  const urlByPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));

  const filterValues = Object.fromEntries(FILTER_KEYS.filter((k) => params[k]).map((k) => [k, params[k]!]));
  const hrefWith = (extra: Record<string, string | undefined>) => {
    const sp = new URLSearchParams({ ...filterValues, ...extra } as Record<string, string>);
    for (const [k, v] of [...sp.entries()]) if (!v) sp.delete(k);
    const s = sp.toString();
    return s ? `/animals?${s}` : "/animals";
  };
  const currentHref = hrefWith({ page: page > 1 ? String(page) : undefined });
  const filtering = FILTER_KEYS.some((k) => !["sort", "view", "group"].includes(k) && params[k]);

  // Species headings within the page when grouping.
  const sections: { label: string | null; animals: typeof shown }[] = [];
  for (const a of shown) {
    const label = grouped ? a.speciesLabel : null;
    if (!sections.length || sections[sections.length - 1].label !== label) sections.push({ label, animals: [] });
    sections[sections.length - 1].animals.push(a);
  }
  const groupCount = (label: string) => filtered.filter((a) => a.speciesLabel === label).length;

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My animals</h1>
        <div className="flex items-center gap-3">
          <Link href="/settings#export" className="text-sm text-muted hover:text-brand">
            Export CSV
          </Link>
          <Link href="/animals/new" className="btn-primary">
            Add animal
          </Link>
        </div>
      </div>

      {deleted && <p className="mb-4 rounded-md bg-brand/10 p-3 text-sm text-brand-dark">Animal deleted.</p>}
      {notice && <p className="mb-4 rounded-md bg-brand/10 p-3 text-sm text-brand-dark">{notice}</p>}
      {pageError && <p className="mb-4 rounded-md bg-red-500/10 p-3 text-sm text-red-600">{pageError}</p>}
      {dueCount > 0 && params.due !== "1" && (
        <Link
          href={hrefWith({ due: "1", page: undefined })}
          className="mb-4 block rounded-md bg-amber-500/15 p-3 text-sm text-amber-800 hover:underline dark:text-amber-300"
        >
          🍽️ {dueCount} {dueCount === 1 ? "animal is" : "animals are"} due to eat. Show them
        </Link>
      )}
      {error && <p className="text-red-600">Could not load animals: {error.message}</p>}
      {!error && (
        <GettingStarted
          animalCount={all.length}
          enclosureCount={enclosureCount ?? 0}
          hasReminder={all.some((a) => a.feeding_interval_days)}
          schedules={schedules}
          firstAnimalId={all[0]?.id}
          skipped={profile?.onboarding_skipped ?? []}
        />
      )}

      {all.length === 0 && !error && (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted">
          No animals yet. Add your first one to start logging.
        </p>
      )}

      {all.length > 0 && (
        <>
          {all.length > 6 && (
            <AnimalFilters values={filterValues} species={speciesOptions} enclosures={enclosureOptions} tags={tagOptions} schedules={schedules} />
          )}
          <p className="mb-3 text-sm text-muted">
            {filtered.length === 0
              ? "No animals match."
              : `Showing ${(page - 1) * size + 1}–${(page - 1) * size + shown.length} of ${filtered.length}`}
            {filtering && (
              <>
                {" · "}
                <Link href={hrefWith(Object.fromEntries(FILTER_KEYS.filter((k) => !["sort", "view", "group"].includes(k)).map((k) => [k, undefined])))} className="text-brand hover:underline">
                  Clear filters
                </Link>
              </>
            )}
          </p>

          {view === "cards" ? (
            sections.map((s, i) => (
              <div key={`${s.label}-${i}`} className="mb-6">
                {s.label && (
                  <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
                    {s.label} <span className="font-normal">({groupCount(s.label)})</span>
                  </h2>
                )}
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {s.animals.map((a) => (
                    <li key={a.id}>
                      <Link href={`/animals/${a.id}`} className="flex gap-4 rounded-lg border border-border bg-card p-4 transition hover:border-brand">
                        {a.photo_path && urlByPath.get(a.photo_path) ? (
                          // Signed URL from private storage; plain img avoids configuring remote image domains.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={urlByPath.get(a.photo_path)!} alt="" className="h-16 w-16 shrink-0 rounded-md object-cover" />
                        ) : (
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-border/50 text-2xl text-muted">🦎</div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate font-semibold">{a.name ?? "Unnamed"}</p>
                            <DueBadge due={a.due} />
                          </div>
                          <p className="text-sm text-muted">
                            {a.speciesLabel}
                            {a.sex && a.sex !== "unknown" ? ` · ${a.sex}` : ""}
                            {a.animal_code ? ` · ${a.animal_code}` : ""}
                          </p>
                          {a.enclosure_name && <p className="truncate text-xs text-muted">🏠 {a.enclosure_name}</p>}
                          <SharedBadge access={a.access} owner={a.owner_username} />
                          {a.status !== "active" && <p className="mt-1 text-xs uppercase tracking-wide text-muted">{a.status.replace("_", " ")}</p>}
                          <Tags tags={a.tags} />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <form action={bulkTag}>
              <input type="hidden" name="back" value={currentHref} />
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-card text-xs uppercase tracking-wide text-muted">
                    <tr>
                      <th className="w-8 p-2"></th>
                      <th className="p-2">Name</th>
                      <th className="p-2">ID</th>
                      {!grouped && <th className="p-2">Species</th>}
                      <th className="p-2">Morph</th>
                      <th className="p-2">Sex</th>
                      <th className="p-2">Age</th>
                      <th className="p-2">Weight</th>
                      <th className="p-2">Enclosure</th>
                      {schedules && <th className="p-2">Feeding</th>}
                      <th className="p-2">Tags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sections.map((s, i) => (
                      <TableSection key={`${s.label}-${i}`} label={s.label} count={s.label ? groupCount(s.label) : 0} grouped={grouped}>
                        {s.animals.map((a) => (
                          <tr key={a.id} className="border-t border-border hover:bg-card">
                            <td className="p-2">
                              {a.access === "owner" && (
                                <input type="checkbox" name="ids" value={a.id} aria-label={`Select ${a.name ?? "animal"}`} />
                              )}
                            </td>
                            <td className="p-2 font-medium">
                              <Link href={`/animals/${a.id}`} className="hover:text-brand hover:underline">
                                {a.name ?? "Unnamed"}
                              </Link>
                              {a.status !== "active" && <span className="ml-1 text-xs uppercase text-muted">{a.status.replace("_", " ")}</span>}
                              <SharedBadge access={a.access} owner={a.owner_username} />
                            </td>
                            <td className="p-2 text-muted">{a.animal_code}</td>
                            {!grouped && <td className="p-2 text-muted">{a.speciesLabel}</td>}
                            <td className="p-2 text-muted">{a.morph && a.morph !== "Normal" ? a.morph : ""}</td>
                            <td className="p-2 text-muted">{a.sex && a.sex !== "unknown" ? a.sex : ""}</td>
                            <td className="whitespace-nowrap p-2 text-muted" title={a.hatch_date ?? undefined}>{age(a.hatch_date)}</td>
                            <td className="whitespace-nowrap p-2">
                              {a.latest_weight_g !== null && (
                                <span className="flex items-center gap-2">
                                  <span>{Number(a.latest_weight_g).toLocaleString("en-US")} g</span>
                                  <Sparkline values={(a.weights_g ?? []).map(Number)} />
                                </span>
                              )}
                            </td>
                            <td className="p-2 text-muted">{a.enclosure_name}</td>
                            {schedules && <td className="p-2"><DueBadge due={a.due} /></td>}
                            <td className="p-2"><Tags tags={a.tags} /></td>
                          </tr>
                        ))}
                      </TableSection>
                    ))}
                  </tbody>
                </table>
              </div>
              {shown.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted">Ticked animals:</span>
                  <input name="tag" list="animal-tags" placeholder="Tag" maxLength={40} className="field w-40 py-1" />
                  <datalist id="animal-tags">
                    {tagOptions.map((t) => <option key={t} value={t} />)}
                  </datalist>
                  <button name="op" value="add" className="btn-secondary px-3 py-1">Add tag</button>
                  <button name="op" value="remove" className="btn-secondary px-3 py-1">Remove tag</button>
                </div>
              )}
            </form>
          )}

          {pages > 1 && (
            <nav className="mt-6 flex items-center justify-center gap-3 text-sm" aria-label="Pages">
              {page > 1 ? <Link href={hrefWith({ page: String(page - 1) })} className="btn-secondary px-3 py-1">← Previous</Link> : null}
              <span className="text-muted">Page {page} of {pages}</span>
              {page < pages ? <Link href={hrefWith({ page: String(page + 1) })} className="btn-secondary px-3 py-1">Next →</Link> : null}
            </nav>
          )}
        </>
      )}
    </section>
  );
}

// "8 mo", "2 yr 3 mo" from a hatch date.
function age(hatch: string | null) {
  if (!hatch) return "";
  const h = new Date(`${hatch}T12:00:00`);
  const now = new Date();
  const months = (now.getFullYear() - h.getFullYear()) * 12 + now.getMonth() - h.getMonth() - (now.getDate() < h.getDate() ? 1 : 0);
  if (months < 1) return `${Math.max(0, Math.floor((now.getTime() - h.getTime()) / 86400000))} d`;
  if (months < 24) return `${months} mo`;
  return `${Math.floor(months / 12)} yr${months % 12 ? ` ${months % 12} mo` : ""}`;
}

// Tiny weight trend: last eight weights, oldest to newest.
function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values.map((v, i) => `${(i / (values.length - 1)) * 48},${14 - ((v - min) / range) * 12}`).join(" ");
  const down = values[values.length - 1] < values[0];
  return (
    <svg viewBox="0 0 48 16" className="h-4 w-12" aria-label={`Weight trend: ${values.join(", ")} g`}>
      <polyline points={points} fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={down ? "stroke-accent" : "stroke-brand"} />
    </svg>
  );
}

function uniqueOptions(pairs: string[][]) {
  const map = new Map(pairs.map(([value, label]) => [value, label]));
  return [...map].map(([value, label]) => ({ value, label })).sort((x, y) => x.label.localeCompare(y.label));
}

function DueBadge({ due }: { due: FeedingDue | null }) {
  if (!due) return null;
  return <span className={`shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${DUE_TONE_CLASS[due.tone]}`}>{due.label}</span>;
}

// Animals other keepers have shared with you.
function SharedBadge({ access, owner }: { access: string; owner: string | null }) {
  if (access === "owner") return null;
  return (
    <p className="text-xs text-muted">
      Shared by @{owner} · {access === "caretaker" ? "Caretaker" : "Viewer"}
    </p>
  );
}

function Tags({ tags }: { tags: string[] | null }) {
  if (!tags?.length) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {tags.map((t) => (
        <span key={t} className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand-dark">{t}</span>
      ))}
    </div>
  );
}

function TableSection({ label, count, grouped, children }: { label: string | null; count: number; grouped: boolean; children: React.ReactNode }) {
  return (
    <>
      {grouped && label && (
        <tr className="border-t border-border bg-border/30">
          <td colSpan={10} className="p-2 text-xs font-semibold uppercase tracking-wide text-muted">
            {label} ({count})
          </td>
        </tr>
      )}
      {children}
    </>
  );
}
