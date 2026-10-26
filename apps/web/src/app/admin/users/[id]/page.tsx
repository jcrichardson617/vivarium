import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { AdminReadOnly } from "@/components/admin-read-only";
import { FeedingChart } from "@/components/feeding-chart";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Keeper | Reptilytics" };

type Keeper = {
  profile: { id: string; username: string; display_name: string | null; joined: string; country: string | null } | null;
  animals: {
    id: string; name: string | null; sex: string | null; hatch_date: string | null; status: string; animal_code: string | null;
    visibility: string; tags: string[] | null; species: string | null; scientific: string | null; morph: string | null;
    last_fed_at: string | null; latest_weight_g: number | null; enclosure_id: string | null; enclosure_name: string | null;
    photo_path: string | null;
  }[];
  enclosures: { id: string; name: string; enclosure_type: string | null; animals: number; readings: number; last_reading: string | null }[];
  pairings: {
    id: string; pairing_date: string; notes: string | null; male: string | null; female: string | null; species: string | null;
    clutches: number; incubating: number; hatched: number;
  }[];
  feeding_days: { day: string; fed: number; refused: number }[];
};

const day = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—");
const daysAgo = (d: string | null) => (d ? `${Math.max(0, Math.round((Date.now() - new Date(d).getTime()) / 86400000))}d ago` : "never");

export default async function KeeperAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: me } = await supabase.rpc("fn72_my_profile").single();
  if (me?.role !== "admin") notFound();

  const { data, error } = await supabase.rpc("fn80_admin_keeper", { p_user_id: id });
  const k = data as Keeper | null;
  if (!error && !k?.profile) notFound();

  const paths = (k?.animals ?? []).filter((a) => a.photo_path).map((a) => a.photo_path!);
  const { data: signed } = paths.length
    ? await supabase.storage.from("animal-photos").createSignedUrls(paths, 3600)
    : { data: [] };
  const urlByPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));
  const active = (k?.animals ?? []).filter((a) => a.status === "active").length;

  return (
    <section className="flex flex-col gap-8">
      <div>
        <AdminNav current="/admin/users" />
        <Link href="/admin/users" className="text-sm text-muted hover:text-foreground">← Users</Link>
        <h1 className="mt-2 text-2xl font-bold">@{k?.profile?.username}</h1>
        <p className="text-muted">
          {k?.profile?.display_name && k.profile.display_name !== k.profile.username ? `${k.profile.display_name} · ` : ""}
          Joined {day(k?.profile?.joined ?? null)} · {active} active animal{active === 1 ? "" : "s"} · {k?.enclosures.length ?? 0} enclosures ·{" "}
          <Link href={`/u/${k?.profile?.username}`} className="text-brand hover:underline">Public profile</Link>
        </p>
        <AdminReadOnly username={k?.profile?.username} />
      </div>
      {error && <p className="rounded-md bg-red-500/10 p-3 text-sm text-red-600">{error.message}</p>}

      {k && (
        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-2 font-semibold">Feedings, last 30 days</h2>
          <FeedingChart days={k.feeding_days} />
        </section>
      )}

      <section>
        <h2 className="mb-3 text-xl font-semibold">Animals</h2>
        {!k?.animals.length && <p className="text-muted">No animals.</p>}
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {k?.animals.map((a) => (
            <li key={a.id}>
              <Link href={`/admin/animals/${a.id}`} className="block overflow-hidden rounded-lg border border-border bg-card transition hover:border-brand">
                {a.photo_path && urlByPath.get(a.photo_path) ? (
                  // Signed URLs from private storage; plain img avoids configuring remote image domains.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={urlByPath.get(a.photo_path) ?? ""} alt={a.name ?? "Animal photo"} className="aspect-square w-full object-cover" />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center bg-brand/5 text-3xl" aria-hidden>🦎</div>
                )}
                <div className="p-3 text-sm">
                  <p className="font-semibold">
                    {a.name ?? "Unnamed"}
                    {a.status !== "active" && <span className="ml-1 text-xs font-normal uppercase text-muted">{a.status.replace("_", " ")}</span>}
                  </p>
                  <p className="text-xs text-muted">
                    {a.species ?? "Unknown species"}
                    {a.morph && a.morph !== "Normal" ? ` · ${a.morph}` : ""}
                    {a.sex && a.sex !== "unknown" ? ` · ${a.sex}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Fed {daysAgo(a.last_fed_at)}
                    {a.latest_weight_g !== null ? ` · ${Number(a.latest_weight_g).toLocaleString("en-US")} g` : ""}
                    {a.enclosure_name ? ` · ${a.enclosure_name}` : ""}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Enclosures</h2>
        {!k?.enclosures.length && <p className="text-muted">No enclosures.</p>}
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card text-sm">
          {k?.enclosures.map((e) => (
            <li key={e.id}>
              <Link href={`/admin/enclosures/${e.id}`} className="flex flex-wrap items-center justify-between gap-2 p-3 hover:bg-brand/5">
                <span>
                  <span className="font-medium">{e.name}</span>
                  {e.enclosure_type && <span className="ml-2 text-xs text-muted">{e.enclosure_type}</span>}
                </span>
                <span className="text-xs text-muted">
                  {e.animals} housed · {e.readings} readings{e.last_reading ? ` · last ${day(e.last_reading)}` : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Breeding</h2>
        {!k?.pairings.length && <p className="text-muted">No pairings.</p>}
        <ul className="grid gap-3 sm:grid-cols-2">
          {k?.pairings.map((p) => (
            <li key={p.id} className="rounded-lg border border-border bg-card p-4 text-sm">
              <p className="font-semibold">
                {p.male ?? "Outside male"} <span className="text-muted">×</span> {p.female ?? "Outside female"}
              </p>
              <p className="text-muted">{p.species ?? "—"} · paired {day(p.pairing_date)}</p>
              <p className="mt-1">
                {p.clutches} clutch{p.clutches === 1 ? "" : "es"}
                {p.incubating ? ` · ${p.incubating} incubating` : ""}
                {p.hatched ? ` · ${p.hatched} hatched` : ""}
              </p>
              {p.notes && <p className="mt-1 text-muted">{p.notes}</p>}
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
