import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { analyticsConfigured, trafficBy } from "@/lib/vercel-analytics";

export const metadata: Metadata = { title: "Admin | Reptilytics" };

// Landing page for admins: what needs attention, with cheap counts only
// (the library page itself is heavy, so it is no longer the entry point).
export default async function AdminHome() {
  const supabase = await createClient();
  const { data: me } = await supabase.rpc("fn72_my_profile").single();
  if (!me || !["moderator", "admin"].includes(me.role)) notFound();

  // Page views over the last 7 UTC days; a Vercel outage must not break this page.
  const now = new Date();
  const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6));
  const views = analyticsConfigured()
    ? trafficBy("day", weekStart, now, 7)
        .then((rows) => rows.reduce((n, r) => n + r.pageviews, 0))
        .catch(() => null)
    : Promise.resolve(null);

  const [species, products, requests, emails, papers, notes, totals, pageviews, genes] = await Promise.all([
    supabase.from("species_submissions").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.rpc("fn36_feature_requests_admin"),
    supabase.from("outbound_emails").select("id", { count: "exact", head: true }).eq("status", "sent"),
    supabase.from("research_documents").select("id", { count: "estimated", head: true }),
    supabase.from("research_documents").select("id", { count: "exact", head: true }).eq("external_source", "herp_review").is("summary", null),
    me.role === "admin" ? supabase.rpc("fn78_admin_animal_stats") : Promise.resolve({ data: null }),
    views,
    supabase.from("genes").select("id", { count: "exact", head: true }).eq("verified", false),
  ]);
  const t = (totals.data ?? null) as { users: number; users_7d: number; animals: number; animals_7d: number } | null;
  const newRequests = (requests.data ?? []).filter((r) => r.status === "new").length;

  const cards = [
    ...(t
      ? [
          { href: "/admin/users", label: "Users", value: t.users, note: `${t.users_7d} joined this week` },
          { href: "/admin/animals", label: "Animals", value: t.animals, note: `${t.animals_7d} added this week` },
        ]
      : []),
    { href: "/admin/genes", label: "Genes", value: genes.count ?? 0, note: "not verified yet" },
    { href: "/admin/species", label: "Species requests", value: species.count ?? 0, note: "waiting for review", alert: (species.count ?? 0) > 0 },
    { href: "/admin/requests", label: "Feature requests", value: newRequests, note: "new", alert: newRequests > 0 },
    { href: "/admin/products", label: "Products", value: products.count ?? 0, note: "suggested, waiting for review", alert: (products.count ?? 0) > 0 },
    { href: "/admin/email", label: "Email", value: emails.count ?? 0, note: "sent from info@" },
    { href: "/admin/library", label: "Research library", value: papers.count ?? 0, note: "papers (approx.)" },
    { href: "/admin/notes?todo=1", label: "Natural history notes", value: notes.count ?? 0, note: "need a summary" },
    {
      href: "/admin/traffic",
      label: "Traffic",
      value: pageviews ?? 0,
      note: pageviews === null ? (analyticsConfigured() ? "couldn't load" : "not connected") : "page views, last 7 days",
    },
  ];

  return (
    <section>
      <h1 className="mb-6 text-2xl font-bold">Admin</h1>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <li key={c.href}>
            <Link
              href={c.href}
              className={`block rounded-lg border bg-card p-4 transition hover:border-brand ${c.alert ? "border-amber-500/60" : "border-border"}`}
            >
              <p className="text-sm text-muted">{c.label}</p>
              <p className="text-3xl font-bold">{c.value.toLocaleString("en-US")}</p>
              <p className="text-xs text-muted">{c.note}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
