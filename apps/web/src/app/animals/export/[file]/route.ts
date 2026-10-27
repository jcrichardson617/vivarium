import { toCsv } from "@/lib/csv";
import type { Database } from "@/lib/database.types";
import { fetchAll } from "@/lib/supabase/fetch-all";
import { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;
type MyAnimal = Database["public"]["Functions"]["fn67_my_animals"]["Returns"][number];
type Cell = string | number | boolean | null;

// One CSV per record type, for every animal the keeper currently owns
// (animals shared with them are left out). Weights are grams, lengths cm,
// times ISO 8601 UTC, so the files read back the same anywhere.
const LOGS = {
  feedings: {
    table: "feedings",
    columns: "animal_id, fed_at, feeder_type, feeder_size, quantity, accepted, notes",
    order: "fed_at",
    header: ["fed_at", "feeder_type", "feeder_size", "quantity", "accepted", "notes"],
  },
  weights: {
    table: "weight_logs",
    columns: "animal_id, recorded_at, weight_grams, notes",
    order: "recorded_at",
    header: ["recorded_at", "weight_g", "notes"],
  },
  lengths: {
    table: "length_logs",
    columns: "animal_id, recorded_at, length_cm, notes",
    order: "recorded_at",
    header: ["recorded_at", "length_cm", "notes"],
  },
  sheds: {
    table: "sheds",
    columns: "animal_id, shed_date, complete_shed, retained_eye_caps, retained_tail_tip, notes",
    order: "shed_date",
    header: ["shed_date", "complete_shed", "retained_eye_caps", "retained_tail_tip", "notes"],
  },
  health: {
    table: "health_events",
    columns: "animal_id, event_date, event_type, severity, notes",
    order: "event_date",
    header: ["event_date", "event_type", "severity", "notes"],
  },
  notes: {
    table: "animal_notes",
    columns: "animal_id, created_at, note_type, note_text",
    order: "created_at",
    header: ["created_at", "note_type", "note_text"],
  },
} as const;

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const name = (await params).file.replace(/\.csv$/, "");
  if (name !== "animals" && !(name in LOGS)) return new Response("Not found", { status: 404 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Sign in to export", { status: 401 });

  const { data: mine, error } = await supabase.rpc("fn67_my_animals");
  if (error) return new Response("Export failed", { status: 500 });
  const owned = (mine ?? []).filter((a) => a.access === "owner");

  let csv: string;
  try {
    csv = name === "animals" ? await animalsCsv(supabase, owned) : await logCsv(supabase, owned, LOGS[name as keyof typeof LOGS]);
  } catch {
    return new Response("Export failed", { status: 500 });
  }

  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reptilytics-${name}-${date}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}

async function animalsCsv(supabase: Supabase, owned: MyAnimal[]) {
  const ids = owned.map((a) => a.id);
  const [parents, acquisitions] = await Promise.all([
    fetchAll<{ id: string; sire_id: string | null; dam_id: string | null }>(supabase, "animals", "id, sire_id, dam_id", ids, "id", "id"),
    fetchAll<{ animal_id: string; acquired_date: string | null; source_name: string | null; source_type: string | null; price: number | null; currency: string | null }>(
      supabase, "animal_acquisitions", "animal_id, acquired_date, source_name, source_type, price, currency", ids, "animal_id", "animal_id",
    ),
  ]);
  const parentOf = new Map(parents.map((p) => [p.id, p]));
  const acqOf = new Map(acquisitions.map((a) => [a.animal_id, a]));
  const label = new Map(owned.map((a) => [a.id, a.name ?? a.animal_code ?? a.id]));
  const sorted = [...owned].sort((x, y) => (x.name ?? "").localeCompare(y.name ?? "", undefined, { numeric: true }));

  return toCsv(
    ["animal_id", "animal_code", "name", "species", "scientific_name", "sex", "hatch_date", "status", "morph", "enclosure", "tags",
      "feeding_interval_days", "sire", "dam", "acquired_date", "source", "source_type", "price", "currency", "added_at"],
    sorted.map((a) => {
      const p = parentOf.get(a.id);
      const acq = acqOf.get(a.id);
      // Parents the keeper doesn't own still export by id so the link isn't lost.
      const parent = (id: string | null | undefined) => (id ? label.get(id) ?? id : null);
      return [a.id, a.animal_code, a.name, a.species_common_name ?? a.pending_species, a.species_scientific_name, a.sex, a.hatch_date, a.status,
        a.morph, a.enclosure_name, (a.tags ?? []).join("; "), a.feeding_interval_days, parent(p?.sire_id), parent(p?.dam_id),
        acq?.acquired_date, acq?.source_name, acq?.source_type, acq?.price, acq?.currency, a.created_at];
    }),
  );
}

async function logCsv(supabase: Supabase, owned: MyAnimal[], spec: (typeof LOGS)[keyof typeof LOGS]) {
  const byId = new Map(owned.map((a) => [a.id, a]));
  const rows = await fetchAll<Record<string, Cell>>(supabase, spec.table, spec.columns, owned.map((a) => a.id), "animal_id", spec.order);
  const fields = spec.columns.split(", ").slice(1);
  rows.sort((x, y) => String(x[spec.order]).localeCompare(String(y[spec.order])));
  return toCsv(
    ["animal_id", "animal_code", "animal_name", ...spec.header],
    rows.map((r) => {
      const a = byId.get(r.animal_id as string);
      return [r.animal_id, a?.animal_code ?? null, a?.name ?? null, ...fields.map((f) => r[f])];
    }),
  );
}
