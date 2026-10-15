import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { GEAR_CATEGORIES } from "@/lib/gear";
import { createClient } from "@/lib/supabase/server";
import { mergeProduct, saveProduct } from "./actions";

export const metadata: Metadata = { title: "Products | Reptilytics" };

export default async function ProductsAdminPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string; all?: string }> }) {
  const { error, saved, all } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  if (!me || !["moderator", "admin"].includes(me.role)) notFound();

  const { data: products } = await supabase.from("products").select("*").neq("status", "rejected").order("status", { ascending: false }).order("name");
  const pending = (products ?? []).filter((p) => p.status === "pending");
  const shown = all ? (products ?? []) : pending;
  const approved = (products ?? []).filter((p) => p.status === "approved");

  return (
    <section className="flex flex-col gap-6">
      <div>
        <AdminNav current="/admin/products" />
        <h1 className="text-2xl font-bold">Products</h1>
        <p className="text-muted">
          Review products keepers suggest, merge duplicates, block unsafe items and add affiliate links (include your
          affiliate tag in the URL). Links must start with https://.
        </p>
      </div>
      {error && <p className="rounded-md bg-red-500/10 p-3 text-sm text-red-600">{error}</p>}
      {saved && <p className="rounded-md bg-brand/10 p-3 text-sm text-brand-dark">Saved ✓</p>}
      <p className="text-sm">
        {all ? (
          <a href="/admin/products" className="text-brand hover:underline">Show only pending ({pending.length})</a>
        ) : (
          <>
            {pending.length} pending ·{" "}
            <a href="/admin/products?all=1" className="text-brand hover:underline">Show all {products?.length ?? 0} products</a>
          </>
        )}
      </p>
      {!shown.length && <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted">Nothing to review.</p>}
      <ul className="flex flex-col gap-4">
        {shown.map((p) => (
          <li key={p.id} className="rounded-lg border border-border bg-card p-4 text-sm">
            <form action={saveProduct} className="grid gap-2 sm:grid-cols-2">
              <input type="hidden" name="id" value={p.id} />
              <input name="name" defaultValue={p.name} className="field" aria-label="Name" />
              <input name="brand" defaultValue={p.brand ?? ""} placeholder="Brand" className="field" aria-label="Brand" />
              <select name="category" defaultValue={p.category} className="field" aria-label="Category">
                {GEAR_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <select name="status" defaultValue={p.status} className="field" aria-label="Status">
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <input name="note" defaultValue={p.note ?? ""} placeholder="Public note (e.g. outdated)" className="field sm:col-span-2" />
              <input name="amazon_url" defaultValue={p.amazon_url ?? ""} placeholder="Amazon link" className="field" />
              <input name="chewy_url" defaultValue={p.chewy_url ?? ""} placeholder="Chewy link" className="field" />
              <input name="other_url" defaultValue={p.other_url ?? ""} placeholder="Other store link" className="field" />
              <label className="flex items-center gap-2">
                <input type="checkbox" name="blocked" defaultChecked={p.blocked} /> Blocked (unsafe)
              </label>
              <input name="block_reason" defaultValue={p.block_reason ?? ""} placeholder="Why it's blocked" className="field sm:col-span-2" />
              <button className="btn-primary self-start">Save</button>
            </form>
            {p.status === "pending" && (
              <form action={mergeProduct} className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                <input type="hidden" name="id" value={p.id} />
                <span className="text-muted">Duplicate of</span>
                <select name="into" required defaultValue="" className="field py-1">
                  <option value="" disabled>Choose product…</option>
                  {approved.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                <button className="btn-secondary py-1 text-sm">Merge</button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
