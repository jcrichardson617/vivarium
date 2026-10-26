import Link from "next/link";

export type WeightPoint = { at: string; g: number };
export type ComparisonBin = { age_month: number; n: number; p25: number; p50: number; p75: number };
export type Comparison = { animals: number; keepers: number; hatch_date: string | null; bins: ComparisonBin[] };

export const COMPARE_GROUPS = [
  { key: "species", label: "Same species", needsSex: false },
  { key: "sex", label: "Same sex", needsSex: true },
  { key: "morph", label: "Same morph", needsSex: false },
  { key: "morph_sex", label: "Same morph and sex", needsSex: true },
] as const;
export type CompareGroup = (typeof COMPARE_GROUPS)[number]["key"];

// Matches the minimum in public.weight_comparison: a month needs this many
// animals (from at least 3 keepers) before its band is drawn.
const MIN_ANIMALS = 5;
const MONTH_MS = 30.4375 * 86_400_000;

// About four round-numbered gridlines covering [min, max].
function niceTicks(min: number, max: number) {
  const raw = (max - min || Math.max(1, max)) / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw)!;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let t = lo; t <= hi + step / 2; t += step) ticks.push(Math.round(t * 100) / 100);
  return ticks;
}

// Weight over time, spaced by date. Each point has a title tooltip with its
// date and value. With a comparison, the 25th–75th percentile band and median
// of the chosen group are drawn behind the line, month by month of age.
export function WeightChart({ points, comparison }: { points: WeightPoint[]; comparison?: Comparison | null }) {
  const W = 600;
  const H = 160;
  const pad = 8;
  const times = points.map((p) => new Date(p.at).getTime());
  const first = Math.min(...times);
  const last = Math.max(...times);

  // Only the months around the animal's own weigh-ins: the band is context for
  // the line, not a growth curve of its own.
  const hatch = comparison?.hatch_date ? new Date(`${comparison.hatch_date}T12:00:00`).getTime() : null;
  const band =
    hatch === null
      ? []
      : (comparison?.bins ?? [])
          .map((b) => ({ ...b, t: hatch + (b.age_month + 0.5) * MONTH_MS }))
          .filter((b) => b.t >= first - MONTH_MS && b.t <= last + MONTH_MS);

  const t0 = Math.min(first, ...band.map((b) => b.t));
  const span = Math.max(1, Math.max(last, ...band.map((b) => b.t)) - t0);
  const values = [...points.map((p) => p.g), ...band.flatMap((b) => [b.p25, b.p75])];
  const ticks = niceTicks(Math.min(...values), Math.max(...values));
  const min = ticks[0];
  const max = ticks[ticks.length - 1];
  const range = max - min || 1;
  const x = (t: number) => pad + ((t - t0) / span) * (W - 2 * pad);
  const y = (g: number) => H - pad - ((g - min) / range) * (H - 2 * pad);
  const xy = points.map((p, i) => [x(times[i]), y(p.g)]);
  const label = (iso: string | number) => new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });

  const bandPath =
    band.length >= 2
      ? band.map((b, i) => `${i ? "L" : "M"}${x(b.t)},${y(b.p75)}`).join(" ") +
        " " +
        [...band].reverse().map((b) => `L${x(b.t)},${y(b.p25)}`).join(" ") +
        " Z"
      : null;
  const median = band.length >= 2 ? band.map((b, i) => `${i ? "L" : "M"}${x(b.t)},${y(b.p50)}`).join(" ") : null;

  // The plot stretches to the card (preserveAspectRatio none) with
  // non-scaling strokes; axis labels are HTML so they stay readable on phones.
  const ns = { vectorEffect: "non-scaling-stroke" as const };
  return (
    <div>
      <div className="flex gap-2">
        <div className="relative h-40 w-14 shrink-0 text-right text-xs text-muted" aria-hidden>
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2 whitespace-nowrap" style={{ top: `${(y(t) / H) * 100}%` }}>
              {`${t.toLocaleString("en-US")} g`}
            </span>
          ))}
        </div>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="h-40 min-w-0 flex-1"
          role="img"
          aria-label={`Weight from ${points[0].g} g to ${points[points.length - 1].g} g`}
        >
          {ticks.map((t) => (
            <line key={t} x1={0} x2={W} y1={y(t)} y2={y(t)} strokeWidth={1} className="stroke-border" {...ns} />
          ))}
          {bandPath && <path d={bandPath} className="fill-brand/15" />}
          {median && <path d={median} fill="none" strokeWidth={1.5} strokeDasharray="4 4" className="stroke-brand/60" {...ns} />}
          {band.length === 1 && (
            <line x1={x(band[0].t)} x2={x(band[0].t)} y1={y(band[0].p75)} y2={y(band[0].p25)} strokeWidth={8} strokeLinecap="round" className="stroke-brand/20" {...ns} />
          )}
          {band.map((b) => (
            <rect key={b.age_month} x={x(b.t) - 6} y={y(b.p75)} width={12} height={Math.max(1, y(b.p25) - y(b.p75))} fill="transparent">
              <title>{`Age ${b.age_month} mo: middle half ${b.p25}–${b.p75} g, median ${b.p50} g (${b.n} animals)`}</title>
            </rect>
          ))}
          <polyline points={xy.map((p) => p.join(",")).join(" ")} fill="none" strokeWidth={2} strokeLinejoin="round" className="stroke-brand" {...ns} />
          {/* Zero-length round-capped lines stay circular when the plot stretches. */}
          {xy.map(([cx, cy], i) => (
            <line key={i} x1={cx} x2={cx} y1={cy} y2={cy} strokeWidth={8} strokeLinecap="round" className="stroke-brand" {...ns}>
              <title>{`${new Date(points[i].at).toLocaleDateString()}: ${points[i].g} g`}</title>
            </line>
          ))}
        </svg>
      </div>
      <div className="mt-1 flex justify-between pl-16 text-xs text-muted">
        <span>{label(t0)}</span>
        <span>{label(t0 + span)}</span>
      </div>
    </div>
  );
}

