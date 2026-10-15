import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin | Reptilytics" };

// Landing page for admins: what needs attention, with cheap counts only
// (the library page itself is heavy, so it is no longer the entry point).
export default async function AdminHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  if (!me || !["moderator", "admin"].includes(me.role)) notFound();

  const [species, products, requests, emails, papers] = await Promise.all([
    supabase.from("species_submissions").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.rpc("fn36_feature_requests_admin"),
    supabase.from("outbound_emails").select("id", { count: "exact", head: true }).eq("status", "sent"),
    supabase.from("research_documents").select("id", { count: "estimated", head: true }),
  ]);
  const newRequests = (requests.data ?? []).filter((r) => r.status === "new").length;

  const cards = [
    { href: "/admin/species", label: "Species requests", value: species.count ?? 0, note: "waiting for review", alert: (species.count ?? 0) > 0 },
    { href: "/admin/requests", label: "Feature requests", value: newRequests, note: "new", alert: newRequests > 0 },
    { href: "/admin/products", label: "Products", value: products.count ?? 0, note: "suggested, waiting for review", alert: (products.count ?? 0) > 0 },
    { href: "/admin/email", label: "Email", value: emails.count ?? 0, note: "sent from info@" },
    { href: "/admin/library", label: "Research library", value: papers.count ?? 0, note: "papers (approx.)" },
  ];

  return (
    <section>
      <AdminNav current="/admin" />
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
