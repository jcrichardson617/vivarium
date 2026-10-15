"use client";

import { useState } from "react";
import { INCUBATION } from "@/lib/husbandry-data";

const fmt = (d: Date) => d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
const f = (c: number) => Math.round((c * 9) / 5 + 32);

export function HatchDateCalculator() {
  const [slug, setSlug] = useState(INCUBATION[0].slug);
  const [laid, setLaid] = useState(() => new Date().toISOString().slice(0, 10));
  const sp = INCUBATION.find((s) => s.slug === slug)!;
  const [custom, setCustom] = useState<{ min: string; max: string } | null>(null);
  const min = custom ? Number(custom.min) : sp.days[0];
  const max = custom ? Number(custom.max) : sp.days[1];
  const start = new Date(`${laid}T12:00:00`);
  const valid = !Number.isNaN(start.getTime()) && min > 0 && max >= min;
  const add = (n: number) => new Date(start.getTime() + n * 86400000);
  const daysLeft = valid ? Math.ceil((add(min).getTime() - Date.now()) / 86400000) : 0;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Species
          <select
            className="field"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setCustom(null);
            }}
          >
            {INCUBATION.map((s) => (
              <option key={s.slug} value={s.slug}>{s.name}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Laid on
          <input type="date" className="field" value={laid} onChange={(e) => setLaid(e.target.value)} />
        </label>
      </div>
      <p className="text-sm text-muted">
        Typical incubation: {sp.tempC[0]}–{sp.tempC[1]} °C ({f(sp.tempC[0])}–{f(sp.tempC[1])} °F), {sp.days[0]}–{sp.days[1]} days.{" "}
        <button
          type="button"
          className="text-brand hover:underline"
          onClick={() => setCustom(custom ? null : { min: String(sp.days[0]), max: String(sp.days[1]) })}
        >
          {custom ? "Use typical days" : "Use my own days"}
        </button>
      </p>
      {custom && (
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Earliest (days)
            <input type="number" className="field" value={custom.min} onChange={(e) => setCustom({ ...custom, min: e.target.value })} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Latest (days)
            <input type="number" className="field" value={custom.max} onChange={(e) => setCustom({ ...custom, max: e.target.value })} />
          </label>
        </div>
      )}
      {valid && (
        <div className="rounded-md bg-brand/10 p-4">
          <p className="text-sm text-muted">Expected hatch window</p>
          <p className="text-xl font-semibold">
            {fmt(add(min))} – {fmt(add(max))}
          </p>
          <p className="text-sm">
            {daysLeft > 0 ? `About ${daysLeft} days to go.` : daysLeft > -(max - min) ? "In the hatch window now." : "Past the typical window."}
          </p>
        </div>
      )}
      {sp.note && <p className="text-sm text-muted">{sp.note}</p>}
    </div>
  );
}
