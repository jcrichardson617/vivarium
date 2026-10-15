import Link from "next/link";

export type Paper = {
  id: string;
  title: string;
  source_url: string;
  publisher: string | null;
  published_date: string | null;
  authors: string[];
  license: string | null;
  excerpt: string | null;
  species?: { name: string; slug: string }[];
};

// Abstract excerpts are shown only where the license allows commercial reuse.
const REUSABLE = /^cc(0| by| by-sa)$/;

function excerpt(p: Paper) {
  if (!p.license || !REUSABLE.test(p.license) || !p.excerpt) return null;
  const text = p.excerpt.replace(/\s+/g, " ").trim();
  return text.length > 300 ? `${text.slice(0, 300).replace(/\s\S*$/, "")}…` : text;
}

function authorLine(authors: string[]) {
  if (!authors.length) return null;
  return authors.length > 3 ? `${authors.slice(0, 3).join(", ")} et al.` : authors.join(", ");
}

export function PaperList({ papers }: { papers: Paper[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {papers.map((p) => {
        const ex = excerpt(p);
        return (
          <li key={p.id} className="rounded-lg border border-border bg-card p-4 text-sm">
            <a href={p.source_url} target="_blank" rel="noreferrer" className="font-medium hover:text-brand">
              {p.title}
            </a>
            <p className="mt-1 text-xs text-muted">
              {[authorLine(p.authors), p.publisher, p.published_date?.slice(0, 7)].filter(Boolean).join(" · ")}
              {p.license?.startsWith("cc") ? " · open access" : ""}
            </p>
            {ex && <p className="mt-2 text-muted">{ex}</p>}
            {!!p.species?.length && (
              <p className="mt-2 flex flex-wrap gap-1">
                {p.species.map((s) => (
                  <Link key={s.slug} href={`/species/${s.slug}/research`} className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand-dark hover:underline">
                    {s.name}
                  </Link>
                ))}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function Pager({ base, page, hasMore }: { base: string; page: number; hasMore: boolean }) {
  if (page <= 1 && !hasMore) return null;
  return (
    <nav className="flex items-center justify-between text-sm">
      {page > 1 ? <Link href={page === 2 ? base : `${base}?page=${page - 1}`} className="text-brand hover:underline">← Newer</Link> : <span />}
      <span className="text-muted">Page {page}</span>
      {hasMore ? <Link href={`${base}?page=${page + 1}`} className="text-brand hover:underline">Older →</Link> : <span />}
    </nav>
  );
}
