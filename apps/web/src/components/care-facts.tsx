import Link from "next/link";
import type { Database } from "@/lib/database.types";

type Care = Database["public"]["Tables"]["species_care"]["Row"];

const f = (c: number) => Math.round((Number(c) * 9) / 5 + 32);
const range = (a: number | null, b: number | null, fmt: (n: number) => string, sep = "–") =>
  a === null && b === null ? null : a === b || b === null ? fmt(Number(a)) : a === null ? fmt(Number(b)) : `${fmt(Number(a))}${sep}${fmt(Number(b))}`;

function length(a: number | null, b: number | null) {
  if (a === null || b === null) return null;
  const metric = b >= 100 ? `${+(a / 100).toFixed(1)}–${+(b / 100).toFixed(1)} m` : `${Math.round(a)}–${Math.round(b)} cm`;
  const inA = a / 2.54;
  const inB = b / 2.54;
  const imperial = inB >= 36 ? `${+(inA / 12).toFixed(1)}–${+(inB / 12).toFixed(1)} ft` : `${Math.round(inA)}–${Math.round(inB)} in`;
  return `${metric} (${imperial})`;
}

function weight(a: number | null, b: number | null) {
  if (a === null || b === null) return null;
  const metric = b >= 1000 ? `${+(a / 1000).toFixed(1)}–${+(b / 1000).toFixed(1)} kg` : `${Math.round(a)}–${Math.round(b)} g`;
  const lbA = a / 453.6;
  const lbB = b / 453.6;
  const imperial = lbB >= 2 ? `${+lbA.toFixed(1)}–${+lbB.toFixed(1)} lb` : `${+(a / 28.35).toFixed(1)}–${+(b / 28.35).toFixed(1)} oz`;
  return `${metric} (${imperial})`;
}

const temp = (a: number | null, b: number | null) =>
  a === null ? null : `${range(a, b, (n) => `${n}`)} °C (${range(a, b, (n) => `${f(n)}`)} °F)`;

const UVB: Record<string, string> = {
  essential: "Essential",
  recommended: "Recommended",
  optional: "Optional (low-level is beneficial)",
  none: "Not needed",
};

// "Care at a glance" box for a species page.
export function CareFacts({ care, name, enclosureTool }: { care: Care; name: string; enclosureTool: boolean }) {
  const rows: [string, string | null][] = [
    ["Adult length", length(care.length_cm_min, care.length_cm_max)],
    ["Adult weight", weight(care.weight_g_min, care.weight_g_max)],
    ["Lifespan", care.lifespan_min !== null ? `${range(care.lifespan_min, care.lifespan_max, (n) => `${n}`)} years` : null],
    ["Basking / warm side", temp(care.hot_c_min, care.hot_c_max)],
    ["Cool side", temp(care.cool_c_min, care.cool_c_max)],
    ["Night minimum", care.night_c_min !== null ? `${care.night_c_min} °C (${f(care.night_c_min)} °F)` : null],
    ["Humidity", care.humidity_min !== null ? `${care.humidity_min}–${care.humidity_max}%` : null],
    ["UVB", care.uvb ? UVB[care.uvb] : null],
    ["Diet", care.diet],
    ["Activity", care.activity ? care.activity[0].toUpperCase() + care.activity.slice(1) : null],
    ["Lifestyle", care.habitat ? care.habitat[0].toUpperCase() + care.habitat.slice(1) : null],
  ];

  return (
    <section>
      <h2 className="mb-3 text-2xl font-semibold">{name} care at a glance</h2>
      <dl className="grid gap-x-6 gap-y-3 rounded-lg border border-border bg-card p-4 text-sm sm:grid-cols-2">
        {rows
          .filter((r): r is [string, string] => !!r[1])
          .map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
      </dl>
      {care.notes && <p className="mt-2 text-sm">{care.notes}</p>}
      <p className="mt-2 text-xs text-muted">
        Typical values from common keeping practice{care.verified ? "" : ", not yet reviewed"}. Individual animals and setups vary.
        {enclosureTool && (
          <>
            {" "}
            See the <Link href="/tools/enclosure-size" className="text-brand hover:underline">enclosure size guide</Link>.
          </>
        )}
      </p>
    </section>
  );
}
