export function ProsePage({ title, updated, children }: { title: string; updated?: string; children: React.ReactNode }) {
  return (
    <article className="prose-page mx-auto max-w-2xl">
      <h1 className="mb-2 text-3xl font-bold">{title}</h1>
      {updated && <p className="mb-8 text-sm text-muted">Last updated {updated}</p>}
      {children}
    </article>
  );
}
