import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPercent, hetLabel, predictOffspring, type Gene, type ParentGene } from "@/lib/genetics";
import { geneSlug, INHERITANCE_LABEL, inheritanceExplainer } from "@/lib/morphs";
import { SITE_URL } from "@/lib/site";
import { speciesSlug } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string; gene: string }> };

async function load(slug: string, geneParam: string) {
  const supabase = await createClient();
  const { data: species } = await supabase
    .from("species")
    .select("id, common_name, scientific_name")
    .eq("active", true);
  const sp = species?.find((s) => speciesSlug(s) === slug);
  if (!sp) return null;
  const { data: genes } = await supabase
    .from("genes")
    .select("id, name, inheritance, allelic_group, super_name, aliases, notes, health_note, super_health_note, super_lethal, verified")
    .eq("species_id", sp.id)
    .eq("active", true)
    .order("name");
  const gene = genes?.find((g) => geneSlug(g.name) === geneParam);
  if (!gene) return null;
  return { supabase, species: sp, speciesName: sp.common_name ?? sp.scientific_name, gene, genes: genes ?? [] };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, gene } = await params;
  const data = await load(slug, gene);
  if (!data) return { title: "Morph not found | Reptilytics" };
  const { gene: g, speciesName } = data;
  const superPart = g.inheritance === "incomplete_dominant" ? `, ${g.super_name ?? `Super ${g.name}`}` : "";
  return {
    title: `${g.name} ${speciesName} Morph: Genetics${superPart} & Breeding Odds | Reptilytics`,
    description: `${g.name} ${speciesName.toLowerCase()} genetics: ${INHERITANCE_LABEL[g.inheritance]?.toLowerCase()} inheritance${superPart ? `, super form (${g.super_name ?? `Super ${g.name}`})` : ""}, health notes, breeding outcomes and published research.`,
    alternates: { canonical: `/species/${slug}/morphs/${gene}` },
  };
}

