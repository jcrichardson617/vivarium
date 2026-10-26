import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { AdminReadOnly } from "@/components/admin-read-only";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Animal | Reptilytics" };

type Ref = { id: string; name: string | null } | null;
type AnimalView = {
  animal: {
    id: string; name: string | null; sex: string | null; hatch_date: string | null; status: string; animal_code: string | null;
    visibility: string; feeding_interval_days: number | null; species: string | null; scientific: string | null;
    morph: string | null; sire: Ref; dam: Ref; acquired_date: string | null;
  };
  owner: { id: string; username: string } | null;
  enclosure: { id: string; name: string } | null;
  photos: { id: string; path: string; is_primary: boolean }[];
  feedings: { id: string; fed_at: string; feeder_type: string | null; feeder_size: string | null; quantity: number | null; accepted: boolean; notes: string | null }[];
  weights: { id: string; recorded_at: string; weight_grams: number; notes: string | null }[];
  lengths: { id: string; recorded_at: string; length_cm: number; notes: string | null }[];
  sheds: { id: string; shed_date: string; complete_shed: boolean; retained_eye_caps: boolean; retained_tail_tip: boolean; notes: string | null }[];
  health: { id: string; event_date: string; event_type: string | null; severity: string | null; notes: string | null }[];
  notes: { id: string; created_at: string; note_text: string }[];
} | null;

type TimelineItem = { key: string; at: string; title: string; detail: string | null };

