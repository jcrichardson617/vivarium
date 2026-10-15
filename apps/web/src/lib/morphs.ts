import { slugify } from "@/lib/slug";
import type { Gene } from "@/lib/genetics";

export const geneSlug = (name: string) => slugify(name);

export const INHERITANCE_LABEL: Record<string, string> = {
  recessive: "Recessive",
  incomplete_dominant: "Co-dominant (incomplete dominant)",
  dominant: "Dominant",
  polygenic: "Line-bred (polygenic)",
};

// Plain-language explanation of how a gene is passed on.
export function inheritanceExplainer(g: Gene, speciesName: string) {
  const superName = g.super_name ?? `Super ${g.name}`;
  switch (g.inheritance) {
    case "recessive":
      return `${g.name} is recessive: a ${speciesName.toLowerCase()} needs two copies to show it. Animals with one copy look normal but are "het ${g.name}" and pass the gene to about half their babies.`;
    case "incomplete_dominant":
      return `${g.name} is co-dominant: one copy produces a visual ${g.name}, and two copies produce the ${superName}. Breeding a ${g.name} to a normal gives about 50% ${g.name} babies.`;
    case "dominant":
      return `${g.name} is dominant: one copy is enough to show it, and animals with two copies look the same as those with one. Breeding a ${g.name} to a normal gives about 50% ${g.name} babies.`;
    default:
      return `${g.name} is line-bred: it is shaped by many genes, so offspring odds can't be predicted with a calculator.`;
  }
}
