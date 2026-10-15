import Link from "next/link";

type Step = { done: boolean; title: string; body: string; href: string; cta: string };

// Shown on My animals until all three first steps are done.
export function GettingStarted({ animalCount, enclosureCount, hasReminder, firstAnimalId }: {
  animalCount: number;
  enclosureCount: number;
  hasReminder: boolean;
  firstAnimalId?: string;
}) {
  const steps: Step[] = [
    { done: animalCount > 0, title: "Add your first animal", body: "Name, species, sex and hatch date. Photos optional.", href: "/animals/new", cta: "Add animal" },
    { done: enclosureCount > 0, title: "Set up an enclosure", body: "Size, temperatures and gear, then house your animal in it.", href: "/enclosures/new", cta: "Add enclosure" },
    {
      done: hasReminder,
      title: "Turn on feeding reminders",
      body: "Set how often an animal eats and we'll flag when it's due.",
      href: firstAnimalId ? `/animals/${firstAnimalId}/edit` : "/animals/new",
      cta: "Set interval",
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;

  return (
    <div className="mb-6 rounded-lg border border-border bg-card p-5">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="font-semibold">Get started</h2>
        <span className="text-sm text-muted">{doneCount} of {steps.length} done</span>
      </div>
      <ol className="flex flex-col gap-3">
        {steps.map((s, i) => (
          <li key={s.title} className="flex items-center gap-3">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                s.done ? "bg-brand text-white" : "border border-border text-muted"
              }`}
            >
              {s.done ? "✓" : i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium ${s.done ? "text-muted line-through" : ""}`}>{s.title}</p>
              {!s.done && <p className="text-xs text-muted">{s.body}</p>}
            </div>
            {!s.done && (
              <Link href={s.href} className="btn-secondary shrink-0 px-3 py-1 text-sm">
                {s.cta}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
