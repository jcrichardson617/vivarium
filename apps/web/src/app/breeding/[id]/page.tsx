import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fromC, round, tempUnit, unitSystemFor } from "@/lib/units";
import { addClutch, deleteClutch, deletePairing, hatchEgg, setEggStatus, updatePairingNotes } from "../actions";

export const metadata: Metadata = { title: "Pairing | Reptilytics" };

const STATUS_LABEL: Record<string, string> = {
  incubating: "Incubating",
  hatched: "Hatched",
  infertile: "Infertile",
  failed: "Failed",
};
const STATUS_CLASS: Record<string, string> = {
  incubating: "border-amber-500/40 bg-amber-500/10",
  hatched: "border-brand/40 bg-brand/10",
  infertile: "border-border bg-border/40 text-muted",
  failed: "border-red-500/30 bg-red-500/5 text-muted",
};

const fmt = (d: string | null) => (d ? new Date(d.length === 10 ? `${d}T00:00:00` : d).toLocaleDateString() : "—");
const daysUntil = (d: string) => Math.round((new Date(`${d}T00:00:00`).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000);

export default async function PairingPage({
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

  const [{ data: p }, { data: profile }] = await Promise.all([
    supabase
      .from("breeding_pairings")
      .select(
        "id, pairing_date, notes, male:animals!breeding_pairings_male_id_fkey(id, name, species(common_name)), female:animals!breeding_pairings_female_id_fkey(id, name, species(common_name)), clutches(id, laid_date, egg_count, fertile_count, expected_hatch_date, incubation_temp_c, notes, eggs(id, egg_number, status, hatchlings(animal_id, animals(name))))",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("profiles").select("unit_system, country").eq("id", user!.id).single(),
  ]);
  if (!p) notFound();
  const u = unitSystemFor(profile);
  const T = tempUnit(u);
  const clutches = [...p.clutches].sort((a, b) => (b.laid_date ?? "").localeCompare(a.laid_date ?? ""));
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/breeding" className="text-sm text-muted hover:text-foreground">← Breeding</Link>
        <h1 className="mt-2 text-3xl font-bold">
          {p.male ? <Link href={`/animals/${p.male.id}`} className="hover:text-brand">{p.male.name ?? "Unnamed"}</Link> : "Outside male"}
          <span className="text-muted"> × </span>
          {p.female ? <Link href={`/animals/${p.female.id}`} className="hover:text-brand">{p.female.name ?? "Unnamed"}</Link> : "Outside female"}
        </h1>
        <p className="text-muted">
          {(p.female ?? p.male)?.species?.common_name ?? "—"} · paired {fmt(p.pairing_date)}
        </p>
      </div>

      {error && <p className="rounded-md bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}
      {saved && <p className="rounded-md bg-brand/10 p-3 text-sm text-brand-dark">{saved} ✓</p>}

      <form action={updatePairingNotes} className="flex flex-col gap-2">
        <input type="hidden" name="pairing_id" value={id} />
        <label className="flex flex-col gap-1 text-sm">
          Notes
          <textarea name="notes" rows={2} maxLength={2000} defaultValue={p.notes ?? ""} className="field" />
        </label>
        <button className="btn-secondary self-start py-1 text-sm">Save notes</button>
      </form>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Clutches</h2>
        {clutches.length === 0 && <p className="text-sm text-muted">No clutches yet.</p>}
        {clutches.map((c) => {
          const incubating = c.eggs.some((e) => e.status === "incubating");
          const left = c.expected_hatch_date ? daysUntil(c.expected_hatch_date) : null;
          const eggs = [...c.eggs].sort((a, b) => (a.egg_number ?? 0) - (b.egg_number ?? 0));
          return (
            <div key={c.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">Laid {fmt(c.laid_date)}</p>
                  <p className="text-sm text-muted">
                    {c.egg_count ?? "?"} eggs{c.fertile_count !== null ? ` · ${c.fertile_count} fertile` : ""}
                    {c.incubation_temp_c !== null ? ` · ${round(fromC(Number(c.incubation_temp_c), u))}${T}` : ""}
                    {c.expected_hatch_date ? ` · expected ${fmt(c.expected_hatch_date)}` : ""}
                  </p>
                  {incubating && left !== null && (
                    <p className="mt-1 text-xs font-medium text-brand-dark">
                      {left > 0 ? `Hatching in ~${left} days` : left === 0 ? "Hatching today" : `Expected date passed ${-left} days ago`}
                    </p>
                  )}
                  {c.notes && <p className="mt-1 text-sm">{c.notes}</p>}
                </div>
                <form action={deleteClutch}>
                  <input type="hidden" name="pairing_id" value={id} />
                  <input type="hidden" name="clutch_id" value={c.id} />
                  <button className="text-xs text-muted hover:text-red-600">Delete clutch</button>
                </form>
              </div>

              {eggs.length > 0 && (
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {eggs.map((e) => {
                    const status = e.status ?? "incubating";
                    const hatchling = e.hatchlings[0];
                    return (
                      <li key={e.id} className={`rounded-md border p-3 text-sm ${STATUS_CLASS[status]}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">Egg {e.egg_number ?? "—"} · {STATUS_LABEL[status]}</span>
                          {status !== "hatched" && (
                            <form action={setEggStatus} className="flex items-center gap-1">
                              <input type="hidden" name="pairing_id" value={id} />
                              <input type="hidden" name="egg_id" value={e.id} />
                              <select name="status" defaultValue={status} className="field py-0.5 text-xs">
                                <option value="incubating">Incubating</option>
                                <option value="infertile">Infertile</option>
                                <option value="failed">Failed</option>
                              </select>
                              <button className="text-xs text-brand hover:underline">Set</button>
                            </form>
                          )}
                        </div>
                        {hatchling?.animal_id && (
                          <Link href={`/animals/${hatchling.animal_id}`} className="mt-1 block text-brand hover:underline">
                            {hatchling.animals?.name ?? "Unnamed hatchling"} →
                          </Link>
                        )}
                        {status === "incubating" && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-brand">Hatched? Add it</summary>
                            <form action={hatchEgg} className="mt-2 grid grid-cols-2 gap-2">
                              <input type="hidden" name="pairing_id" value={id} />
                              <input type="hidden" name="egg_id" value={e.id} />
                              <input name="name" maxLength={80} placeholder="Name / ID" className="field col-span-2 py-1" />
                              <select name="sex" defaultValue="unknown" className="field py-1">
                                <option value="unknown">Sex unknown</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                              </select>
                              <input name="hatch_weight_g" type="number" step="0.1" min="0" placeholder="Weight (g)" className="field py-1" />
                              <input name="hatch_date" type="date" defaultValue={today} className="field col-span-2 py-1" />
                              <button className="btn-primary col-span-2 py-1 text-sm">Add hatchling</button>
                            </form>
                          </details>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </section>

      <form action={addClutch} className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
        <h2 className="text-lg font-semibold">Add clutch</h2>
        <input type="hidden" name="pairing_id" value={id} />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Laid on
            <input name="laid_date" type="date" defaultValue={today} className="field" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Expected hatch
            <input name="expected_hatch_date" type="date" className="field" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Total eggs
            <input name="egg_count" type="number" min={0} max={200} className="field" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Fertile eggs
            <input name="fertile_count" type="number" min={0} max={200} className="field" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Incubation temp ({T})
            <input name="incubation_temp" type="number" step="0.1" className="field" />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          Notes
          <textarea name="notes" rows={2} maxLength={2000} placeholder="Slugs, incubator, substrate…" className="field" />
        </label>
        <button className="btn-primary self-start">Add clutch</button>
      </form>

      <form action={deletePairing} className="flex items-center gap-2 border-t border-border pt-4 text-sm">
        <input type="hidden" name="pairing_id" value={id} />
        <label className="flex items-center gap-2 text-muted">
          <input type="checkbox" name="confirm" required />
          Delete this pairing and its clutches (hatched animals are kept)
        </label>
        <button className="text-red-600 hover:underline">Delete</button>
      </form>
    </div>
  );
}
