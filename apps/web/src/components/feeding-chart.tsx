"use client";

import { useState } from "react";

type Day = { day: string; fed: number; refused: number };

// Last 30 days of meals: stacked bars, fed (green) under refused (amber).
// Totals are shown as text and every day has a hover/focus tooltip, so the
// lighter amber never carries information on its own.
export function FeedingChart({ days }: { days: Day[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...days.map((d) => d.fed + d.refused));
  const fed = days.reduce((n, d) => n + d.fed, 0);
  const refused = days.reduce((n, d) => n + d.refused, 0);
  const W = 600;
  const H = 140;
  const slot = W / days.length;
  const bar = Math.max(4, slot - 6);
  const scale = (n: number) => (n / max) * (H - 8);
  const fmt = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const h = hover === null ? null : days[hover];

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-chart-fed" aria-hidden /> Fed <strong>{fed}</strong>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-chart-refused" aria-hidden /> Refused <strong>{refused}</strong>
        </span>
        <span className="ml-auto text-xs text-muted">
          {h ? `${fmt(h.day)}: ${h.fed} fed, ${h.refused} refused` : "Last 30 days"}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 18}`} className="w-full" role="img" aria-label={`Feedings in the last 30 days: ${fed} fed, ${refused} refused`}>
        <line x1={0} x2={W} y1={H} y2={H} className="stroke-border" strokeWidth={1} />
        {days.map((d, i) => {
          const x = i * slot + (slot - bar) / 2;
          const fh = scale(d.fed);
          const rh = scale(d.refused);
          return (
            <g
              key={d.day}
              tabIndex={0}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              className="outline-none"
            >
              <title>{`${fmt(d.day)}: ${d.fed} fed, ${d.refused} refused`}</title>
              {/* Hit target taller and wider than the bar. */}
              <rect x={i * slot} y={0} width={slot} height={H} fill="transparent" />
              {hover === i && <rect x={i * slot} y={0} width={slot} height={H} className="fill-border/40" />}
              {d.fed > 0 && <rect x={x} y={H - fh} width={bar} height={fh} rx={2} className="fill-chart-fed" />}
              {d.refused > 0 && (
                <rect x={x} y={H - fh - rh - (d.fed > 0 ? 2 : 0)} width={bar} height={rh} rx={2} className="fill-chart-refused" />
              )}
            </g>
          );
        })}
        <text x={0} y={H + 14} className="fill-muted text-[11px]">{fmt(days[0].day)}</text>
        <text x={W} y={H + 14} textAnchor="end" className="fill-muted text-[11px]">Today</text>
      </svg>
      {fed + refused === 0 && <p className="mt-1 text-sm text-muted">No meals logged in the last 30 days.</p>}
    </div>
  );
}