export default async function MorphPage({ params }: Props) {
  const { slug, gene: geneParam } = await params;
  const data = await load(slug, geneParam);
  if (!data) notFound();
  const { supabase, species, speciesName, gene, genes } = data;
  const g = gene as Gene & typeof gene;
  const superName = g.super_name ?? `Super ${g.name}`;
  const siblings = g.allelic_group ? genes.filter((x) => x.allelic_group === g.allelic_group && x.id !== g.id) : [];
  const { data: papers } = await supabase.rpc("fn49_species_term_papers", { p_species_id: species.id, p_term: g.name, p_limit: 6 });

  // Common pairings, worked out with the same engine as the calculator.
  const visual: ParentGene = { geneId: g.id, status: "visual" };
  const pairings: { title: string; a: ParentGene[]; b: ParentGene[] }[] =
    g.inheritance === "recessive"
      ? [
          { title: `${g.name} × Normal`, a: [visual], b: [] },
          { title: `${g.name} × het ${g.name}`, a: [visual], b: [{ geneId: g.id, status: "het" }] },
          { title: `het ${g.name} × het ${g.name}`, a: [{ geneId: g.id, status: "het" }], b: [{ geneId: g.id, status: "het" }] },
          { title: `${g.name} × ${g.name}`, a: [visual], b: [visual] },
        ]
      : [
          { title: `${g.name} × Normal`, a: [visual], b: [] },
          { title: `${g.name} × ${g.name}`, a: [visual], b: [visual] },
          ...(g.inheritance === "incomplete_dominant"
            ? [{ title: `${superName} × Normal`, a: [{ geneId: g.id, status: "super" as const }], b: [] }]
            : []),
        ];
  for (const s of siblings.slice(0, 3))
    pairings.push({ title: `${g.name} × ${s.name}`, a: [visual], b: [{ geneId: s.id, status: "visual" }] });

  const crumbs = [
    { name: "Species", url: `${SITE_URL}/species` },
    { name: speciesName, url: `${SITE_URL}/species/${slug}` },
    { name: `${g.name} morph`, url: `${SITE_URL}/species/${slug}/morphs/${geneParam}` },
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.url })),
  };

  return (
    <article className="flex flex-col gap-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header>
        <nav className="text-sm text-muted">
          <Link href="/species" className="hover:text-foreground">Species</Link> ›{" "}
          <Link href={`/species/${slug}`} className="hover:text-foreground">{speciesName}</Link>
        </nav>
        <h1 className="mt-2 text-3xl font-bold">
          {g.name} {speciesName}
        </h1>
        <p className="text-muted">{INHERITANCE_LABEL[g.inheritance] ?? g.inheritance} morph</p>
      </header>

      <dl className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-card p-4 text-sm sm:grid-cols-4">
        <div><dt className="text-xs uppercase tracking-wide text-muted">Inheritance</dt><dd className="font-medium">{INHERITANCE_LABEL[g.inheritance] ?? g.inheritance}</dd></div>
        <div><dt className="text-xs uppercase tracking-wide text-muted">Super form</dt><dd className="font-medium">{g.inheritance === "incomplete_dominant" ? superName : "—"}</dd></div>
        <div><dt className="text-xs uppercase tracking-wide text-muted">Allelic with</dt><dd className="font-medium">{siblings.length ? siblings.map((s) => s.name).join(", ") : "—"}</dd></div>
        <div><dt className="text-xs uppercase tracking-wide text-muted">Also called</dt><dd className="font-medium">{g.aliases?.length ? g.aliases.join(", ") : "—"}</dd></div>
      </dl>

      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-semibold">How {g.name} is inherited</h2>
        <p>{inheritanceExplainer(g, speciesName)}</p>
        {siblings.length > 0 && (
          <p>
            {g.name} is allelic with {siblings.map((s) => s.name).join(", ")}: they sit at the same spot on the chromosome, so an animal can
            carry at most two of them, and pairing them produces combination morphs.
          </p>
        )}
        {g.notes && <p className="text-muted">{g.notes}</p>}
      </section>

      {(g.health_note || g.super_health_note) && (
        <section className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold">Health notes</h2>
          {g.health_note && (
            <p className="rounded-md bg-amber-500/15 p-3 text-sm text-amber-800 dark:text-amber-300">⚠️ {g.health_note}</p>
          )}
          {g.super_health_note && (
            <p
              className={`rounded-md p-3 text-sm ${g.super_lethal ? "bg-red-500/10 text-red-700 dark:text-red-400" : "bg-amber-500/15 text-amber-800 dark:text-amber-300"}`}
            >
              ⚠️ {g.super_health_note}
            </p>
          )}
        </section>
      )}

      <section>
        <h2 className="mb-1 text-2xl font-semibold">Breeding outcomes</h2>
        <p className="mb-4 text-sm text-muted">Odds per egg. Try your own pairing in the genetics calculator.</p>
        <div className="grid gap-4 md:grid-cols-2">
          {pairings.map((p) => {
            const { outcomes } = predictOffspring(genes as Gene[], p.a, p.b);
            return (
              <div key={p.title} className="rounded-lg border border-border bg-card p-4 text-sm">
                <h3 className="mb-2 font-semibold">{p.title}</h3>
                <ul className="flex flex-col gap-1">
                  {outcomes.map((o) => (
                    <li key={o.morph}>
                      <span className="inline-block w-14 font-semibold tabular-nums">{formatPercent(o.probability)}</span>
                      {o.morph}
                      {o.hets.length > 0 && <span className="text-muted"> · {o.hets.map(hetLabel).join(", ")}</span>}
                      {o.supers.some((id) => genes.find((x) => x.id === id)?.super_lethal) && (
                        <span className="ml-1 text-xs font-medium text-red-600">(lethal)</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <Link href={`/genetics?species=${slug}`} className="btn-primary mt-4 inline-block">
          Open the {speciesName.toLowerCase()} genetics calculator
        </Link>
      </section>

      {!!papers?.length && (
        <section>
          <h2 className="mb-3 text-2xl font-semibold">Research mentioning {g.name}</h2>
          <ul className="flex flex-col gap-2">
            {papers.map((p) => (
              <li key={p.id} className="rounded-lg border border-border bg-card p-3 text-sm">
                <a href={p.source_url} target="_blank" rel="noreferrer" className="font-medium hover:text-brand">{p.title}</a>
                <p className="mt-1 text-xs text-muted">{[p.publisher, p.published_date?.slice(0, 4)].filter(Boolean).join(" · ")}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-xl font-semibold">Other {speciesName.toLowerCase()} morphs</h2>
        <ul className="flex flex-wrap gap-2">
          {genes
            .filter((x) => x.id !== g.id)
            .map((x) => (
              <li key={x.id}>
                <Link href={`/species/${slug}/morphs/${geneSlug(x.name)}`} className="rounded-full border border-border bg-card px-3 py-1 text-sm hover:border-brand">
                  {x.name}
                </Link>
              </li>
            ))}
        </ul>
      </section>

      {!g.verified && (
        <p className="text-xs text-muted">
          This morph entry hasn&apos;t been reviewed yet. Spotted a mistake? <Link href="/contact" className="text-brand hover:underline">Let us know</Link>.
        </p>
      )}
    </article>
  );
}
