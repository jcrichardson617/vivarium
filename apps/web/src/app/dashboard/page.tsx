import type { Metadata } from "next";
import Link from "next/link";
import { FeedingChart } from "@/components/feeding-chart";
import { DUE_TONE_CLASS, feedingDue, feedingSchedulesOn } from "@/lib/feeding";
import { speciesSlug } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";
import { quickFeed } from "./actions";

export const metadata: Metadata = { title: "Dashboard | Reptilytics", robots: { index: false } };

type Dashboard = {
  active: number;
  meals_week: number;
  accepted_week: number;
  feeding_days: { day: string; fed: number; refused: number }[];
  watch: { id: string; name: string; reason: string }[];
  no_weight: { id: string; name: string; last: string | null }[];
  incubating_clutches: number;
  hatching_soon: { id: string; female: string; male: string; expected: string; eggs: number }[];
  activity: { animal_id: string; name: string; kind: string; detail: string; at: string }[];
  papers: { common_name: string | null; scientific_name: string; count: number; top: { title: string; url: string }[] }[];
};

const KIND_ICON: Record<string, string> = { feeding: "🍽️", weight: "⚖️", shed: "🐍", health: "🩺", note: "📝" };
const TODAY_LIMIT = 12;

export default async function DashboardPage() {
  const supabase = await createClient();
  const [{ data: raw, error }, { data: animals }, schedules] = await Promise.all([
    supabase.rpc("fn61_dashboard"),
    supabase.rpc("fn67_my_animals"),
    feedingSchedulesOn(supabase),
  ]);
  if (error) return <p className="text-red-600">Could not load the dashboard: {error.message}</p>;
  const d = raw as unknown as Dashboard;

  // Due or overdue to eat, most overdue first. Includes animals you look after for someone else.
  const due = (animals ?? [])
    .filter((a) => schedules && a.status === "active" && a.access !== "viewer")
    .map((a) => ({ ...a, due: feedingDue(a.last_fed_at, a.feeding_interval_days) }))
    .filter((a) => a.due && a.due.days <= 0)
    .sort((x, y) => x.due!.days - y.due!.days);
  const acceptRate = d.meals_week ? Math.round((100 * d.accepted_week) / d.meals_week) : null;
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  if (d.active === 0) {
    return (
      <section className="py-8 text-center">
        <h1 className="mb-2 text-2xl font-bold">Dashboard</h1>
        <p className="mb-6 text-muted">Add your first animal and this page fills up with what needs doing each day.</p>
        <Link href="/animals/new" className="btn-primary">Add your first animal</Link>
      </section>
    );
  }

  const tiles = [
    { label: "Active animals", value: String(d.active), href: "/animals" },
    { label: "Meals this week", value: String(d.meals_week), note: acceptRate === null ? "none logged" : `${acceptRate}% eaten` },
    { label: "Clutches incubating", value: String(d.incubating_clutches), href: "/breeding" },
    { label: "Need attention", value: String(d.watch.length), alert: d.watch.length > 0, note: d.watch.length ? "see watch list" : "all good" },
  ];

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted">{today}</p>
        </div>
        <Link href="/animals/new" className="btn-primary">Add animal</Link>
      </div>

      {/* Today: the things to do now. */}
      <div className="rounded-lg border border-border border-l-4 border-l-accent bg-card p-4">
        <h2 className="mb-3 font-semibold">Today</h2>
        {due.length === 0 && !d.hatching_soon.length && (
          <p className="text-sm text-muted">Nothing due right now. Nice.</p>
        )}
        {due.length > 0 && (
          <>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Due to eat ({due.length})
            </p>
            <ul className="divide-y divide-border">
              {due.slice(0, TODAY_LIMIT).map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-2 py-2">
                  <Link href={`/animals/${a.id}`} className="min-w-0 flex-1 truncate font-medium hover:text-brand">
                    {a.name ?? "Unnamed"}
                    <span className="ml-1 text-sm font-normal text-muted">{a.species_common_name}</span>
                  </Link>
                  <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${DUE_TONE_CLASS[a.due!.tone]}`}>
                    {a.due!.label}
                  </span>
                  <form action={quickFeed} className="flex gap-1">
                    <input type="hidden" name="animal_id" value={a.id} />
                    <button name="result" value="fed" className="rounded-md bg-brand px-2.5 py-1 text-sm font-medium text-white hover:bg-brand-dark">
                      Fed ✓
                    </button>
                    <button name="result" value="refused" className="rounded-md border border-border px-2.5 py-1 text-sm hover:border-accent">
                      Refused
                    </button>
                  </form>
                </li>
              ))}
            </ul>
            {due.length > TODAY_LIMIT && (
              <Link href="/animals?due=1&view=table" className="mt-2 inline-block text-sm text-brand hover:underline">
                See all {due.length} due →
              </Link>
            )}
            <p className="mt-2 text-xs text-muted">Fed ✓ logs the same meal as last time. For details, log it on the animal&apos;s page.</p>
          </>
        )}
        {d.hatching_soon.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Hatching this week</p>
            <ul className="flex flex-col gap-1 text-sm">
              {d.hatching_soon.map((c) => (
                <li key={c.id}>
                  🥚 <Link href="/breeding" className="hover:text-brand">{c.female} × {c.male}</Link>: {c.eggs} egg{c.eggs === 1 ? "" : "s"},
                  due {new Date(`${c.expected}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => {
          const body = (
            <>
              <p className="text-xs text-muted">{t.label}</p>
              <p className={`text-3xl font-bold ${t.alert ? "text-accent-ink" : ""}`}>{t.value}</p>
              {t.note && <p className="text-xs text-muted">{t.note}</p>}
            </>
          );
          const cls = `block h-full rounded-lg border bg-card p-4 ${t.alert ? "border-accent" : "border-border"}`;
          return (
            <li key={t.label}>
              {t.href ? <Link href={t.href} className={`${cls} transition hover:border-brand`}>{body}</Link> : <div className={cls}>{body}</div>}
            </li>
          );
        })}
      </ul>

      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 font-semibold">Feeding</h2>
        <FeedingChart days={d.feeding_days} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-3 font-semibold">Watch list</h2>
          {d.watch.length === 0 ? (
            <p className="text-sm text-muted">No refusal streaks or weight drops. We flag animals that refuse two meals in a row or lose more than 10% of their weight.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {d.watch.map((w) => (
                <li key={`${w.id}-${w.reason}`} className="flex items-center justify-between gap-2">
                  <Link href={`/animals/${w.id}`} className="font-medium hover:text-brand">⚠ {w.name}</Link>
                  <span className="text-accent-ink">{w.reason}</span>
                </li>
              ))}
            </ul>
          )}
          {d.no_weight.length > 0 && (
            <p className="mt-3 border-t border-border pt-3 text-sm text-muted">
              ⚖️ {d.no_weight.length} animal{d.no_weight.length === 1 ? " hasn't" : "s haven't"} been weighed in 30+ days
              {": "}
              {d.no_weight.slice(0, 4).map((a, i) => (
                <span key={a.id}>
                  {i > 0 && ", "}
                  <Link href={`/animals/${a.id}`} className="text-foreground hover:text-brand">{a.name}</Link>
                </span>
              ))}
              {d.no_weight.length > 4 && ` and ${d.no_weight.length - 4} more`}.
            </p>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-3 font-semibold">Recent activity</h2>
          {d.activity.length === 0 ? (
            <p className="text-sm text-muted">Nothing logged yet. Feedings, weights, sheds and notes show up here.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {d.activity.map((a, i) => (
                <li key={i} className="flex items-baseline gap-2">
                  <span aria-hidden>{KIND_ICON[a.kind] ?? "•"}</span>
                  <span className="min-w-0 flex-1 truncate">
                    <Link href={`/animals/${a.animal_id}`} className="font-medium hover:text-brand">{a.name}</Link>{" "}
                    <span className="text-muted">{a.detail}</span>
                  </span>
                  <time className="shrink-0 text-xs text-muted">{ago(a.at)}</time>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {d.papers.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-3 font-semibold">New research for your species</h2>
          <div className="flex flex-col gap-4">
            {d.papers.map((s) => {
              const name = s.common_name || s.scientific_name;
              return (
                <div key={s.scientific_name}>
                  <p className="text-sm">
                    <strong>{name}</strong>{" "}
                    <span className="text-muted">· {s.count} new paper{s.count === 1 ? "" : "s"} this week</span>
                  </p>
                  <ul className="mt-1 flex flex-col gap-1 text-sm">
                    {s.top.map((p) => (
                      <li key={p.url} className="truncate">
                        <a href={p.url} target="_blank" rel="noopener noreferrer" className="hover:text-brand hover:underline">{p.title}</a>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/species/${speciesSlug({ common_name: s.common_name, scientific_name: s.scientific_name })}/research`}
                    className="mt-1 inline-block text-sm text-brand hover:underline"
                  >
                    All {name} research →
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function ago(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days < 30 ? `${days}d ago` : new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
