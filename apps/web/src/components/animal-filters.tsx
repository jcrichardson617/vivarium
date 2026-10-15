"use client";

import { useRef } from "react";

type Option = { value: string; label: string };

// Search, filter and sort controls for My animals. A plain GET form, so every
// view is a shareable, bookmarkable URL; dropdowns apply as soon as they change.
export function AnimalFilters({
  values,
  species,
  enclosures,
  tags,
}: {
  values: Record<string, string>;
  species: Option[];
  enclosures: Option[];
  tags: string[];
}) {
  const form = useRef<HTMLFormElement>(null);
  const submit = () => form.current?.requestSubmit();
  const select = (name: string, label: string, options: Option[], all = "All") => (
    <label className="flex flex-col gap-1 text-xs text-muted">
      {label}
      <select name={name} defaultValue={values[name] ?? ""} onChange={submit} className="field py-1 text-sm text-foreground">
        <option value="">{all}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <form ref={form} method="get" className="mb-4 flex flex-col gap-3 rounded-lg border border-border bg-card p-3">
      <div className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={values.q ?? ""}
          placeholder="Search name, code, species, enclosure or tag"
          className="field min-w-0 flex-1"
        />
        <button className="btn-primary shrink-0">Search</button>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {select("species", "Species", species)}
        {select("sex", "Sex", [
          { value: "male", label: "Male" },
          { value: "female", label: "Female" },
          { value: "unknown", label: "Unknown" },
        ])}
        {select(
          "status",
          "Status",
          [
            { value: "all", label: "All" },
            { value: "sold", label: "Sold" },
            { value: "deceased", label: "Deceased" },
            { value: "lost", label: "Lost" },
            { value: "on_loan", label: "On loan" },
          ],
          "Active",
        )}
        {select("enclosure", "Enclosure", [{ value: "none", label: "Not housed" }, ...enclosures])}
        {select("tag", "Tag", tags.map((t) => ({ value: t, label: t })))}
        {select("due", "Feeding", [{ value: "1", label: "Due to eat" }], "Any")}
        {select(
          "sort",
          "Sort",
          [
            { value: "code", label: "ID code" },
            { value: "newest", label: "Newest added" },
            { value: "age", label: "Oldest first" },
            { value: "due", label: "Next meal" },
          ],
          "Name",
        )}
        {select("view", "View", [{ value: "table", label: "Table" }], "Cards")}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="group" value="species" defaultChecked={values.group === "species"} onChange={submit} />
        Group by species
      </label>
    </form>
  );
}
