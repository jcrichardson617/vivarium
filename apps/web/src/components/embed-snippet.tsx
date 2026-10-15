"use client";

import { useState } from "react";
import { SITE_URL } from "@/lib/site";

// "Add this calculator to your website": a copy-paste iframe with a visible
// credit link (the link lives in the host page, not inside the iframe).
export function EmbedSnippet({ species }: { species: { slug: string; name: string }[] }) {
  const [slug, setSlug] = useState(species.find((s) => s.slug === "ball-python")?.slug ?? species[0].slug);
  const [copied, setCopied] = useState(false);
  const name = species.find((s) => s.slug === slug)?.name ?? "Reptile";
  const code = `<iframe id="reptilytics-genetics" src="${SITE_URL}/embed/genetics?species=${slug}" title="${name} genetics calculator" style="width:100%;min-height:640px;border:0" loading="lazy"></iframe>
<p style="font-size:12px"><a href="${SITE_URL}/genetics?species=${slug}">${name} genetics calculator</a> by <a href="${SITE_URL}">Reptilytics</a></p>
<script>window.addEventListener("message",function(e){if(e.origin==="${SITE_URL}"&&e.data&&e.data.reptilyticsHeight){document.getElementById("reptilytics-genetics").style.height=e.data.reptilyticsHeight+"px"}});</script>`;

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <h2 className="text-lg font-semibold">Add this calculator to your website</h2>
      <p className="text-sm text-muted">
        Free for breeders, clubs and care sites. Paste this code into your page; it resizes itself to fit.
      </p>
      <label className="flex flex-col gap-1 text-sm">
        Start on
        <select className="field" value={slug} onChange={(e) => setSlug(e.target.value)}>
          {species.map((s) => (
            <option key={s.slug} value={s.slug}>{s.name}</option>
          ))}
        </select>
      </label>
      <textarea readOnly value={code} rows={5} className="field font-mono text-xs" onFocus={(e) => e.target.select()} />
      <button
        type="button"
        className="btn-secondary self-start text-sm"
        onClick={async () => {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? "Copied ✓" : "Copy code"}
      </button>
    </section>
  );
}
