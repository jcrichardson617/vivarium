"use client";

import Link from "next/link";
import { useState } from "react";

export type DirectoryEntry = {
  slug: string;
  name: string;
  scientific: string;
  group: "Reptiles" | "Amphibians";
  aliases: string[];
  genes: number;
  papers: number;
};

export function SpeciesDirectory({ entries }: { entries: DirectoryEntry[] }) {
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const shown = term
    ? entries.filter((e) => [e.name, e.scientific, ...e.aliases].some((t) => t.toLowerCase().includes(term)))
    : entries;

  return (
    <div className="flex flex-col gap-8">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by common or scientific name"
        className="field"
        aria-label="Search species"
      />
      {(["Reptiles", "Amphibians"] as const).map((group) => {
        const list = shown.filter((e) => e.group === group);
        if (!list.length) return null;
        return (
          <div key={group}>
            <h2 className="mb-3 text-xl font-semibold">{group}</h2>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((e) => (
                <li key={e.slug}>
                  <Link href={`/species/${e.slug}`} className="block h-full rounded-md border border-border bg-card px-3 py-2 hover:border-brand">
                    <span className="font-medium">{e.name}</span>
                    <span className="block text-xs italic text-muted">{e.scientific}</span>
                    {(e.genes > 0 || e.papers > 0) && (
                      <span className="mt-1 flex flex-wrap gap-1">
                        {e.genes > 0 && (
                          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand-dark">
                            {e.genes} morphs · calculator
                          </span>
                        )}
                        {e.papers > 0 && (
                          <span className="rounded-full bg-border/60 px-2 py-0.5 text-[11px] font-medium text-muted">
                            {e.papers.toLocaleString()} paper{e.papers === 1 ? "" : "s"}
                          </span>
                        )}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      {!shown.length && <p className="text-muted">No species match &ldquo;{q}&rdquo;.</p>}
    </div>
  );
}
