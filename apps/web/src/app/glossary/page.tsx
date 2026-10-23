import type { Metadata } from "next";
import Link from "next/link";
import { GLOSSARY, termAnchor } from "@/lib/glossary";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Reptile Keeping & Morph Glossary: Het, Super, Allelic & More | Reptilytics",
  description:
    "Plain-English definitions of reptile genetics and husbandry terms: het, possible het, super, co-dominant, allelic, brumation, MBD, TSD, gut-loading and more.",
  alternates: { canonical: "/glossary" },
};

// Every term in one A–Z list, bucketed by first letter.
const TERMS = GLOSSARY.flatMap((g) => g.terms.map((t) => ({ ...t, group: g.group }))).sort((a, b) =>
  a.term.localeCompare(b.term, "en", { sensitivity: "base" }),
);
const LETTERS = [...new Set(TERMS.map((t) => t.term[0].toUpperCase()))];

export default function GlossaryPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name: "Reptile keeping glossary",
    url: `${SITE_URL}/glossary`,
    hasDefinedTerm: TERMS.map((t) => ({
      "@type": "DefinedTerm",
      name: t.term,
      description: t.def,
      url: `${SITE_URL}/glossary#${termAnchor(t.term)}`,
    })),
  };

  return (
    <article className="flex flex-col gap-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header>
        <h1 className="text-3xl font-bold">Glossary</h1>
        <p className="text-muted">
          Reptile genetics and husbandry terms in plain English. Try them out in the{" "}
          <Link href="/genetics" className="text-brand hover:underline">genetics calculator</Link>.
        </p>
        <nav aria-label="Jump to letter" className="mt-3 flex flex-wrap gap-2 text-sm">
          {LETTERS.map((l) => (
            <a key={l} href={`#letter-${l.toLowerCase()}`} className="rounded-full border border-border bg-card px-3 py-1 hover:border-brand">
              {l}
            </a>
          ))}
        </nav>
      </header>
      {LETTERS.map((l) => (
        <section key={l} id={`letter-${l.toLowerCase()}`} className="scroll-mt-4">
          <h2 className="mb-3 text-2xl font-semibold">{l}</h2>
          <dl className="flex flex-col gap-3">
            {TERMS.filter((t) => t.term[0].toUpperCase() === l).map((t) => (
              <div key={t.term} id={termAnchor(t.term)} className="scroll-mt-4 rounded-lg border border-border bg-card p-4">
                <dt className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-semibold">
                    {t.term}
                    {t.aka && <span className="font-normal text-muted"> ({t.aka})</span>}
                  </span>
                  <span className="text-xs text-muted">{t.group}</span>
                </dt>
                <dd className="mt-1 text-sm">{t.def}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </article>
  );
}
