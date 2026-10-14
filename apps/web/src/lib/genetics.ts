// Offspring odds for a pairing, Punnett-square style, one locus at a time.
// Genes in the same allelic_group are alleles of one locus (e.g. the BEL
// complex); every other gene is its own locus. Loci are assumed unlinked.

export type Inheritance = "recessive" | "incomplete_dominant" | "dominant" | "polygenic";
export type GeneStatus = "visual" | "super" | "het" | "possible_het";

export type Gene = {
  id: string;
  name: string;
  inheritance: string;
  allelic_group: string | null;
  super_name: string | null;
  health_note?: string | null;
  super_health_note?: string | null;
  super_lethal?: boolean;
};

export type ParentGene = { geneId: string; status: GeneStatus; hetProbability?: number | null };

export type Outcome = {
  probability: number;
  morph: string;
  hets: { gene: string; probability: number }[];
  // Genes present in two copies with a distinct super form (for health warnings).
  supers: string[];
};

const WILD = "+";

type Weighted<T> = { value: T; p: number };

// A parent's possible genotypes at one locus (two alleles each), weighted.
function parentLocus(entries: { gene: Gene; status: GeneStatus; het?: number | null }[]): Weighted<string[]>[] {
  const definite: string[] = [];
  const maybe: { id: string; p: number }[] = [];
  for (const { gene, status, het } of entries) {
    if (status === "possible_het") maybe.push({ id: gene.id, p: Math.min(Math.max((het ?? 50) / 100, 0), 1) });
    else if (status === "het") definite.push(gene.id);
    else if (status === "super") definite.push(gene.id, gene.id);
    else if (gene.inheritance === "recessive") definite.push(gene.id, gene.id);
    else definite.push(gene.id); // visual co-dominant or dominant: one copy
  }
  if (definite.length > 2) throw new Error("Too many genes at one locus");

  let options: Weighted<string[]>[] = [{ value: definite, p: 1 }];
  for (const m of maybe) {
    options = options.flatMap((o) =>
      o.value.length < 2
        ? [
            { value: [...o.value, m.id], p: o.p * m.p },
            { value: o.value, p: o.p * (1 - m.p) },
          ]
        : [o],
    );
  }
  return options.map((o) => ({ value: [...o.value, WILD, WILD].slice(0, 2), p: o.p }));
}

// Child genotypes at one locus.
function crossLocus(a: Weighted<string[]>[], b: Weighted<string[]>[]) {
  const out = new Map<string, number>();
  for (const pa of a)
    for (const pb of b)
      for (const x of pa.value)
        for (const y of pb.value) {
          const key = [x, y].sort().join("|");
          out.set(key, (out.get(key) ?? 0) + pa.p * pb.p * 0.25);
        }
  return [...out].map(([key, p]) => ({ value: key.split("|"), p }));
}

type Pheno = { visual: string[]; hets: string[]; supers: string[] };

// Morph names list co-dominant/dominant genes before recessive ones
// ("Pastel Clown"); the sort key is stripped before display.
const label = (g: Gene, name: string) => `${g.inheritance === "recessive" ? 1 : 0}\u0000${name}`;
const unlabel = (v: string) => v.slice(v.indexOf("\u0000") + 1);

// What a child genotype at one locus looks like.
function phenotype([x, y]: string[], genes: Map<string, Gene>): Pheno {
  const visual: string[] = [];
  const hets: string[] = [];
  const supers: string[] = [];
  if (x === y) {
    if (x === WILD) return { visual, hets, supers };
    const g = genes.get(x)!;
    if (g.inheritance === "incomplete_dominant") {
      visual.push(label(g, g.super_name ?? `Super ${g.name}`));
      supers.push(g.id);
    } else visual.push(label(g, g.name));
    return { visual, hets, supers };
  }
  for (const id of [x, y]) {
    if (id === WILD) continue;
    const g = genes.get(id)!;
    const other = id === x ? y : x;
    // A recessive allele shows only paired with another mutant allele of its locus.
    if (g.inheritance === "recessive" && other === WILD) hets.push(g.name);
    else visual.push(label(g, g.name));
  }
  return { visual, hets, supers };
}

export function predictOffspring(
  genes: Gene[],
  parentA: ParentGene[],
  parentB: ParentGene[],
): { outcomes: Outcome[]; ignored: string[] } {
  const byId = new Map(genes.map((g) => [g.id, g]));
  const ignored = new Set<string>();
  const loci = new Map<string, { a: Parameters<typeof parentLocus>[0]; b: Parameters<typeof parentLocus>[0] }>();
  const add = (side: "a" | "b", pg: ParentGene) => {
    const gene = byId.get(pg.geneId);
    if (!gene) return;
    if (gene.inheritance === "polygenic") {
      ignored.add(gene.name);
      return;
    }
    const key = gene.allelic_group ?? gene.id;
    if (!loci.has(key)) loci.set(key, { a: [], b: [] });
    loci.get(key)![side].push({ gene, status: pg.status, het: pg.hetProbability });
  };
  parentA.forEach((g) => add("a", g));
  parentB.forEach((g) => add("b", g));

  // Combine loci, merging identical (visual, hets) combinations as we go.
  type Combo = { visual: string[]; hets: string[]; supers: string[]; p: number };
  let combos = new Map<string, Combo>([["|", { visual: [], hets: [], supers: [], p: 1 }]]);
  for (const { a, b } of loci.values()) {
    const child = crossLocus(parentLocus(a), parentLocus(b));
    const next = new Map<string, Combo>();
    for (const c of combos.values())
      for (const g of child) {
        const ph = phenotype(g.value, byId);
        const visual = [...c.visual, ...ph.visual].sort();
        const hets = [...c.hets, ...ph.hets].sort();
        const key = `${visual.join(",")}|${hets.join(",")}`;
        const prev = next.get(key);
        if (prev) prev.p += c.p * g.p;
        else next.set(key, { visual, hets, supers: [...c.supers, ...ph.supers], p: c.p * g.p });
      }
    combos = next;
  }

  // Group by what the baby looks like; hets become "N% possible het".
  const groups = new Map<string, { p: number; hets: Map<string, number>; supers: string[] }>();
  for (const c of combos.values()) {
    if (c.p < 1e-12) continue;
    const morph = c.visual.length ? c.visual.map(unlabel).join(" ") : "Normal";
    if (!groups.has(morph)) groups.set(morph, { p: 0, hets: new Map(), supers: c.supers });
    const g = groups.get(morph)!;
    g.p += c.p;
    for (const h of c.hets) g.hets.set(h, (g.hets.get(h) ?? 0) + c.p);
  }

  const outcomes = [...groups]
    .map(([morph, g]) => ({
      morph,
      probability: g.p,
      supers: g.supers,
      hets: [...g.hets]
        .map(([gene, p]) => ({ gene, probability: p / g.p }))
        .sort((x, y) => y.probability - x.probability || x.gene.localeCompare(y.gene)),
    }))
    .sort((x, y) => y.probability - x.probability || x.morph.localeCompare(y.morph));
  return { outcomes, ignored: [...ignored] };
}

export function formatPercent(p: number) {
  const pct = p * 100;
  return `${Number.isInteger(Math.round(pct * 100) / 100) ? Math.round(pct) : (Math.round(pct * 100) / 100).toString()}%`;
}

export function hetLabel(h: { gene: string; probability: number }) {
  return h.probability > 0.9999 ? `het ${h.gene}` : `${Math.round(h.probability * 100)}% poss. het ${h.gene}`;
}
