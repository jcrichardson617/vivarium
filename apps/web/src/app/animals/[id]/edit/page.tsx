import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addGene, deleteAnimal, removeGene, updateDetails } from "./actions";

export const metadata: Metadata = { title: "Edit animal | Reptilytics" };

const STATUS_LABELS: Record<string, string> = {
  visual: "Visual",
  super: "Super",
  het: "100% het",
  possible_het: "Possible het",
};

export default async function EditAnimalPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { id } = await params;
  const { error, saved } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: animal }, { data: isOwner }] = await Promise.all([
    supabase
      .from("animals")
      .select("id, name, sex, hatch_date, status, status_date, visibility, species_id, sire_id, dam_id, species(common_name)")
      .eq("id", id)
      .maybeSingle(),
    supabase.rpc("fn06_is_current_owner", { p_animal_id: id, p_user_id: user!.id }),
  ]);
  if (!animal || !isOwner) notFound();

  const [{ data: acquisition }, { data: genes }, { data: animalGenes }, { data: relatives }, { data: morph }] =
    await Promise.all([
      supabase.from("animal_acquisitions").select("acquired_date").eq("animal_id", id).eq("user_id", user!.id).maybeSingle(),
      animal.species_id
        ? supabase.from("genes").select("id, name, inheritance").eq("species_id", animal.species_id).eq("active", true).order("name")
        : Promise.resolve({ data: [] as { id: string; name: string; inheritance: string }[] }),
      supabase.from("animal_genes").select("id, status, het_probability, genes(name, inheritance)").eq("animal_id", id),
      // Possible parents: your other animals of the same species.
      animal.species_id
        ? supabase
            .from("animals")
            .select("id, name, sex, animal_ownership!inner(user_id)")
            .eq("species_id", animal.species_id)
            .eq("animal_ownership.user_id", user!.id)
            .eq("animal_ownership.is_current_owner", true)
            .neq("id", id)
            .order("name")
        : Promise.resolve({ data: [] as { id: string; name: string | null; sex: string | null }[] }),
      supabase.rpc("morph_name", { p_animal_id: id }),
    ]);

  const sires = (relatives ?? []).filter((r) => r.sex !== "female");
  const dams = (relatives ?? []).filter((r) => r.sex !== "male");

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-8">
      <div>
        <Link href={`/animals/${id}`} className="text-sm text-muted hover:text-foreground">
          ← Back to {animal.name ?? "animal"}
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Edit {animal.name ?? "animal"}</h1>
      </div>

      {error && <p className="rounded-md bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}
      {saved && <p className="rounded-md bg-brand/10 p-3 text-sm text-brand-dark">{saved} ✓</p>}

      <form action={updateDetails} className="flex flex-col gap-4">
        <input type="hidden" name="animal_id" value={id} />
        <label className="flex flex-col gap-1 text-sm">
          Name / ID
          <input name="name" required maxLength={80} defaultValue={animal.name ?? ""} className="field" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Sex
            <select name="sex" defaultValue={animal.sex ?? "unknown"} className="field">
              <option value="unknown">Unknown</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Hatch date
            <input name="hatch_date" type="date" defaultValue={animal.hatch_date ?? ""} className="field" />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          Acquisition date
          <input name="acquired_date" type="date" defaultValue={acquisition?.acquired_date ?? ""} className="field" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Status
            <select name="status" defaultValue={animal.status} className="field">
              <option value="active">In collection</option>
              <option value="sold">Sold</option>
              <option value="on_loan">On loan</option>
              <option value="deceased">Deceased</option>
              <option value="lost">Lost / escaped</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Status date
            <input name="status_date" type="date" defaultValue={animal.status_date ?? ""} className="field" />
          </label>
        </div>

        <fieldset className="flex flex-col gap-3 rounded-md border border-border p-3">
          <legend className="px-1 text-sm font-medium">Parents</legend>
          {animal.species_id ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Sire (father)
                <select name="sire_id" defaultValue={animal.sire_id ?? ""} className="field">
                  <option value="">Unknown</option>
                  {sires.map((r) => <option key={r.id} value={r.id}>{r.name ?? "Unnamed"}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Dam (mother)
                <select name="dam_id" defaultValue={animal.dam_id ?? ""} className="field">
                  <option value="">Unknown</option>
                  {dams.map((r) => <option key={r.id} value={r.id}>{r.name ?? "Unnamed"}</option>)}
                </select>
              </label>
            </div>
          ) : (
            <p className="text-sm text-muted">Available once the species is approved.</p>
          )}
          <p className="text-xs text-muted">Lists your other {animal.species?.common_name ?? ""} animals.</p>
        </fieldset>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="public" defaultChecked={animal.visibility === "public"} className="mt-1" />
          <span>
            Public profile
            <span className="block text-xs text-muted">Anyone can see this animal&apos;s profile, photos and genetics. Logs stay private.</span>
          </span>
        </label>
        <button className="btn-primary self-start">Save details</button>
      </form>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Genetics</h2>
        <p className="text-sm text-muted">
          Morph: <strong className="text-foreground">{morph ?? "Normal"}</strong>
        </p>
        {!!animalGenes?.length && (
          <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
            {animalGenes.map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                <span>
                  {g.genes?.name} · {g.status === "possible_het" ? `${g.het_probability}% het` : STATUS_LABELS[g.status]}
                </span>
                <form action={removeGene}>
                  <input type="hidden" name="animal_id" value={id} />
                  <input type="hidden" name="id" value={g.id} />
                  <button aria-label="Remove gene" className="text-muted hover:text-red-600">✕</button>
                </form>
              </li>
            ))}
          </ul>
        )}
        {genes?.length ? (
          <form action={addGene} className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-card p-3 sm:grid-cols-4">
            <input type="hidden" name="animal_id" value={id} />
            <select name="gene_id" required defaultValue="" className="field col-span-2">
              <option value="" disabled>Choose a gene</option>
              {genes.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.inheritance === "incomplete_dominant" ? "co-dom" : g.inheritance})
                </option>
              ))}
            </select>
            <select name="gene_status" defaultValue="visual" className="field">
              <option value="visual">Visual</option>
              <option value="super">Super</option>
              <option value="het">100% het</option>
              <option value="possible_het">Possible het</option>
            </select>
            <select name="het_probability" defaultValue="50" className="field">
              <option value="50">50%</option>
              <option value="66">66%</option>
              <option value="33">33%</option>
              <option value="25">25%</option>
            </select>
            <button className="btn-secondary col-span-2 sm:col-span-4">Add gene</button>
            <p className="col-span-2 text-xs text-muted sm:col-span-4">The % only applies to possible hets.</p>
          </form>
        ) : (
          <p className="text-sm text-muted">No gene list for this species yet.</p>
        )}
      </section>

      <section className="rounded-lg border border-red-500/40 p-4">
        <h2 className="mb-1 text-lg font-semibold text-red-600">Delete this animal</h2>
        <p className="mb-3 text-sm text-muted">
          Permanently removes {animal.name ?? "this animal"}, its photos, logs and genetics. This can&apos;t be undone.
          If it was sold or died, consider changing its status instead to keep its history.
        </p>
        <form action={deleteAnimal} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="animal_id" value={id} />
          <input name="confirm" required placeholder='Type "delete"' autoComplete="off" className="field py-1" />
          <button className="rounded-md bg-red-600 px-4 py-1.5 font-medium text-white hover:bg-red-700">Delete animal</button>
        </form>
      </section>
    </div>
  );
}
