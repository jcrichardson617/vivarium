"use server";

import { revalidatePath } from "next/cache";
import { parseCsv } from "@/lib/csv";
import { parseBool, parseDate, parsePositive, parseSex, parseStatus, readTable, type Kind, type Table } from "@/lib/import";
import { fetchAll } from "@/lib/supabase/fetch-all";
import { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type FileReport = { file: string; kind: Kind | null; imported: number; skipped: number; problems: string[] };
export type ImportResult = { dryRun: boolean; files: FileReport[]; error?: string } | null;

const MAX_BYTES = 4 * 1024 * 1024;
const MAX_ROWS = 20000;
const MAX_PROBLEMS = 25;

// An animal the rows can point at. New animals get their id once created;
// on a dry run they keep a placeholder.
type Ref = { id: string; label: string };

// The keeper's animals by id, code and name, so log rows can find them.
// A code or name shared by two animals is ambiguous and matches neither.
class Animals {
  byId = new Map<string, Ref>();
  private byCode = new Map<string, Ref | "ambiguous">();
  private byName = new Map<string, Ref | "ambiguous">();

  add(ref: Ref, code: string | null, name: string | null) {
    this.byId.set(ref.id, ref);
    const put = (m: Map<string, Ref | "ambiguous">, k: string | null) => {
      if (!k) return;
      const key = k.toLowerCase();
      m.set(key, m.has(key) && m.get(key) !== ref ? "ambiguous" : ref);
    };
    put(this.byCode, code);
    put(this.byName, name);
  }

  // By id, then code, then name (a name column may hold codes too).
  find(id: string, code: string, name: string): Ref | "ambiguous" | null {
    if (id && this.byId.has(id)) return this.byId.get(id)!;
    const byCode = code ? this.byCode.get(code.toLowerCase()) : undefined;
    if (byCode) return byCode;
    return name ? this.byName.get(name.toLowerCase()) ?? this.byCode.get(name.toLowerCase()) ?? null : null;
  }

  // For an animal row: is this one already in the collection?
  exists(id: string, code: string, name: string) {
    if (id && this.byId.has(id)) return true;
    if (code) return this.byCode.has(code.toLowerCase());
    return !!name && this.byName.has(name.toLowerCase());
  }
}

export async function importCsv(_prev: ImportResult, formData: FormData): Promise<ImportResult> {
  const dryRun = formData.get("mode") !== "import";
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { dryRun, files: [], error: "Choose one or more CSV files." };
  if (files.reduce((n, f) => n + f.size, 0) > MAX_BYTES) return { dryRun, files: [], error: "Files are over 4 MB in total. Split them up and import in parts." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { dryRun, files: [], error: "Sign in to import." };

  const { data: mine, error } = await supabase.rpc("fn67_my_animals");
  if (error) return { dryRun, files: [], error: error.message };
  const animals = new Animals();
  for (const a of mine ?? []) if (a.access === "owner") animals.add({ id: a.id, label: a.name ?? a.animal_code ?? "Unnamed" }, a.animal_code, a.name);

  // Animals first, so log files in the same upload can refer to them.
  const parsed = await Promise.all(
    files.map(async (f) => ({ name: f.name, table: readTable(parseCsv(await f.text())) })),
  );
  parsed.sort((x, y) => Number(y.table.kind === "animals") - Number(x.table.kind === "animals"));

  const reports: FileReport[] = [];
  for (const { name, table } of parsed) {
    const report: FileReport = { file: name, kind: table.kind, imported: 0, skipped: 0, problems: [] };
    reports.push(report);
    if (!table.kind) {
      report.problems.push("Couldn't tell what this file holds. It needs a species column for animals, or a column like fed_at, weight_g, length_cm, shed_date, event_type or note_text for logs.");
      continue;
    }
    if (table.rows.length > MAX_ROWS) {
      report.problems.push(`This file has ${table.rows.length} rows; the limit is ${MAX_ROWS}. Split it up.`);
      continue;
    }
    try {
      if (table.kind === "animals") await importAnimals(supabase, user.id, table, animals, report, dryRun);
      else await importLogs(supabase, table.kind, table, animals, report, dryRun);
    } catch (e) {
      report.problems.push(`Stopped early: ${e instanceof Error ? e.message : "unexpected error"}.`);
    }
    if (report.problems.length > MAX_PROBLEMS) {
      const extra = report.problems.length - MAX_PROBLEMS;
      report.problems = [...report.problems.slice(0, MAX_PROBLEMS), `…and ${extra} more.`];
    }
  }

  if (!dryRun) revalidatePath("/animals");
  return { dryRun, files: reports };
}

async function importAnimals(supabase: Supabase, userId: string, t: Table, animals: Animals, report: FileReport, dryRun: boolean) {
  const [{ data: species }, { data: synonyms }] = await Promise.all([
    supabase.from("species").select("id, common_name, scientific_name").eq("active", true),
    supabase.from("species_synonyms").select("species_id, synonym_name"),
  ]);
  const speciesId = new Map<string, string>();
  for (const s of synonyms ?? []) speciesId.set(s.synonym_name.toLowerCase(), s.species_id);
  for (const s of species ?? []) {
    if (s.common_name) speciesId.set(s.common_name.toLowerCase(), s.id);
    speciesId.set(s.scientific_name.toLowerCase(), s.id);
  }

  type Plan = { line: number; ref: Ref; code: string; name: string; species: string; sex: string; hatch: string | null; row: string[] };
  const plans: Plan[] = [];
  t.rows.forEach((row, i) => {
    const line = i + 2;
    const name = t.get(row, "name") || t.get(row, "animal_name");
    const code = t.get(row, "animal_code");
    const skip = (why: string) => {
      report.skipped++;
      report.problems.push(`Row ${line}: ${why}`);
    };
    if (!name && !code) return skip("no name or code.");
    if (animals.exists(t.get(row, "animal_id"), code, name)) return skip(`${name || code} is already in your collection.`);
    const sci = t.get(row, "scientific_name");
    const common = t.get(row, "species");
    const sp = speciesId.get(sci.toLowerCase()) ?? speciesId.get(common.toLowerCase());
    if (!sp) return skip(`species "${sci || common || "(blank)"}" isn't in our list. Add this animal by hand to request it.`);
    const hatch = parseDate(t.get(row, "hatch_date"));
    if (hatch === "invalid") return skip(`hatch date "${t.get(row, "hatch_date")}" isn't a date we can read (use 2024-06-30).`);
    const ref = { id: `new-${line}`, label: name || code };
    animals.add(ref, code || null, name || null);
    plans.push({ line, ref, code, name, species: sp, sex: parseSex(t.get(row, "sex")), hatch, row });
  });

  // Create each animal and its details, ten at a time.
  const parents: { ref: Ref; line: number; sire: string; dam: string }[] = [];
  await inBatches(plans, 10, async (p) => {
    const g = (f: string) => t.get(p.row, f);
    const status = g("status") ? parseStatus(g("status")) : "active";
    if (!status) report.problems.push(`Row ${p.line}: status "${g("status")}" isn't one we use, so ${p.ref.label} was imported as active.`);
    const interval = parsePositive(g("feeding_interval_days"));
    const acquired = parseDate(g("acquired_date"));
    const price = g("price") ? Number(g("price").replace(/[^0-9.]/g, "")) : null;
    const tags = g("tags").split(/[;,]/).map((x) => x.trim()).filter(Boolean);
    const morph = g("morph");

    if (!dryRun) {
      const { data: id, error } = await supabase.rpc("fn19_create_animal", {
        p_species_id: p.species,
        p_name: p.name || p.code,
        p_sex: p.sex,
        p_hatch_date: p.hatch ? p.hatch.slice(0, 10) : undefined,
      });
      if (error || !id) {
        report.skipped++;
        report.problems.push(`Row ${p.line}: ${error?.message ?? "couldn't create the animal"}.`);
        return;
      }
      p.ref.id = id;
      const extra = {
        ...(p.code ? { animal_code: p.code } : {}),
        ...(status && status !== "active" ? { status } : {}),
        ...(interval && Number.isInteger(interval) ? { feeding_interval_days: interval } : {}),
      };
      const writes = [
        Object.keys(extra).length ? supabase.from("animals").update(extra).eq("id", id) : null,
        (acquired && acquired !== "invalid") || g("source") || price
          ? supabase.from("animal_acquisitions").insert({
              animal_id: id,
              user_id: userId,
              acquired_date: acquired && acquired !== "invalid" ? acquired.slice(0, 10) : null,
              source_name: g("source") || null,
              source_type: g("source_type") || null,
              price: price && Number.isFinite(price) ? price : null,
              currency: g("currency") || null,
            })
          : null,
        tags.length ? supabase.rpc("fn58_set_animal_tags", { p_animal_id: id, p_tags: tags }) : null,
        // Genes are structured, so a morph name can't be mapped to them; keep it as a note.
        morph && morph.toLowerCase() !== "normal"
          ? supabase.from("animal_notes").insert({ animal_id: id, note_type: "general", note_text: `Imported morph: ${morph}` })
          : null,
      ];
      const results = await Promise.all(writes.map((w) => w ?? Promise.resolve({ error: null })));
      const failed = results.find((r) => r.error);
      if (failed?.error) report.problems.push(`Row ${p.line}: ${p.ref.label} was added, but some details weren't saved (${failed.error.message}).`);
    }
    if (acquired === "invalid") report.problems.push(`Row ${p.line}: acquired date "${g("acquired_date")}" wasn't readable, so it was left blank.`);
    report.imported++;
    if (g("sire") || g("dam")) parents.push({ ref: p.ref, line: p.line, sire: g("sire"), dam: g("dam") });
  });

  // Parents last, since they may be other rows of the same file.
  await inBatches(parents, 10, async (p) => {
    const find = (label: string) => {
      if (!label) return null;
      const r = animals.find(label, label, label);
      if (r && r !== "ambiguous" && (dryRun || !r.id.startsWith("new-"))) return r;
      report.problems.push(`Row ${p.line}: parent "${label}" of ${p.ref.label} isn't one of your animals, so it was left blank.`);
      return null;
    };
    const sire = find(p.sire);
    const dam = find(p.dam);
    if (dryRun || p.ref.id.startsWith("new-") || (!sire && !dam)) return;
    const { error } = await supabase
      .from("animals")
      .update({ ...(sire ? { sire_id: sire.id } : {}), ...(dam ? { dam_id: dam.id } : {}) })
      .eq("id", p.ref.id);
    if (error) report.problems.push(`Row ${p.line}: parents of ${p.ref.label} weren't saved (${error.message}).`);
  });
}

// Per kind: the table, its date column, and how a CSV row becomes a record.
// Rows already logged (same animal and time; for notes, same text) are skipped,
// so importing the same file twice doesn't double up.
const LOGS: Record<Exclude<Kind, "animals">, {
  table: string;
  date: string;
  dateFields: string[];
  key?: string;
  build: (get: (f: string) => string) => Record<string, unknown> | string;
}> = {
  feedings: {
    table: "feedings",
    date: "fed_at",
    dateFields: ["fed_at", "date"],
    build: (g) => ({
      feeder_type: g("feeder_type") || "Other",
      feeder_size: g("feeder_size") || null,
      quantity: Number.isInteger(Number(g("quantity"))) && Number(g("quantity")) > 0 ? Number(g("quantity")) : 1,
      accepted: g("accepted") ? parseBool(g("accepted"), true) : !parseBool(g("refused"), false),
      notes: g("notes") || null,
    }),
  },
  weights: {
    table: "weight_logs",
    date: "recorded_at",
    dateFields: ["recorded_at", "date"],
    build: (g) => {
      const w = parsePositive(g("weight_g"));
      return w && !Number.isNaN(w) ? { weight_grams: Math.round(w * 100) / 100, notes: g("notes") || null } : `weight "${g("weight_g")}" isn't a positive number of grams.`;
    },
  },
  lengths: {
    table: "length_logs",
    date: "recorded_at",
    dateFields: ["recorded_at", "date"],
    build: (g) => {
      const l = parsePositive(g("length_cm"));
      return l && !Number.isNaN(l) ? { length_cm: l, notes: g("notes") || null } : `length "${g("length_cm")}" isn't a positive number of cm.`;
    },
  },
  sheds: {
    table: "sheds",
    date: "shed_date",
    dateFields: ["shed_date", "date"],
    build: (g) => ({
      complete_shed: parseBool(g("complete_shed"), true),
      retained_eye_caps: parseBool(g("retained_eye_caps"), false),
      retained_tail_tip: parseBool(g("retained_tail_tip"), false),
      notes: g("notes") || null,
    }),
  },
  health: {
    table: "health_events",
    date: "event_date",
    dateFields: ["event_date", "date"],
    build: (g) => ({ event_type: g("event_type") || "Other", severity: g("severity") || null, notes: g("notes") || null }),
  },
  notes: {
    table: "animal_notes",
    date: "created_at",
    dateFields: ["created_at", "date"],
    key: "note_text",
    build: (g) => (g("note_text") ? { note_text: g("note_text"), note_type: g("note_type") || "general" } : "the note is empty."),
  },
};

async function importLogs(supabase: Supabase, kind: Exclude<Kind, "animals">, t: Table, animals: Animals, report: FileReport, dryRun: boolean) {
  const spec = LOGS[kind];
  const skip = (line: number, why: string) => {
    report.skipped++;
    report.problems.push(`Row ${line}: ${why}`);
  };

  type Row = { line: number; ref: Ref; at: string | null; record: Record<string, unknown> };
  const rows: Row[] = [];
  t.rows.forEach((row, i) => {
    const line = i + 2;
    const g = (f: string) => t.get(row, f);
    const who = g("animal_name") || g("name");
    const ref = animals.find(g("animal_id"), g("animal_code"), who);
    if (ref === "ambiguous") return skip(line, `more than one of your animals is called "${g("animal_code") || who}". Add an animal_code column to tell them apart.`);
    if (!ref) return skip(line, `no animal "${g("animal_code") || who || g("animal_id") || "(blank)"}" in your collection.`);
    const rawDate = spec.dateFields.map(g).find(Boolean) ?? "";
    const at = parseDate(rawDate);
    if (at === "invalid") return skip(line, `date "${rawDate}" isn't a date we can read, or it's in the future.`);
    if (!at && kind !== "notes") return skip(line, "no date.");
    const record = spec.build(g);
    if (typeof record === "string") return skip(line, record);
    rows.push({ line, ref, at, record });
  });

  // What's already logged for these animals, to skip repeats.
  const keyOf = (animalId: string, at: string | null, rec: Record<string, unknown>) =>
    spec.key ? `${animalId}|${String(rec[spec.key]).trim()}` : `${animalId}|${at ? Date.parse(at) : ""}`;
  const known = [...new Set(rows.map((r) => r.ref.id).filter((id) => !id.startsWith("new-")))];
  const existing = await fetchAll<Record<string, string>>(
    supabase, spec.table, `id, animal_id, ${spec.date}${spec.key ? `, ${spec.key}` : ""}`, known, "animal_id", spec.date,
  );
  const seen = new Set(existing.map((e) => keyOf(e.animal_id, e[spec.date], e)));

  const toInsert: Row[] = [];
  for (const r of rows) {
    const k = keyOf(r.ref.id, r.at, r.record);
    if (seen.has(k)) {
      report.skipped++;
      continue;
    }
    seen.add(k);
    toInsert.push(r);
  }
  const repeats = rows.length - toInsert.length;
  if (repeats) report.problems.push(`${repeats} row${repeats === 1 ? " was" : "s were"} already logged and skipped.`);

  if (dryRun) {
    report.imported += toInsert.length;
    return;
  }
  // Rows for animals in this upload that couldn't be created.
  const ready = toInsert.filter((r) => {
    if (!r.ref.id.startsWith("new-")) return true;
    skip(r.line, `${r.ref.label} wasn't created, so this row was skipped.`);
    return false;
  });
  for (let i = 0; i < ready.length; i += 500) {
    const chunk = ready.slice(i, i + 500);
    const { error } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table comes from the fixed LOGS list
      .from(spec.table as any)
      .insert(chunk.map((r) => ({ animal_id: r.ref.id, ...(r.at ? { [spec.date]: r.at } : {}), ...r.record })));
    if (error) {
      report.skipped += chunk.length;
      report.problems.push(`Rows ${chunk[0].line}–${chunk[chunk.length - 1].line} weren't saved: ${error.message}`);
    } else report.imported += chunk.length;
  }
}

async function inBatches<T>(items: T[], size: number, fn: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += size) await Promise.all(items.slice(i, i + size).map(fn));
}
