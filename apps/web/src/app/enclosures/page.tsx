import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fromC, fromCm, lengthUnit, round, tempUnit, unitSystemFor } from "@/lib/units";

export const metadata: Metadata = { title: "Enclosures | Reptilytics" };

export default async function EnclosuresPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: enclosures }, { data: profile }] = await Promise.all([
    supabase.from("enclosure_detail_view").select("*").eq("owner_id", user!.id).order("name"),
    supabase.from("profiles").select("unit_system, country").eq("id", user!.id).single(),
  ]);
  const u = unitSystemFor(profile);

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Enclosures</h1>
        <Link href="/enclosures/new" className="btn-primary">
          Add enclosure
        </Link>
      </div>
      {!enclosures?.length && (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted">
          No enclosures yet. Add one, then house your animals in it from their pages.
        </p>
      )}
      <ul className="grid gap-3 sm:grid-cols-2">
        {enclosures?.map((e) => (
          <li key={e.id}>
            <Link href={`/enclosures/${e.id}`} className="block rounded-lg border border-border bg-card p-4 transition hover:border-brand">
              <p className="font-semibold">{e.name}</p>
              <p className="text-sm text-muted">
                {[e.enclosure_type,
                  e.length_cm && e.width_cm && e.height_cm
                    ? `${round(fromCm(e.length_cm, u), 0)}×${round(fromCm(e.width_cm, u), 0)}×${round(fromCm(e.height_cm, u), 0)} ${lengthUnit(u)}`
                    : null,
                  `${e.animal_count ?? 0} animal${e.animal_count === 1 ? "" : "s"}`,
                ].filter(Boolean).join(" · ")}
              </p>
              {e.target_hot_temp_c !== null && (
                <p className="text-xs text-muted">
                  Target {round(fromC(e.target_hot_temp_c, u), 0)}
                  {e.target_cool_temp_c !== null ? `/${round(fromC(e.target_cool_temp_c, u), 0)}` : ""}
                  {tempUnit(u)}
                  {e.target_humidity_pct !== null ? ` · ${e.target_humidity_pct}% RH` : ""}
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