// Group picker and a plain-language note on how much data the group has.
export function ComparisonControls({
  animalId,
  group,
  sexKnown,
  hasHatchDate,
  comparison,
}: {
  animalId: string;
  group: CompareGroup;
  sexKnown: boolean;
  hasHatchDate: boolean;
  comparison: Comparison | null;
}) {
  const shown = comparison?.bins.length ?? 0;
  return (
    <div className="mt-3 space-y-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted">Compare with:</span>
        {COMPARE_GROUPS.map((g) => {
          const disabled = g.needsSex && !sexKnown;
          const active = g.key === group;
          return disabled ? (
            <span key={g.key} title="Set this animal's sex to compare by sex" className="rounded-full border border-border px-2.5 py-0.5 text-muted opacity-50">
              {g.label}
            </span>
          ) : (
            <Link
              key={g.key}
              href={`/animals/${animalId}?compare=${g.key}#weight`}
              scroll={false}
              aria-current={active ? "true" : undefined}
              className={`rounded-full border px-2.5 py-0.5 ${active ? "border-brand bg-brand text-white" : "border-border hover:border-brand hover:text-brand"}`}
            >
              {g.label}
            </Link>
          );
        })}
      </div>
      {!hasHatchDate ? (
        <p className="text-muted">
          Add a hatch date to compare this animal&apos;s weight with others of the same age.{" "}
          <Link href={`/animals/${animalId}/edit`} className="text-brand hover:underline">Edit animal</Link>
        </p>
      ) : !comparison ? null : shown > 0 ? (
        <p className="text-muted">
          <span className="mr-1 inline-block h-2.5 w-4 rounded-sm bg-brand/15 align-middle" aria-hidden />
          Shaded band is the middle half of {comparison.animals} {comparison.animals === 1 ? "animal" : "animals"} from {comparison.keepers}{" "}
          {comparison.keepers === 1 ? "keeper" : "keepers"} at the same age; dashed line is the median. Months with fewer than {MIN_ANIMALS} animals
          are left out.
        </p>
      ) : (
        <p className="text-muted">
          Not enough data in this group yet: {comparison.animals} other {comparison.animals === 1 ? "animal" : "animals"} with weights. A month needs
          at least {MIN_ANIMALS} animals from 3 keepers before we show a range.
          {group !== "species" && " Try a broader group."}
        </p>
      )}
    </div>
  );
}
