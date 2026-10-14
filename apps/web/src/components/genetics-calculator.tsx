"use client";

import { useMemo, useState } from "react";
import { formatPercent, hetLabel, predictOffspring, type Gene, type GeneStatus, type ParentGene } from "@/lib/genetics";

export type CalcSpecies = { id: string; name: string; genes: Gene[] };
export type CalcAnimal = { id: string; name: string; sex: string | null; speciesId: string; genes: ParentGene[] };

const STATUS_LABEL: Record<GeneStatus, string> = {
  visual: "Visual",
  super: "Super",
  het: "100% het",
  possible_het: "Possible het",
};

function statusesFor(gene: Gene): GeneStatus[] {
  if (gene.inheritance === "recessive") return ["visual", "het", "possible_het"];
  if (gene.inheritance === "incomplete_dominant") return ["visual", "super"];
  return ["visual"];
}

function Parent({
  title,
  species,
  animals,
  value,
  onChange,
}: {
  title: string;
  species: CalcSpecies;
  animals: CalcAnimal[];
  value: ParentGene[];
  onChange: (v: ParentGene[]) => void;
}) {
  const [adding, setAdding] = useState("");
  const byId = new Map(species.genes.map((g) => [g.id, g]));
  const used = new Set(value.map((v) => v.geneId));

  const add = (geneId: string) => {
    const gene = byId.get(geneId);
    if (!gene) return;
    onChange([...value, { geneId, status: "visual" }]);
    setAdding("");
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">{title}</h2>
        {animals.length > 0 && (
          <select
            className="field py-1 text-sm"
            value=""
            onChange={(e) => {
              const a = animals.find((x) => x.id === e.target.value);
              if (a) onChange(a.genes.filter((g) => byId.has(g.geneId)));
            }}
          >
            <option value="">Load from my animals…</option>
            {animals.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {value.length === 0 && <p className="text-sm text-muted">Normal (no genes added)</p>}
      <ul className="flex flex-col gap-2">
        {value.map((v, i) => {
          const gene = byId.get(v.geneId)!;
          const update = (patch: Partial<ParentGene>) => onChange(value.map((x, j) => (j === i ? { ...x, ...patch } : x)));
          return (
            <li key={v.geneId} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="min-w-28 font-medium">{gene.name}</span>
              <select
                className="field py-1 text-sm"
                value={v.status}
                onChange={(e) => {
                  const status = e.target.value as GeneStatus;
                  update({ status, hetProbability: status === "possible_het" ? (v.hetProbability ?? 66) : null });
                }}
              >
                {statusesFor(gene).map((s) => (
                  <option key={s} value={s}>
                    {s === "super" ? (gene.super_name ?? "Super") : STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
              {v.status === "possible_het" && (
                <select
                  className="field py-1 text-sm"
                  value={String(v.hetProbability ?? 66)}
                  onChange={(e) => update({ hetProbability: Number(e.target.value) })}
                >
                  {[...new Set([50, 66, v.hetProbability ?? 66])].sort((x, y) => x - y).map((p) => (
                    <option key={p} value={p}>
                      {p}%
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                className="text-muted hover:text-red-600"
                aria-label={`Remove ${gene.name}`}
                onClick={() => onChange(value.filter((_, j) => j !== i))}
              >
                ✕
              </button>
            </li>
          );
        })}
      </ul>

      <select className="field text-sm" value={adding} onChange={(e) => add(e.target.value)}>
        <option value="">+ Add a gene…</option>
        {species.genes
          .filter((g) => !used.has(g.id))
          .map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
      </select>
    </div>
  );
}

export function GeneticsCalculator({
  species,
  animals,
  initialSpeciesId,
  initialA,
  initialB,
}: {
  species: CalcSpecies[];
  animals: CalcAnimal[];
  initialSpeciesId: string;
  initialA?: string;
  initialB?: string;
}) {
  const [speciesId, setSpeciesId] = useState(initialSpeciesId);
  const current = species.find((s) => s.id === speciesId) ?? species[0];
  const mine = animals.filter((a) => a.speciesId === current.id);
  const start = (id?: string) => mine.find((a) => a.id === id)?.genes ?? [];
  const [a, setA] = useState<ParentGene[]>(() => start(initialA));
  const [b, setB] = useState<ParentGene[]>(() => start(initialB));

  const result = useMemo(() => {
    try {
      return { ...predictOffspring(current.genes, a, b), error: null };
    } catch (e) {
      return { outcomes: [], ignored: [], error: e instanceof Error ? e.message : String(e) };
    }
  }, [current, a, b]);

  // Health warnings: genes carried by either parent, and risky supers among the babies.
  const byId = new Map(current.genes.map((g) => [g.id, g]));
  const carried = [...new Set([...a, ...b].map((g) => g.geneId))]
    .map((id) => byId.get(id))
    .filter((g): g is Gene => !!g?.health_note);
  const superOdds = new Map<string, number>();
  for (const o of result.outcomes) for (const id of o.supers) superOdds.set(id, (superOdds.get(id) ?? 0) + o.probability);
  const riskySupers = [...superOdds]
    .map(([id, p]) => ({ gene: byId.get(id)!, p }))
    .filter(({ gene }) => gene?.super_lethal || gene?.super_health_note)
    .sort((x, y) => Number(!!y.gene.super_lethal) - Number(!!x.gene.super_lethal));
  const rowWarning = (supers: string[]) => {
    const genes = supers.map((id) => byId.get(id)).filter((g): g is Gene => !!g);
    if (genes.some((g) => g.super_lethal)) return "lethal";
    if (genes.some((g) => g.super_health_note)) return "health";
    return null;
  };

  return (
    <div className="flex flex-col gap-6">
      {species.length > 1 && (
        <label className="flex flex-col gap-1 text-sm">
          Species
          <select
            className="field"
            value={current.id}
            onChange={(e) => {
              setSpeciesId(e.target.value);
              setA([]);
              setB([]);
            }}
          >
            {species.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Parent title="Male" species={current} animals={mine.filter((x) => x.sex !== "female")} value={a} onChange={setA} />
        <Parent title="Female" species={current} animals={mine.filter((x) => x.sex !== "male")} value={b} onChange={setB} />
      </div>

      {(riskySupers.length > 0 || carried.length > 0) && (
        <div className="flex flex-col gap-2">
          {riskySupers.map(({ gene, p }) => (
            <p
              key={gene.id}
              className={`rounded-md p-3 text-sm ${gene.super_lethal ? "bg-red-500/10 text-red-700 dark:text-red-400" : "bg-amber-500/15 text-amber-800 dark:text-amber-300"}`}
            >
              ⚠️ <strong>{gene.super_name ?? `Super ${gene.name}`}</strong> expected in {formatPercent(p)} of eggs.{" "}
              {gene.super_health_note ?? "The super form is not expected to survive."}
              {gene.super_lethal && " Most breeders avoid this pairing."}
            </p>
          ))}
          {carried.map((g) => (
            <p key={g.id} className="rounded-md bg-amber-500/15 p-3 text-sm text-amber-800 dark:text-amber-300">
              ⚠️ <strong>{g.name}:</strong> {g.health_note}
            </p>
          ))}
        </div>
      )}

      <section>
        <h2 className="mb-3 text-xl font-semibold">Possible offspring</h2>
        {result.error ? (
          <p className="rounded-md bg-red-500/10 p-3 text-sm text-red-600">
            {result.error}. A parent can carry at most two genes from the same complex.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-border/40 text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="w-24 px-4 py-2">Odds</th>
                  <th className="px-4 py-2">Morph</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.outcomes.map((o) => (
                  <tr key={o.morph}>
                    <td className="px-4 py-2 font-semibold tabular-nums">{formatPercent(o.probability)}</td>
                    <td className="px-4 py-2">
                      <span className="font-medium">{o.morph}</span>
                      {rowWarning(o.supers) === "lethal" && (
                        <span className="ml-2 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-400">
                          lethal
                        </span>
                      )}
                      {rowWarning(o.supers) === "health" && (
                        <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300">
                          health risk
                        </span>
                      )}
                      {o.hets.length > 0 && <span className="text-muted"> · {o.hets.map(hetLabel).join(", ")}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 text-xs text-muted">
          Odds per egg, assuming genes are inherited independently. Real clutches vary. Genes and health notes come
          from our {current.name.toLowerCase()} list, which is still being reviewed: always check with experienced
          breeders.
        </p>
      </section>
    </div>
  );
}
