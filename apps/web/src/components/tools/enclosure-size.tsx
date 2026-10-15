"use client";

import { useState } from "react";
import { ENCLOSURES } from "@/lib/husbandry-data";

function dims([l, w, h]: [number, number, number], metric: boolean) {
  if (metric) return `${Math.round(l)} × ${Math.round(w)} × ${Math.round(h)} cm`;
  const toFt = (cm: number) => {
    const inches = Math.round(cm / 2.54);
    return inches % 12 === 0 ? `${inches / 12} ft` : `${inches} in`;
  };
  return `${toFt(l)} × ${toFt(w)} × ${toFt(h)}`;
}

const gallons = ([l, w, h]: [number, number, number]) => Math.round((l * w * h) / 3785.41);

export function EnclosureSizeGuide({ defaultMetric }: { defaultMetric: boolean }) {
  const [slug, setSlug] = useState(ENCLOSURES[0].slug);
  const [metric, setMetric] = useState(defaultMetric);
  const sp = ENCLOSURES.find((s) => s.slug === slug)!;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Species
          <select className="field" value={slug} onChange={(e) => setSlug(e.target.value)}>
            {ENCLOSURES.map((s) => (
              <option key={s.slug} value={s.slug}>{s.name}</option>
            ))}
          </select>
        </label>
        <button type="button" className="btn-secondary text-sm" onClick={() => setMetric(!metric)}>
          {metric ? "Show feet / inches" : "Show centimetres"}
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-border p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Minimum</p>
          <p className="mt-1 text-xl font-semibold">{dims(sp.min, metric)}</p>
          <p className="text-sm text-muted">≈ {gallons(sp.min)} gallons</p>
        </div>
        <div className="rounded-md border border-brand/40 bg-brand/5 p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Recommended</p>
          <p className="mt-1 text-xl font-semibold">{dims(sp.recommended, metric)}</p>
          <p className="text-sm text-muted">≈ {gallons(sp.recommended)} gallons</p>
        </div>
      </div>
      <p className="text-xs text-muted">Length × width × height.{sp.note ? ` ${sp.note}` : ""}</p>
    </div>
  );
}
