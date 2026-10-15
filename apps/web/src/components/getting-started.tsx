import Link from "next/link";
import { skipOnboarding } from "@/app/animals/onboarding-actions";

type Step = { key: string; done: boolean; title: string; body: string; href: string; cta: string };

// Shown on My animals until every step is done or skipped. Skips are saved
// on the profile, so a dismissed step or checklist never comes back.
export function GettingStarted({ animalCount, enclosureCount, hasReminder, firstAnimalId, skipped }: {
  animalCount: number;
  enclosureCount: number;
  hasReminder: boolean;
  firstAnimalId?: string;
  skipped: string[];
}) {
  if (skipped.includes("all")) return null;
  const steps: Step[] = [
    { key: "animal", done: animalCount > 0, title: "Add your first animal", body: "Name, species, sex and hatch date. Photos optional.", href: "/animals/new", cta: "Add animal" },
    { key: "enclosure", done: enclosureCount > 0, title: "Set up an enclosure", body: "Size, temperatures and gear, then house your animal in it.", href: "/enclosures/new", cta: "Add enclosure" },
    {
      key: "reminder",
      done: hasReminder,
      title: "Turn on feeding reminders",
      body: "Set how often an animal eats and we'll flag when it's due.",
      href: firstAnimalId ? `/animals/${firstAnimalId}/edit` : "/animals/new",
      cta: "Set interval",
    },
  ];
  const settled = (s: Step) => s.done || skipped.includes(s.key);
  const doneCount = steps.filter(settled).length;
  if (doneCount === steps.length) return null;

  return (
    <div className="mb-6 rounded-lg border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-semibold">Get started</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">{doneCount} of {steps.length} done</span>
          <form action={skipOnboarding}>
            <input type="hidden" name="step" value="all" />
            <button className="text-lg leading-none text-muted hover:text-foreground" aria-label="Hide this checklist" title="Hide this checklist">
              ✕
            </button>
          </form>
        </div>
      </div>
      <ol className="flex flex-col gap-3">
        {steps.map((s, i) => {
          const skippedStep = !s.done && skipped.includes(s.key);
          return (
            <li key={s.key} className="flex items-center gap-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  s.done ? "bg-brand text-white" : "border border-border text-muted"
                }`}
              >
                {s.done ? "✓" : skippedStep ? "–" : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${settled(s) ? "text-muted line-through" : ""}`}>
                  {s.title}
                  {skippedStep && <span className="ml-1 text-xs font-normal no-underline">(skipped)</span>}
                </p>
                {!settled(s) && <p className="text-xs text-muted">{s.body}</p>}
              </div>
              {!settled(s) && (
                <div className="flex shrink-0 items-center gap-2">
                  <Link href={s.href} className="btn-secondary px-3 py-1 text-sm">
                    {s.cta}
                  </Link>
                  <form action={skipOnboarding}>
                    <input type="hidden" name="step" value={s.key} />
                    <button className="text-xs text-muted hover:text-foreground hover:underline">Skip</button>
                  </form>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
