import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { createClient } from "@/lib/supabase/server";
import { saveGene } from "./actions";

export const metadata: Metadata = { title: "Genes | Reptilytics" };

const INHERITANCE = [
  { value: "recessive", label: "Recessive" },
  { value: "incomplete_dominant", label: "Incomplete dominant" },
  { value: "dominant", label: "Dominant" },
  { value: "polygenic", label: "Polygenic (line-bred)" },
];

export default async function GenesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ species?: string; all?: string; error?: string; saved?: string }>;
}) {
  const { species, all, error, saved } = await searchParams;
  const supabase = await createClient();
  const { data: me } = await supabase.rpc("fn72_my_profile").single();
  if (!me || !["moderator", "admin"].includes(me.role)) notFound();

  const { data: genes } = await supabase
    .from("genes")
    .select("*, species(common_name, scientific_name)")
    .order("name");
  const bySpecies = new Map<string, { name: string; total: number; unverified: number }>();
  for (const g of genes ?? []) {
    const s = bySpecies.get(g.species_id) ?? { name: g.species?.common_name ?? g.species?.scientific_name ?? "Unknown", total: 0, unverified: 0 };
    s.total++;
    if (!g.verified) s.unverified++;
    bySpecies.set(g.species_id, s);
  }
  const speciesList = [...bySpecies.entries()].sort((a, b) => a[1].name.localeCompare(b[1].name));
  const shown = (genes ?? []).filter((g) => (!species || g.species_id === species) && (all || !g.verified));
  const returnTo = new URLSearchParams({ ...(species ? { species } : {}), ...(all ? { all } : {}) }).toString();
  const link = (params: Record<string, string | undefined>) => {
    const qs = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => !!e[1])).toString();
    return qs ? `/admin/genes?${qs}` : "/admin/genes";
  };

  return (
    <section className="flex flex-col gap-6">
      <div>
        <AdminNav current="/admin/genes" />
        <h1 className="text-2xl font-bold">Genes</h1>
        <p className="text-muted">
          Check each seeded morph gene, fix anything wrong and mark it verified. Unverified genes show a
          &quot;hasn&apos;t been reviewed yet&quot; line on their morph page.
        </p>
      </div>
      {error && <p className="rounded-md bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}
      {saved && <p className="rounded-md bg-brand/10 p-3 text-sm text-brand-dark">Saved ✓</p>}
      <form className="flex flex-wrap items-center gap-3 text-sm">
        <select name="species" defaultValue={species ?? ""} className="field py-1" aria-label="Species">
          <option value="">All species</option>
          {speciesList.map(([id, s]) => (
            <option key={id} value={id}>
              {s.name} ({s.total - s.unverified}/{s.total} verified)
            </option>
          ))}
        </select>
        {all && <input type="hidden" name="all" value="1" />}
        <button className="btn-secondary py-1 text-sm">Show</button>
        {all ? (
          <a href={link({ species })} className="text-brand hover:underline">Show only unverified</a>
        ) : (
          <a href={link({ species, all: "1" })} className="text-brand hover:underline">Show verified too</a>
        )}
      </form>
      {!shown.length && (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted">Nothing left to verify here.</p>
      )}
      <ul className="flex flex-col gap-4">
        {shown.map((g) => (
          <li key={g.id} className="rounded-lg border border-border bg-card p-4 text-sm">
            <p className="mb-2 text-xs text-muted">
              {bySpecies.get(g.species_id)?.name}
              {g.verified ? " · verified ✓" : " · not verified"}
            </p>
            <form action={saveGene} className="grid gap-2 sm:grid-cols-2">
              <input type="hidden" name="id" value={g.id} />
              <input type="hidden" name="return" value={returnTo} />
              <input name="name" defaultValue={g.name} required className="field font-semibold" aria-label="Name" />
              <select name="inheritance" defaultValue={g.inheritance} className="field" aria-label="Inheritance">
                {INHERITANCE.map((i) => (
                  <option key={i.value} value={i.value}>{i.label}</option>
                ))}
              </select>
              <input name="allelic_group" defaultValue={g.allelic_group ?? ""} placeholder="Allelic group (e.g. BEL complex)" className="field" />
              <input name="super_name" defaultValue={g.super_name ?? ""} placeholder="Super form name" className="field" />
              <input name="aliases" defaultValue={g.aliases.join(", ")} placeholder="Aliases, comma separated" className="field sm:col-span-2" />
              <textarea name="notes" defaultValue={g.notes ?? ""} placeholder="Notes" rows={2} className="field sm:col-span-2" />
              <input name="health_note" defaultValue={g.health_note ?? ""} placeholder="Health note" className="field" />
              <input name="super_health_note" defaultValue={g.super_health_note ?? ""} placeholder="Super form health note" className="field" />
              <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="super_lethal" defaultChecked={g.super_lethal} /> Super is lethal
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="active" defaultChecked={g.active} /> Active
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="verified" defaultChecked={g.verified} /> Verified
                </label>
              </div>
              <div className="flex gap-2 sm:col-span-2">
                {!g.verified && (
                  <button name="verify" value="1" className="btn-primary">Save &amp; verify</button>
                )}
                <button className="btn-secondary">Save</button>
              </div>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}
