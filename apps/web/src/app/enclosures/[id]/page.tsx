import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fromC, fromCm, lengthUnit, round, tempUnit, unitSystemFor } from "@/lib/units";
import { deleteEnvironmentLog, logEnvironment } from "../actions";

export const metadata: Metadata = { title: "Enclosure | Reptilytics" };

export default async function EnclosurePage({
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

  const [{ data: e }, { data: housed }, { data: logs }, { data: profile }] = await Promise.all([
    supabase.from("enclosures").select("*").eq("id", id).maybeSingle(),
    supabase.from("animal_enclosures").select("animal_id, start_date, animals(name)").eq("enclosure_id", id).is("end_date", null),
    supabase.from("environment_logs").select("*").eq("enclosure_id", id).order("recorded_at", { ascending: false }).limit(50),
    supabase.from("profiles").select("unit_system, country").eq("id", user!.id).single(),
  ]);
  if (!e) notFound();
  const u = unitSystemFor(profile);
  const T = tempUnit(u);
  const t = (v: number | null) => (v === null ? "—" : `${round(fromC(v, u))}${T}`);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/enclosures" className="text-sm text-muted hover:text-foreground">← Enclosures</Link>
        <h1 className="mt-2 text-3xl font-bold">{e.name}</h1>
        <p className="text-muted">
          {[e.enclosure_type,
            e.length_cm && e.width_cm && e.height_cm
              ? `${round(fromCm(e.length_cm, u))} × ${round(fromCm(e.width_cm, u))} × ${round(fromCm(e.height_cm, u))} ${lengthUnit(u)}`
              : null,
            e.substrate, e.heat_source, e.uvb_type ? `UVB: ${e.uvb_type}` : null,
          ].filter(Boolean).join(" · ")}
        </p>
        <p className="text-sm text-muted">
          Targets: hot {t(e.target_hot_temp_c)} · cool {t(e.target_cool_temp_c)} · humidity{" "}
          {e.target_humidity_pct === null ? "—" : `${e.target_humidity_pct}%`}
        </p>
      </div>

      {error && <p className="rounded-md bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}
      {saved && <p className="rounded-md bg-brand/10 p-3 text-sm text-brand-dark">{saved} ✓</p>}

      <section>
        <h2 className="mb-3 text-xl font-semibold">Housed here</h2>
        {!housed?.length && <p className="text-muted">No animals. Move one in from its animal page.</p>}
        <ul className="flex flex-wrap gap-2">
          {housed?.map((h) => (
            <li key={h.animal_id}>
              <Link href={`/animals/${h.animal_id}`} className="btn-secondary inline-block text-sm">
                {h.animals?.name ?? "Unnamed"}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Log a reading</h2>
        <form action={logEnvironment} className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-4">
          <input type="hidden" name="enclosure_id" value={id} />
          <input name="hot" type="number" step="0.1" placeholder={`Hot side ${T}`} className="field" />
          <input name="cool" type="number" step="0.1" placeholder={`Cool side ${T}`} className="field" />
          <input name="humidity" type="number" min={0} max={100} placeholder="Humidity %" className="field" />
          <input name="uv_index" type="number" step="0.1" min={0} placeholder="UV index" className="field" />
          <input name="notes" placeholder="Notes (optional)" className="field col-span-2 sm:col-span-3" />
          <button className="btn-primary">Save</button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Readings</h2>
        {!logs?.length && <p className="text-muted">No readings yet.</p>}
        <ol className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
          {logs?.map((l) => (
            <li key={l.id} className="flex items-start justify-between gap-3 p-3 text-sm">
              <div>
                <p className="font-medium">
                  Hot {t(l.temperature_hot_c)} · Cool {t(l.temperature_cool_c)} · {l.humidity_pct === null ? "—" : `${l.humidity_pct}%`} RH
                  {l.uv_index !== null ? ` · UVI ${l.uv_index}` : ""}
                </p>
                {l.notes && <p className="text-muted">{l.notes}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-3 text-muted">
                <time>{l.recorded_at ? new Date(l.recorded_at).toLocaleString() : ""}</time>
                <form action={deleteEnvironmentLog}>
                  <input type="hidden" name="enclosure_id" value={id} />
                  <input type="hidden" name="id" value={l.id} />
                  <button aria-label="Delete reading" className="hover:text-red-600">✕</button>
                </form>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
