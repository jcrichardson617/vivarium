import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { createClient } from "@/lib/supabase/server";
import { analyticsConfigured, trafficBy, type TrafficRow } from "@/lib/vercel-analytics";

export const metadata: Metadata = { title: "Traffic | Reptilytics" };

// 1 is the "Today" tab: the current UTC day so far.
const RANGES = [1, 7, 30, 90];
const rangeLabel = (r: number) => (r === 1 ? "Today" : `Last ${r} days`);
const DAY = 24 * 60 * 60 * 1000;

export default async function TrafficAdminPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const supabase = await createClient();
  const { data: me } = await supabase.rpc("fn72_my_profile").single();
  if (!me || !["moderator", "admin"].includes(me.role)) notFound();

  const requested = Number((await searchParams).days);
  const days = RANGES.includes(requested) ? requested : 30;

  const header = (
    <div>
      <AdminNav current="/admin/traffic" />
      <h1 className="text-2xl font-bold">Traffic</h1>
      <p className="text-muted">
        Page views on reptilytics.com from Vercel Web Analytics (production only, no cookies). Visitor counts are
        estimates and reset daily, so they can&apos;t be added up into unique people. Updates every 5 minutes.
      </p>
    </div>
  );

  if (!analyticsConfigured()) {
    return (
      <section className="flex flex-col gap-6">
        {header}
        <div className="rounded-lg border border-amber-500/60 bg-card p-4 text-sm">
          <p className="font-semibold">Not connected yet.</p>
          <ol className="mt-2 list-decimal pl-5 text-muted">
            <li>Vercel → Account Settings → Tokens → Create, with scope set to the &quot;vivarium&quot; team.</li>
            <li>Vercel → vivarium-herpatlas → Settings → Environment Variables: add VERCEL_ANALYTICS_TOKEN (Production).</li>
            <li>Redeploy.</li>
          </ol>
        </div>
      </section>
    );
  }

  // Whole UTC days, ending today.
  const until = new Date();
  const since = new Date(Date.UTC(until.getUTCFullYear(), until.getUTCMonth(), until.getUTCDate()) - (days - 1) * DAY);

  let daily: TrafficRow[], pages: TrafficRow[], referrers: TrafficRow[], countries: TrafficRow[], devices: TrafficRow[];
  try {
    [daily, pages, referrers, countries, devices] = await Promise.all([
      trafficBy("day", since, until, 100),
      trafficBy("requestPath", since, until, 15),
      trafficBy("referrerHostname", since, until, 10),
      trafficBy("country", since, until, 10),
      trafficBy("deviceType", since, until, 5),
    ]);
  } catch (e) {
    return (
      <section className="flex flex-col gap-6">
        {header}
        <p className="rounded-md bg-red-500/10 p-3 text-sm text-red-600">{(e as Error).message}</p>
      </section>
    );
  }

  // The API skips days with no views; fill them in so the chart has no gaps.
  const byDay = new Map(daily.map((d) => [d.key.slice(0, 10), d]));
  const series = Array.from({ length: days }, (_, i) => {
    const key = new Date(since.getTime() + i * DAY).toISOString().slice(0, 10);
    // Keep just the date: the API's keys are full timestamps.
    return { ...(byDay.get(key) ?? { pageviews: 0, visitors: 0 }), key };
  });
  const totalViews = series.reduce((n, d) => n + d.pageviews, 0);
  const avgVisitors = Math.round(series.reduce((n, d) => n + d.visitors, 0) / days);
  const today = series[series.length - 1];
  const peak = Math.max(1, ...series.map((d) => d.pageviews));
  const shortDate = (key: string) =>
    new Date(`${key}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

  const countryName = new Intl.DisplayNames(["en"], { type: "region" });

  return (
    <section className="flex flex-col gap-6">
      {header}

      <div className="flex gap-3 text-sm">
        {RANGES.map((r) =>
          r === days ? (
            <span key={r} className="font-semibold">{rangeLabel(r)}</span>
          ) : (
            <Link key={r} href={`/admin/traffic?days=${r}`} className="text-muted hover:text-foreground">{rangeLabel(r)}</Link>
          ),
        )}
      </div>

      {days === 1 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          <Stat label="Page views" value={today.pageviews} note={`today so far (${shortDate(today.key)}, UTC day)`} />
          <Stat label="Visitors" value={today.visitors} note="today so far (estimate)" />
        </ul>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-3">
          <Stat label="Page views" value={totalViews} note={`last ${days} days`} />
          <Stat label="Visitors per day" value={avgVisitors} note="average" />
          <Stat label="Today" value={today.pageviews} note={`page views · ${today.visitors.toLocaleString("en-US")} visitors (UTC day)`} />
        </ul>
      )}

      {/* A one-bar chart says nothing, so Today skips it. */}
      {days > 1 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">Page views per day</h2>
            <span className="text-xs text-muted">peak {peak.toLocaleString("en-US")}</span>
          </div>
          <div className="flex h-40 items-end gap-px">
            {series.map((d) => (
              <div
                key={d.key}
                title={`${shortDate(d.key)}: ${d.pageviews.toLocaleString("en-US")} views, ${d.visitors.toLocaleString("en-US")} visitors`}
                className="flex-1 rounded-t-sm bg-brand hover:bg-brand-dark"
                style={{ height: `${(d.pageviews / peak) * 100}%`, minHeight: d.pageviews ? 2 : 0 }}
              />
            ))}
          </div>
          {/* A date under every bar for a week or two; just the ends for longer ranges. */}
          {days <= 14 ? (
            <div className="mt-1 flex gap-px text-xs text-muted">
              {series.map((d) => (
                <span key={d.key} className="flex-1 text-center">{shortDate(d.key)}</span>
              ))}
            </div>
          ) : (
            <div className="mt-1 flex justify-between text-xs text-muted">
              <span>{shortDate(series[0].key)}</span>
              <span>{shortDate(today.key)}</span>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Breakdown title="Top pages" rows={pages} />
        <Breakdown title="Where visitors came from" rows={referrers} label={(k) => k || "Direct / unknown"} />
        <Breakdown title="Countries" rows={countries} label={(k) => (k ? (countryName.of(k) ?? k) : "Unknown")} />
        <Breakdown title="Devices" rows={devices} label={(k) => (k ? k[0].toUpperCase() + k.slice(1) : "Unknown")} />
      </div>
    </section>
  );
}

function Stat({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <li className="rounded-lg border border-border bg-card p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="text-3xl font-bold">{value.toLocaleString("en-US")}</p>
      <p className="text-xs text-muted">{note}</p>
    </li>
  );
}

function Breakdown({ title, rows, label = (k) => k }: { title: string; rows: TrafficRow[]; label?: (key: string) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.pageviews));
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {!rows.length && <p className="text-sm text-muted">No data yet.</p>}
      <ul className="flex flex-col gap-1 text-sm">
        {rows.map((r) => (
          <li key={r.key} className="relative flex justify-between gap-3 rounded px-2 py-1">
            <span className="absolute inset-y-0 left-0 rounded bg-brand/10" style={{ width: `${(r.pageviews / max) * 100}%` }} />
            <span className="relative truncate">{label(r.key)}</span>
            <span className="relative shrink-0 tabular-nums">{r.pageviews.toLocaleString("en-US")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
