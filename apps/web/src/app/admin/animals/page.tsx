import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Animals | Reptilytics" };

type Stats = {
  users: number;
  users_7d: number;
  users_30d: number;
  users_with_animals: number;
  active_keepers_30d: number;
  animals: number;
  animals_7d: number;
  animals_public: number;
  by_status: Record<string, number>;
  by_class: Record<string, number>;
  top_species: { name: string; scientific: string; animals: number; keepers: number }[];
  records: Record<string, number>;
  weekly: { week: string; users: number; animals: number }[];
};

const n = (v: number | undefined) => (v ?? 0).toLocaleString("en-US");

export default async function AnimalsAdminPage() {
  const supabase = await createClient();
  const { data: me } = await supabase.rpc("fn72_my_profile").single();
  if (me?.role !== "admin") notFound();

  const { data, error } = await supabase.rpc("fn78_admin_animal_stats");
  const s = (data ?? {}) as Stats;
  const r = s.records ?? {};
  const maxWeek = Math.max(1, ...(s.weekly ?? []).map((w) => Math.max(w.users, w.animals)));

  const tiles = [
    { label: "Users", value: n(s.users), sub: `${n(s.users_7d)} this week · ${n(s.users_30d)} in 30 days` },
    { label: "Keepers with animals", value: n(s.users_with_animals), sub: `${n(s.active_keepers_30d)} logged in the last 30 days` },
    { label: "Animals", value: n(s.animals), sub: `${n(s.animals_7d)} added this week · ${n(s.animals_public)} public` },
    { label: "Feedings", value: n(r.feedings), sub: `${n(r.feedings_30d)} in 30 days` },
    { label: "Weights", value: n(r.weights), sub: `${n(r.weights_30d)} in 30 days` },
    { label: "Sheds", value: n(r.sheds), sub: `${n(r.sheds_30d)} in 30 days` },
    { label: "Enclosures", value: n(r.enclosures), sub: `${n(r.environment_logs)} readings` },
    { label: "Breeding", value: n(r.pairings), sub: `pairings · ${n(r.clutches)} clutches` },
    { label: "Photos", value: n(r.photos), sub: "uploaded" },
  ];

  return (
    <section className="flex flex-col gap-8">
      <div>
        <AdminNav current="/admin/animals" />
        <h1 className="text-2xl font-bold">Animals</h1>
        <p className="text-muted">
          Totals across all keepers. To look at one keeper&apos;s animals, enclosures and logs, open them from{" "}
          <Link href="/admin/users" className="text-brand hover:underline">Users</Link>.
        </p>
      </div>
      {error && <p className="rounded-md bg-red-500/10 p-3 text-sm text-red-600">{error.message}</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted">{t.label}</p>
            <p className="mt-1 text-2xl font-semibold">{t.value}</p>
            <p className="text-xs text-muted">{t.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <section>
          <h2 className="mb-2 font-semibold">By status</h2>
          <ul className="divide-y divide-border rounded-lg border border-border bg-card text-sm">
            {Object.entries(s.by_status ?? {}).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
              <li key={k} className="flex justify-between px-4 py-2"><span className="capitalize">{k.replace(/_/g, " ")}</span><span>{n(v)}</span></li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="mb-2 font-semibold">Reptiles vs amphibians</h2>
          <ul className="divide-y divide-border rounded-lg border border-border bg-card text-sm">
            {Object.entries(s.by_class ?? {}).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
              <li key={k} className="flex justify-between px-4 py-2">
                <span>{k === "Reptilia" ? "Reptiles" : k === "Amphibia" ? "Amphibians" : k}</span><span>{n(v)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section>
        <h2 className="mb-2 font-semibold">Top species (active animals)</h2>
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="p-3">Species</th>
                <th className="p-3 text-right">Animals</th>
                <th className="p-3 text-right">Keepers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(s.top_species ?? []).map((t) => (
                <tr key={t.scientific}>
                  <td className="p-3">{t.name}{t.name !== t.scientific && <span className="ml-1 text-xs italic text-muted">{t.scientific}</span>}</td>
                  <td className="p-3 text-right">{n(t.animals)}</td>
                  <td className="p-3 text-right">{n(t.keepers)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">New users and animals per week</h2>
        <ul className="flex flex-col gap-1 rounded-lg border border-border bg-card p-4 text-sm">
          {(s.weekly ?? []).map((w) => (
            <li key={w.week} className="grid grid-cols-[5.5rem_1fr] items-center gap-3">
              <span className="text-xs text-muted">{new Date(w.week).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}</span>
              <span className="flex flex-col gap-0.5">
                <span className="flex items-center gap-2">
                  <span className="h-2 rounded bg-brand" style={{ width: `${(w.users / maxWeek) * 100}%`, minWidth: w.users ? 4 : 0 }} />
                  <span className="text-xs text-muted">{w.users} users</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2 rounded bg-amber-500" style={{ width: `${(w.animals / maxWeek) * 100}%`, minWidth: w.animals ? 4 : 0 }} />
                  <span className="text-xs text-muted">{w.animals} animals</span>
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
