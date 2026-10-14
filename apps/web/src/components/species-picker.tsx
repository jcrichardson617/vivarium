"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Species = {
  id: string;
  common_name: string | null;
  scientific_name: string;
  matched_alias: string | null;
};

// Type-ahead species search. Writes the chosen species id to a hidden input, or,
// when the species is missing, switches the form into "request a new species" mode.
export function SpeciesPicker() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Species[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Species | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [active, setActive] = useState(0);
  const supabase = useRef(createClient());

  useEffect(() => {
    if (selected || query.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const { data } = await supabase.current.rpc("fn35_search_species", { p_query: query });
      if (!cancelled) {
        const term = query.trim().toLowerCase();
        // Names that start with the search term first, then alphabetical.
        const sorted = (data ?? []).sort((a, b) => {
          const aStarts = (a.common_name ?? "").toLowerCase().startsWith(term) ? 0 : 1;
          const bStarts = (b.common_name ?? "").toLowerCase().startsWith(term) ? 0 : 1;
          return aStarts - bStarts || (a.common_name ?? "").localeCompare(b.common_name ?? "");
        });
        setResults(sorted.slice(0, 8));
        setActive(0);
        setOpen(true);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, selected]);

  function choose(species: Species) {
    setSelected(species);
    setQuery(`${species.common_name ?? species.scientific_name}`);
    setOpen(false);
  }

  if (requesting) {
    return (
      <fieldset className="flex flex-col gap-3 rounded-md border border-border p-3">
        <legend className="px-1 text-sm font-medium">Request a new species</legend>
        <input type="hidden" name="mode" value="request" />
        <label className="flex flex-col gap-1 text-sm">
          Scientific name
          <input
            name="request_scientific_name"
            required
            defaultValue={query}
            placeholder="e.g. Morelia viridis"
            pattern="\s*[A-Za-z]+\s+[A-Za-z]+(\s+[A-Za-z]+)?\s*"
            title="Genus and species, e.g. Morelia viridis"
            className="field"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Common name (optional)
          <input name="request_common_name" placeholder="e.g. Green tree python" className="field" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Type
          <select name="request_taxon_class" defaultValue="Reptilia" className="field">
            <option value="Reptilia">Reptile</option>
            <option value="Amphibia">Amphibian</option>
          </select>
        </label>
        <p className="text-xs text-muted">
          Your animal is saved now and linked to the species once a moderator approves it.
        </p>
        <button type="button" onClick={() => setRequesting(false)} className="self-start text-sm text-brand hover:underline">
          Back to search
        </button>
      </fieldset>
    );
  }

  return (
    <div className="relative flex flex-col gap-1 text-sm">
      <label htmlFor="species-search">Species</label>
      <input type="hidden" name="mode" value="existing" />
      <input type="hidden" name="species_id" value={selected?.id ?? ""} />
      <input
        id="species-search"
        role="combobox"
        aria-expanded={open}
        aria-controls="species-results"
        autoComplete="off"
        required
        placeholder="Start typing, e.g. ball python or Python regius"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setSelected(null);
        }}
        onFocus={() => results.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!open || !results.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            choose(results[active]);
          }
        }}
        className="field"
      />
      {selected && <p className="text-xs text-muted italic">{selected.scientific_name}</p>}
      {/* Block submission until a listed species is chosen. */}
      {!selected && query && (
        <input tabIndex={-1} aria-hidden="true" required value="" onChange={() => {}} className="sr-only" title="Choose a species from the list" />
      )}

      {open && query.trim().length >= 2 && (
        <ul
          id="species-results"
          role="listbox"
          className="absolute top-full z-10 mt-1 w-full overflow-hidden rounded-md border border-border bg-card shadow-lg"
        >
          {results.map((s, i) => (
            <li
              key={s.id}
              role="option"
              aria-selected={i === active}
              onMouseDown={() => choose(s)}
              className={`cursor-pointer px-3 py-2 ${i === active ? "bg-brand/10" : ""}`}
            >
              <span className="font-medium">{s.common_name ?? s.scientific_name}</span>{" "}
              <span className="italic text-muted">{s.scientific_name}</span>
              {s.matched_alias && <span className="block text-xs text-muted">Also known as {s.matched_alias}</span>}
            </li>
          ))}
          <li
            role="option"
            aria-selected={false}
            onMouseDown={() => setRequesting(true)}
            className="cursor-pointer border-t border-border px-3 py-2 text-brand"
          >
            {results.length ? "Not listed? " : "No matches. "}Request a new species
          </li>
        </ul>
      )}
    </div>
  );
}
