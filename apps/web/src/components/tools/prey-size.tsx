"use client";

import { useState } from "react";
import { PREY } from "@/lib/husbandry-data";

// Common guidance: one prey item of about 10–15% of the snake's body weight,
// roughly as wide as the snake's widest point.
export function PreySizeCalculator() {
  const [grams, setGrams] = useState("");
  const weight = Number(grams);
  const valid = weight > 0 && weight < 200000;
  const low = weight * 0.1;
  const high = weight * 0.15;
  const matches = valid ? PREY.filter((p) => p.grams[1] >= low && p.grams[0] <= high) : [];
  const interval = weight < 200 ? "every 5–7 days" : weight < 1000 ? "every 7–14 days" : "every 14–21 days";

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <label className="flex flex-col gap-1 text-sm">
        Snake weight (grams)
        <input
          type="number"
          inputMode="decimal"
          min={1}
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
          placeholder="e.g. 900"
          className="field text-lg"
        />
        {valid && <span className="text-xs text-muted">≈ {(weight / 453.6).toFixed(2)} lb</span>}
      </label>
      {valid && (
        <div className="flex flex-col gap-3">
          <p>
            Target prey weight: <strong>{Math.round(low)}–{Math.round(high)} g</strong> (10–15% of body weight).
          </p>
          {matches.length ? (
            <ul className="flex flex-wrap gap-2">
              {matches.map((p) => (
                <li key={`${p.kind}-${p.size}`} className="rounded-full bg-brand/10 px-3 py-1 text-sm font-medium text-brand-dark">
                  {p.size} {p.kind.toLowerCase()} ({p.grams[0]}–{p.grams[1]} g)
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No single standard feeder fits; consider multiple smaller items or a jumbo rat / rabbit.</p>
          )}
          <p className="text-sm">
            Typical interval at this size: <strong>{interval}</strong>. Adjust to body condition: skip or space out meals for heavy snakes.
          </p>
        </div>
      )}
    </div>
  );
}
