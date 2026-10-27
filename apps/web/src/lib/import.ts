// Reading keepers' CSV files: our own export, or a spreadsheet laid out
// roughly the same way. Headers are matched loosely ("Weight (g)" and
// "weight_grams" both mean weight_g), and each file's kind comes from them.

export type Kind = "animals" | "feedings" | "weights" | "lengths" | "sheds" | "health" | "notes";

const ALIASES: Record<string, string[]> = {
  animal_id: ["animal_id"],
  animal_code: ["animal_code", "code"],
  animal_name: ["animal_name", "animal"],
  name: ["name"],
  species: ["species", "common_name", "species_common_name"],
  scientific_name: ["scientific_name", "species_scientific_name", "latin_name"],
  sex: ["sex", "gender"],
  hatch_date: ["hatch_date", "hatched", "birth_date", "birthdate", "dob", "date_of_birth"],
  status: ["status"],
  morph: ["morph", "genetics", "traits"],
  tags: ["tags", "labels"],
  feeding_interval_days: ["feeding_interval_days", "feeding_interval"],
  sire: ["sire", "father"],
  dam: ["dam", "mother"],
  acquired_date: ["acquired_date", "acquired", "acquisition_date", "purchase_date"],
  source: ["source", "source_name", "breeder", "purchased_from"],
  source_type: ["source_type"],
  price: ["price", "cost", "purchase_price"],
  currency: ["currency"],
  fed_at: ["fed_at", "feeding_date", "fed"],
  feeder_type: ["feeder_type", "feeder", "prey", "prey_type", "food"],
  feeder_size: ["feeder_size", "prey_size", "size"],
  quantity: ["quantity", "qty", "count"],
  accepted: ["accepted", "ate", "eaten"],
  refused: ["refused", "refusal"],
  recorded_at: ["recorded_at", "weighed_at", "measured_at"],
  weight_g: ["weight_g", "weight_grams", "weight", "grams"],
  length_cm: ["length_cm", "length"],
  shed_date: ["shed_date", "shed"],
  complete_shed: ["complete_shed", "complete"],
  retained_eye_caps: ["retained_eye_caps", "eye_caps"],
  retained_tail_tip: ["retained_tail_tip", "tail_tip"],
  event_date: ["event_date"],
  event_type: ["event_type", "event"],
  severity: ["severity"],
  created_at: ["created_at"],
  note_type: ["note_type"],
  note_text: ["note_text", "note"],
  notes: ["notes", "comments", "comment"],
  date: ["date"],
};

const normalize = (h: string) => h.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

export type Table = { kind: Kind | null; rows: string[][]; get: (row: string[], field: string) => string };

export function readTable(rows: string[][]): Table {
  const header = (rows[0] ?? []).map(normalize);
  const index = new Map<string, number>();
  for (const [field, names] of Object.entries(ALIASES)) {
    const i = names.map((n) => header.indexOf(n)).find((x) => x >= 0);
    if (i !== undefined) index.set(field, i);
  }
  const has = (f: string) => index.has(f);
  const kind: Kind | null =
    has("note_text") ? "notes"
    : has("fed_at") || has("feeder_type") ? "feedings"
    : has("weight_g") ? "weights"
    : has("length_cm") ? "lengths"
    : has("shed_date") || has("complete_shed") || has("retained_eye_caps") ? "sheds"
    : has("event_type") || has("event_date") ? "health"
    : has("species") || has("scientific_name") ? "animals"
    : null;
  return {
    kind,
    rows: rows.slice(1),
    get: (row, field) => {
      const i = index.get(field);
      return i === undefined ? "" : (row[i] ?? "").trim();
    },
  };
}

// An ISO timestamp, or null when the cell is empty, or "invalid".
// Accepts 2026-03-14, 2026-03-14T08:30:00Z, and US-style 3/14/2026 or 3/14/26.
// A bare date is stored at noon UTC, like dates logged in the app.
export function parseDate(s: string): string | null | "invalid" {
  if (!s) return null;
  let iso = s;
  const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (us) iso = `${us[3].length === 2 ? `20${us[3]}` : us[3]}-${us[1].padStart(2, "0")}-${us[2].padStart(2, "0")}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) iso += "T12:00:00Z";
  const t = new Date(iso);
  if (Number.isNaN(t.getTime()) || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return "invalid";
  // A day of slack covers keepers ahead of UTC.
  if (t.getTime() > Date.now() + 36 * 3600 * 1000) return "invalid";
  return t.toISOString();
}

export function parseBool(s: string, fallback: boolean) {
  const v = s.toLowerCase();
  if (["true", "yes", "y", "1", "x"].includes(v)) return true;
  if (["false", "no", "n", "0"].includes(v)) return false;
  return fallback;
}

export function parseSex(s: string) {
  const v = s.toLowerCase();
  if (["m", "male", "1.0", "1.0.0"].includes(v)) return "male";
  if (["f", "female", "0.1", "0.1.0"].includes(v)) return "female";
  return "unknown";
}

const STATUSES: Record<string, string> = {
  active: "active", sold: "sold", deceased: "deceased", dead: "deceased", died: "deceased",
  lost: "lost", escaped: "lost", on_loan: "on_loan", loaned: "on_loan",
};
export const parseStatus = (s: string) => STATUSES[normalize(s)] ?? null;

// A positive number, or null when the cell is empty, or NaN.
export function parsePositive(s: string) {
  if (!s) return null;
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : NaN;
}
