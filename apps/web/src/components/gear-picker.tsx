"use client";

import { useState } from "react";
import { GEAR_CATEGORIES } from "@/lib/gear";

type Product = { id: string; name: string; brand: string | null; category: string; blocked: boolean; note: string | null };

// Category → product, or "not listed" to suggest a new product.
export function GearPicker({ enclosureId, products, action }: { enclosureId: string; products: Product[]; action: (f: FormData) => void }) {
  const [category, setCategory] = useState("lighting");
  const [productId, setProductId] = useState("");
  const list = products.filter((p) => p.category === category && !p.blocked);
  const chosen = products.find((p) => p.id === productId);
  const custom = productId === "__new";

  return (
    <form action={action} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <input type="hidden" name="enclosure_id" value={enclosureId} />
      <input type="hidden" name="category" value={category} />
      <div className="grid gap-3 sm:grid-cols-2">
        <select
          className="field"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setProductId("");
          }}
          aria-label="Category"
        >
          {GEAR_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select className="field" name={custom ? undefined : "product_id"} value={productId} onChange={(e) => setProductId(e.target.value)} aria-label="Product">
          <option value="">Choose a product…</option>
          {list.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
          <option value="__new">Not listed: add it…</option>
        </select>
      </div>
      {custom && (
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="new_name" required maxLength={120} placeholder="Product name" className="field" />
          <input name="new_brand" maxLength={80} placeholder="Brand (optional)" className="field" />
          <p className="text-xs text-muted sm:col-span-2">New products are reviewed before they appear for other keepers.</p>
        </div>
      )}
      {chosen?.note && <p className="rounded-md bg-amber-500/15 p-2 text-sm text-amber-800 dark:text-amber-300">⚠️ {chosen.note}</p>}
      <button className="btn-primary self-start" disabled={!productId}>Add gear</button>
    </form>
  );
}
