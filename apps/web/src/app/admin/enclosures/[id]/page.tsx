import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { AdminReadOnly } from "@/components/admin-read-only";
import { categoryLabel } from "@/lib/gear";
import { createClient } from "@/lib/supabase/server";
import { fromC, fromCm, lengthUnit, round, tempUnit, unitSystemFor } from "@/lib/units";

export const metadata: Metadata = { title: "Enclosure | Reptilytics" };

type EnclosureView = {
  enclosure: {
    id: string; name: string; enclosure_type: string | null; length_cm: number | null; width_cm: number | null; height_cm: number | null;
    substrate: string | null; heat_source: string | null; uvb_type: string | null; notes: string | null;
    target_basking_temp_c: number | null; target_hot_temp_c: number | null; target_cool_temp_c: number | null; target_humidity_pct: number | null;
  };
  owner: { id: string; username: string; unit_system: string | null } | null;
  housed: { id: string; name: string | null; since: string | null }[];
  gear: { id: string; name: string; category: string; blocked: boolean; note: string | null }[];
  readings: {
    id: string; recorded_at: string | null; temperature_basking_c: number | null; temperature_hot_c: number | null;
    temperature_cool_c: number | null; humidity_pct: number | null; uv_index: number | null; notes: string | null;
  }[];
} | null;

export default async function EnclosureAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: me } = await supabase.rpc("fn72_my_profile").single();
  if (me?.role !== "admin") notFound();

  const { data, error } = await supabase.rpc("fn82_admin_enclosure", { p_enclosure_id: id });
  const v = data as EnclosureView;
  if (!error && !v) notFound();

  // Your own units, so numbers read the same across every keeper you look at.
  const u = unitSystemFor(me);
  const T = tempUnit(u);
  const t = (c: number | null) => (c === null ? "—" : `${round(fromC(c, u))}${T}`);
  const e = v?.enclosure;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <AdminNav current="/admin/users" />
        {v?.owner && (
          <Link href={`/admin/users/${v.owner.id}`} className="text-sm text-muted hover:text-foreground">← @{v.owner.username}&apos;s enclosures</Link>
        )}
        <h1 className="mt-2 text-3xl font-bold">{e?.name}</h1>
        <p className="text-muted">
          {[e?.enclosure_type,
            e?.length_cm && e.width_cm && e.height_cm
              ? `${round(fromCm(e.length_cm, u))} × ${round(fromCm(e.width_cm, u))} × ${round(fromCm(e.height_cm, u))} ${lengthUnit(u)}`
              : null,
            e?.substrate, e?.heat_source, e?.uvb_type ? `UVB: ${e.uvb_type}` : null,
          ].filter(Boolean).join(" · ")}
        </p>
        {e?.notes && <p className="mt-1 text-sm text-muted">{e.notes}</p>}
        <AdminReadOnly username={v?.owner?.username} userId={v?.owner?.id} />
      </div>
      {error && <p className="rounded-md bg-red-500/10 p-3 text-sm text-red-600">{error.message}</p>}

      <section>
        <h2 className="mb-3 text-xl font-semibold">Housed here</h2>
        {!v?.housed.length && <p className="text-muted">No animals.</p>}
        <ul className="flex flex-wrap gap-2">
          {v?.housed.map((h) => (
            <li key={h.id}>
              <Link href={`/admin/animals/${h.id}`} className="btn-secondary inline-block text-sm">{h.name ?? "Unnamed"}</Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Gear</h2>
        {!v?.gear.length && <p className="text-muted">No gear listed.</p>}
        {!!v?.gear.length && (
          <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card text-sm">
            {v.gear.map((g) => (
              <li key={g.id} className="p-3">
                <p className="font-medium">{g.name}</p>
                <p className="text-xs text-muted">{categoryLabel(g.category)}</p>
                {g.blocked && <p className="mt-1 text-red-600">⚠️ Not recommended for safety reasons.</p>}
                {!g.blocked && g.note && <p className="mt-1 text-amber-700 dark:text-amber-400">⚠️ {g.note}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Targets</h2>
        <dl className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-card p-4 text-sm sm:grid-cols-4">
          <div><dt className="text-xs text-muted">Basking</dt><dd>{t(e?.target_basking_temp_c ?? null)}</dd></div>
          <div><dt className="text-xs text-muted">Hot side</dt><dd>{t(e?.target_hot_temp_c ?? null)}</dd></div>
          <div><dt className="text-xs text-muted">Cool side</dt><dd>{t(e?.target_cool_temp_c ?? null)}</dd></div>
          <div><dt className="text-xs text-muted">Humidity</dt><dd>{e?.target_humidity_pct == null ? "—" : `${e.target_humidity_pct}%`}</dd></div>
        </dl>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Readings</h2>
        {!v?.readings.length && <p className="text-muted">No readings yet.</p>}
        <ol className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
          {v?.readings.map((l) => (
            <li key={l.id} className="flex items-start justify-between gap-3 p-3 text-sm">
              <div>
                <p className="font-medium">
                  {l.temperature_basking_c !== null ? `Basking ${t(l.temperature_basking_c)} · ` : ""}
                  Hot {t(l.temperature_hot_c)} · Cool {t(l.temperature_cool_c)} · {l.humidity_pct === null ? "—" : `${l.humidity_pct}%`} RH
                  {l.uv_index !== null ? ` · UVI ${l.uv_index}` : ""}
                </p>
                {l.notes && <p className="text-muted">{l.notes}</p>}
              </div>
              <time className="shrink-0 text-muted">{l.recorded_at ? new Date(l.recorded_at).toLocaleString() : ""}</time>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
