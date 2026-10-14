import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createPairing } from "./actions";

export const metadata: Metadata = { title: "Breeding | Reptilytics" };

const daysUntil = (d: string) => Math.round((new Date(`${d}T00:00:00`).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000);

export default async function BreedingPage({ searchParams }: { searchParams: Promise<{ error?: string; deleted?: string }> }) {
  const { error, deleted } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: pairings }, { data: animals }] = await Promise.all([
    supabase
      .from("breeding_pairings")
      .select(
        "id, pairing_date, notes, male:animals!breeding_pairings_male_id_fkey(id, name, species(common_name)), female:animals!breeding_pairings_female_id_fkey(id, name, species(common_name)), clutches(id, egg_count, expected_hatch_date, eggs(status))",
      )
      .order("pairing_date", { ascending: false }),
    supabase
      .from("animals")
      .select("id, name, sex, animal_code, species(common_name), animal_ownership!inner(user_id)")
      .eq("animal_ownership.user_id", user!.id)
      .eq("animal_ownership.is_current_owner", true)
      .eq("status", "active")
      .order("name"),
  ]);

  const label = (a: { name: string | null; animal_code: string | null; species: { common_name: string | null } | null }) =>
    `${a.name ?? "Unnamed"}${a.animal_code ? ` (${a.animal_code})` : ""} · ${a.species?.common_name ?? "Unknown species"}`;
  const males = (animals ?? []).filter((a) => a.sex !== "female");
  const females = (animals ?? []).filter((a) => a.sex !== "male");

  return (
    <section className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Breeding</h1>

      {deleted && <p className="rounded-md bg-brand/10 p-3 text-sm text-brand-dark">Pairing deleted.</p>}
      {error && <p className="rounded-md bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}

      {pairings?.length ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {pairings.map((p) => {
            const eggs = p.clutches.flatMap((c) => c.eggs);
            const incubating = eggs.filter((e) => e.status === "incubating").length;
            const hatched = eggs.filter((e) => e.status === "hatched").length;
            const next = p.clutches
              .filter((c) => c.expected_hatch_date && c.eggs.some((e) => e.status === "incubating"))
              .map((c) => daysUntil(c.expected_hatch_date!))
              .sort((a, b) => a - b)[0];
            return (
              <li key={p.id}>
                <Link href={`/breeding/${p.id}`} className="block rounded-lg border border-border bg-card p-4 transition hover:border-brand">
                  <p className="font-semibold">
                    {p.male?.name ?? "Outside male"} <span className="text-muted">×</span> {p.female?.name ?? "Outside female"}
                  </p>
                  <p className="text-sm text-muted">
                    {(p.female ?? p.male)?.species?.common_name ?? "—"} · paired {new Date(p.pairing_date).toLocaleDateString()}
                  </p>
                  <p className="mt-1 text-sm">
                    {p.clutches.length} clutch{p.clutches.length === 1 ? "" : "es"}
                    {incubating ? ` · ${incubating} incubating` : ""}
                    {hatched ? ` · ${hatched} hatched` : ""}
                  </p>
                  {next !== undefined && (
                    <p className="mt-1 text-xs font-medium text-brand-dark">
                      {next > 0 ? `Hatching in ~${next} days` : next === 0 ? "Hatching today" : `Hatch date passed ${-next} days ago`}
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted">
          No pairings yet. Record one below to start tracking clutches and hatchlings.
        </p>
      )}

      <form action={createPairing} className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
        <h2 className="text-lg font-semibold">New pairing</h2>
        {animals?.length ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                Male
                <select name="male_id" defaultValue="" className="field">
                  <option value="">Not mine / outside male</option>
                  {males.map((a) => (
                    <option key={a.id} value={a.id}>{label(a)}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Female
                <select name="female_id" defaultValue="" className="field">
                  <option value="">Not mine / outside female</option>
                  {females.map((a) => (
                    <option key={a.id} value={a.id}>{label(a)}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="flex flex-col gap-1 text-sm">
              Paired on
              <input name="pairing_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="field" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Notes
              <textarea name="notes" rows={2} maxLength={2000} placeholder="Locks observed, intro dates…" className="field" />
            </label>
            <button className="btn-primary self-start">Save pairing</button>
          </>
        ) : (
          <p className="text-sm text-muted">
            <Link href="/animals/new" className="text-brand hover:underline">Add your animals</Link> first, then pair them here.
          </p>
        )}
      </form>
    </section>
  );
}