export default async function AnimalAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: me } = await supabase.rpc("fn72_my_profile").single();
  if (me?.role !== "admin") notFound();

  const { data, error } = await supabase.rpc("fn81_admin_animal", { p_animal_id: id });
  const v = data as AnimalView;
  if (!error && !v) notFound();

  const signed = v?.photos.length
    ? (await supabase.storage.from("animal-photos").createSignedUrls(v.photos.map((p) => p.path), 3600)).data ?? []
    : [];
  const photoUrls = new Map(signed.map((s) => [s.path, s.signedUrl]));

  const a = v?.animal;
  const latestWeight = v?.weights[0];
  const latestFeeding = v?.feedings.find((f) => f.accepted);
  const latestShed = v?.sheds[0];
  const fmt = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString() : "—");
  const daysAgo = (d: string | null | undefined) =>
    d ? `${Math.max(0, Math.round((Date.now() - new Date(d).getTime()) / 86400000))} days ago` : "never";

  const timeline: TimelineItem[] = v
    ? [
        ...v.feedings.map((f) => ({
          key: `f-${f.id}`, at: f.fed_at, detail: f.notes,
          title: `${f.accepted ? "Fed" : "Refused"} ${f.quantity && f.quantity > 1 ? `${f.quantity} × ` : ""}${[f.feeder_size, f.feeder_type].filter(Boolean).join(" ")}`,
        })),
        ...v.weights.map((w) => ({ key: `w-${w.id}`, at: w.recorded_at, title: `Weighed ${w.weight_grams} g`, detail: w.notes })),
        ...v.lengths.map((l) => ({ key: `l-${l.id}`, at: l.recorded_at, title: `Measured ${l.length_cm} cm`, detail: l.notes })),
        ...v.sheds.map((s) => ({
          key: `s-${s.id}`, at: s.shed_date, detail: s.notes,
          title: `${s.complete_shed ? "Complete shed" : "Incomplete shed"}${s.retained_eye_caps ? " · retained eye caps" : ""}${s.retained_tail_tip ? " · retained tail tip" : ""}`,
        })),
        ...v.health.map((h) => ({ key: `h-${h.id}`, at: h.event_date, title: `${h.event_type ?? "Health event"}${h.severity ? ` (${h.severity})` : ""}`, detail: h.notes })),
        ...v.notes.map((n) => ({ key: `n-${n.id}`, at: n.created_at, title: "Note", detail: n.note_text })),
      ].sort((x, y) => y.at.localeCompare(x.at))
    : [];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <AdminNav current="/admin/users" />
        {v?.owner && (
          <Link href={`/admin/users/${v.owner.id}`} className="text-sm text-muted hover:text-foreground">← @{v.owner.username}&apos;s animals</Link>
        )}
        <h1 className="mt-2 text-3xl font-bold">{a?.name ?? "Unnamed"}</h1>
        <p className="text-muted">
          {a?.species ?? "Unknown species"}
          {a?.scientific && <span className="italic"> · {a.scientific}</span>}
          {a?.sex && a.sex !== "unknown" ? ` · ${a.sex}` : ""}
          {a?.morph && a.morph !== "Normal" ? ` · ${a.morph}` : ""}
        </p>
        <p className="mt-1 text-sm text-muted">
          Hatched {fmt(a?.hatch_date)} · Acquired {fmt(a?.acquired_date)}
          {a?.animal_code ? ` · ${a.animal_code}` : ""}
          {a && a.status !== "active" ? ` · ${a.status.replace("_", " ")}` : ""}
          {a?.visibility === "public" ? " · Public" : ""}
          {a?.feeding_interval_days ? ` · feeds every ${a.feeding_interval_days} days` : ""}
        </p>
        {(a?.sire || a?.dam) && (
          <p className="mt-1 text-sm text-muted">
            {a.sire && <>Sire: <Link href={`/admin/animals/${a.sire.id}`} className="text-brand hover:underline">{a.sire.name}</Link></>}
            {a.sire && a.dam && " · "}
            {a.dam && <>Dam: <Link href={`/admin/animals/${a.dam.id}`} className="text-brand hover:underline">{a.dam.name}</Link></>}
          </p>
        )}
        <AdminReadOnly username={v?.owner?.username} userId={v?.owner?.id} />
      </div>
      {error && <p className="rounded-md bg-red-500/10 p-3 text-sm text-red-600">{error.message}</p>}

      <section className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Last meal</p>
          <p className="mt-1 font-semibold">{daysAgo(latestFeeding?.fed_at)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Weight</p>
          <p className="mt-1 font-semibold">{latestWeight ? `${latestWeight.weight_grams} g` : "—"}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Last shed</p>
          <p className="mt-1 font-semibold">{daysAgo(latestShed?.shed_date)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Housed in</p>
          <p className="mt-1 font-semibold">
            {v?.enclosure ? (
              <Link href={`/admin/enclosures/${v.enclosure.id}`} className="text-brand hover:underline">{v.enclosure.name}</Link>
            ) : (
              "—"
            )}
          </p>
        </div>
      </section>

      {(v?.weights.length ?? 0) >= 2 && (
        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-2 font-semibold">Weight</h2>
          <WeightChart points={[...v!.weights].reverse().map((w) => ({ at: w.recorded_at, g: Number(w.weight_grams) }))} />
        </section>
      )}

      {!!v?.photos.length && (
        <section>
          <h2 className="mb-3 text-xl font-semibold">Photos</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {v.photos.map((p) => (
              <figure key={p.id} className="overflow-hidden rounded-lg border border-border bg-card">
                {/* Signed URLs from private storage; plain img avoids configuring remote image domains. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrls.get(p.path) ?? ""} alt={a?.name ?? "Animal photo"} className="aspect-square w-full object-cover" />
                {p.is_primary && <figcaption className="p-2 text-xs font-medium text-brand">Main photo</figcaption>}
              </figure>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-xl font-semibold">History</h2>
        {!timeline.length && <p className="text-muted">Nothing logged yet.</p>}
        <ol className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
          {timeline.map((item) => (
            <li key={item.key} className="flex items-start justify-between gap-3 p-3 text-sm">
              <div>
                <p className="font-medium">{item.title}</p>
                {item.detail && <p className="text-muted">{item.detail}</p>}
              </div>
              <time dateTime={item.at} className="shrink-0 text-muted">{fmt(item.at)}</time>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

// Weight over time, spaced by date. Each point has a title tooltip with its date and value.
function WeightChart({ points }: { points: { at: string; g: number }[] }) {
  const W = 600;
  const H = 160;
  const pad = 8;
  const times = points.map((p) => new Date(p.at).getTime());
  const t0 = Math.min(...times);
  const span = Math.max(1, Math.max(...times) - t0);
  const min = Math.min(...points.map((p) => p.g));
  const max = Math.max(...points.map((p) => p.g));
  const range = max - min || 1;
  const xy = points.map((p, i) => [pad + ((times[i] - t0) / span) * (W - 2 * pad), H - pad - ((p.g - min) / range) * (H - 2 * pad)]);
  const label = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-40 w-full" role="img" aria-label={`Weight from ${points[0].g} g to ${points[points.length - 1].g} g`}>
        <polyline points={xy.map((p) => p.join(",")).join(" ")} fill="none" strokeWidth={2} strokeLinejoin="round" className="stroke-brand" />
        {xy.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={4} className="fill-brand">
            <title>{`${new Date(points[i].at).toLocaleDateString()}: ${points[i].g} g`}</title>
          </circle>
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-xs text-muted">
        <span>{label(points[0].at)}</span>
        <span>{min.toLocaleString("en-US")}–{max.toLocaleString("en-US")} g</span>
        <span>{label(points[points.length - 1].at)}</span>
      </div>
    </div>
  );
}
