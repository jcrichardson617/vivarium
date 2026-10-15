import { categoryLabel } from "@/lib/gear";

type Item = {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  note: string | null;
  amazon_url: string | null;
  chewy_url: string | null;
  other_url: string | null;
  keepers: number;
};

// Anonymous, aggregated gear for a species, ranked purely by how many keepers use it.
export function PopularGear({ items, name }: { items: Item[]; name: string }) {
  if (!items.length) return null;
  const hasLinks = items.some((i) => i.amazon_url || i.chewy_url || i.other_url);
  const link = (href: string, label: string) => (
    <a href={href} target="_blank" rel="sponsored nofollow noopener" className="btn-secondary px-2 py-1 text-xs">
      {label}
    </a>
  );

  return (
    <section>
      <h2 className="mb-1 text-2xl font-semibold">Popular with {name.toLowerCase()} keepers</h2>
      <p className="mb-4 text-sm text-muted">What Reptilytics keepers use with their {name.toLowerCase()}s, ranked by how many use it.</p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((i) => (
          <li key={i.id} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 text-sm">
            <div>
              <p className="font-medium">{i.name}</p>
              <p className="text-xs text-muted">
                {categoryLabel(i.category)} · used by {Number(i.keepers)} keepers
              </p>
            </div>
            {i.note && <p className="text-xs text-amber-700 dark:text-amber-400">⚠️ {i.note}</p>}
            {(i.amazon_url || i.chewy_url || i.other_url) && (
              <div className="flex flex-wrap gap-2">
                {i.amazon_url && link(i.amazon_url, "Amazon")}
                {i.chewy_url && link(i.chewy_url, "Chewy")}
                {i.other_url && link(i.other_url, "Buy")}
              </div>
            )}
          </li>
        ))}
      </ul>
      {hasLinks && (
        <p className="mt-2 text-xs text-muted">
          Reptilytics may earn a commission from purchases made through these links. Rankings are never affected by it.
        </p>
      )}
    </section>
  );
}
